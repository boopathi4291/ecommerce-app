import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.catalog import CATALOG
from app.database import SessionLocal, initialize_database
from app.main import app
from app.models import CartItem, Order, PaymentAttempt, Product, RefreshSession, User, WebhookEvent, WishlistItem
from app.payments import CheckoutSession, InvalidPaymentSignature, VerifiedPaymentEvent, get_payment_gateway


class FakeGateway:
    def __init__(self) -> None:
        self.event: VerifiedPaymentEvent | None = None
        self.refund_calls: list[tuple[str, int, str]] = []

    def create_checkout_session(self, *, order_id, amount, currency, method, idempotency_key, success_url, cancel_url):
        assert f"order_id={order_id}" in success_url
        assert f"payment_id=" in success_url
        assert cancel_url.endswith("/checkout?payment=cancelled")
        return CheckoutSession(provider=method.value, external_payment_id=f"external-{order_id}", checkout_url=f"https://gateway.test/{order_id}")

    def verify_webhook(self, *, provider, payload, signature):
        expected = hmac.new(b"fake-signing-secret", payload, hashlib.sha256).hexdigest()
        if signature != expected:
            raise InvalidPaymentSignature
        body = json.loads(payload)
        return VerifiedPaymentEvent(
            event_id=body["event_id"],
            external_payment_id=body["external_payment_id"],
            status=body["status"],
            amount=body["amount"],
            currency=body["currency"],
        )

    def retrieve_payment(self, *, external_payment_id):
        if self.event is None or self.event.external_payment_id != external_payment_id:
            raise RuntimeError("No provider payment state configured")
        return self.event

    def refund(self, *, external_payment_id, amount, idempotency_key):
        self.refund_calls.append((external_payment_id, amount, idempotency_key))
        return f"refund-{len(self.refund_calls)}"


@pytest.fixture()
def client():
    initialize_database()
    with SessionLocal() as db:
        for model in (WebhookEvent, PaymentAttempt, Order, WishlistItem, CartItem, RefreshSession, User):
            db.execute(delete(model))
        for item in CATALOG:
            db.get(Product, item["id"]).stock = item["stock"]
        db.commit()
    gateway = FakeGateway()
    app.dependency_overrides[get_payment_gateway] = lambda: gateway
    with TestClient(app) as test_client:
        yield test_client, gateway
    app.dependency_overrides.clear()


def create_account(client: TestClient, email: str = "buyer@example.com") -> tuple[str, str]:
    response = client.post("/api/v1/auth/signup", json={
        "email_or_mobile": email,
        "first_name": "Test",
        "last_name": "Buyer",
        "password": "correct horse battery staple",
    })
    assert response.status_code == 201, response.text
    result = response.json()
    return result["access_token"], result["refresh_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def add_product_to_cart(client: TestClient, token: str, product_id: int = 1, quantity: int = 1):
    return client.post("/api/v1/cart/items", headers=auth_headers(token), json={"product_id": product_id, "quantity": quantity})


def post_webhook(client: TestClient, gateway: FakeGateway, provider: str, body: dict):
    payload = json.dumps(body, separators=(",", ":")).encode()
    signature = hmac.new(b"fake-signing-secret", payload, hashlib.sha256).hexdigest()
    return client.post(f"/api/v1/payments/webhooks/{provider}", content=payload, headers={"Payment-Signature": signature, "Content-Type": "application/json"})


def make_checkout(client: TestClient, token: str, key: str = "checkout-idempotency-key-001"):
    return client.post(
        "/api/v1/checkout",
        headers={**auth_headers(token), "Idempotency-Key": key},
        json={
            "payment_method": "upi",
            "shipping": {
                "full_name": "Test Buyer",
                "email": "buyer@example.com",
                "mobile": "+919876543210",
                "address": "12 Test Street",
                "city": "Chennai",
                "postal_code": "600001",
            },
        },
    )


def test_health_and_public_catalog(client):
    api, _ = client
    assert api.get("/healthz").json() == {"status": "ok"}
    assert api.get("/readyz").json() == {"status": "ready"}
    products = api.get("/api/v1/products?limit=100")
    assert products.status_code == 200
    assert len(products.json()) == 12
    assert api.get("/api/v1/products/1").json()["name"] == "Premium Wireless Headphones"
    assert api.get("/api/v1/products/9999").status_code == 404


def test_signup_login_refresh_rotation_and_logout(client):
    api, _ = client
    token, refresh = create_account(api)
    assert api.get("/api/v1/auth/me", headers=auth_headers(token)).status_code == 200
    assert api.post("/api/v1/auth/signup", json={"email_or_mobile": "buyer@example.com", "first_name": "X", "last_name": "Y", "password": "correct horse battery staple"}).status_code == 409
    bad_login = api.post("/api/v1/auth/login", json={"email_or_mobile": "buyer@example.com", "password": "wrong"})
    assert bad_login.status_code == 401
    login = api.post("/api/v1/auth/login", json={"email_or_mobile": "buyer@example.com", "password": "correct horse battery staple"})
    assert login.status_code == 200
    rotated = api.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert rotated.status_code == 200
    assert api.post("/api/v1/auth/refresh", json={"refresh_token": refresh}).status_code == 401
    assert api.post("/api/v1/auth/logout", headers=auth_headers(rotated.json()["access_token"])).status_code == 204
    assert api.post("/api/v1/auth/refresh", json={"refresh_token": rotated.json()["refresh_token"]}).status_code == 401


def test_mobile_signup_and_validation(client):
    api, _ = client
    signup = api.post("/api/v1/auth/signup", json={"email_or_mobile": "+1 (555) 123-4567", "first_name": "Phone", "last_name": "Buyer", "password": "correct horse battery staple"})
    assert signup.status_code == 201
    assert signup.json()["user"]["mobile"] == "+15551234567"
    assert api.post("/api/v1/auth/signup", json={"email_or_mobile": "not-an-id", "first_name": "A", "last_name": "B", "password": "correct horse battery staple"}).status_code == 422


def test_cart_is_private_validated_and_mutable(client):
    api, _ = client
    token, _ = create_account(api)
    other_token, _ = create_account(api, "other@example.com")
    assert api.get("/api/v1/cart").status_code == 401
    added = add_product_to_cart(api, token, quantity=2)
    assert added.status_code == 200
    assert added.json()["subtotal"] == 2598
    assert api.get("/api/v1/cart", headers=auth_headers(other_token)).json()["items"] == []
    assert api.put("/api/v1/cart/items/1", headers=auth_headers(token), json={"quantity": 3}).json()["subtotal"] == 3897
    assert api.put("/api/v1/cart/items/1", headers=auth_headers(token), json={"quantity": 99}).status_code == 409
    assert api.delete("/api/v1/cart/items/1", headers=auth_headers(token)).status_code == 204
    assert api.get("/api/v1/cart", headers=auth_headers(token)).json()["subtotal"] == 0


def test_wishlist_is_private_and_idempotent(client):
    api, _ = client
    token, _ = create_account(api)
    other_token, _ = create_account(api, "other@example.com")
    assert api.get("/api/v1/wishlist").status_code == 401
    first = api.put("/api/v1/wishlist/1", headers=auth_headers(token))
    second = api.put("/api/v1/wishlist/1", headers=auth_headers(token))
    assert first.status_code == second.status_code == 200
    assert len(second.json()["items"]) == 1
    assert api.get("/api/v1/wishlist", headers=auth_headers(other_token)).json()["items"] == []
    assert api.delete("/api/v1/wishlist/1", headers=auth_headers(token)).status_code == 204


def test_checkout_idempotency_payment_webhook_order_and_tracking(client):
    api, gateway = client
    token, _ = create_account(api)
    add_product_to_cart(api, token, quantity=2)
    checkout = make_checkout(api, token)
    assert checkout.status_code == 201
    data = checkout.json()
    assert data["payment_status"] == "pending"
    assert data["amount"] == 259800
    assert make_checkout(api, token).json()["payment_id"] == data["payment_id"]

    order_unpaid = api.get(f"/api/v1/orders/{data['order_id']}", headers=auth_headers(token))
    assert order_unpaid.status_code == 409
    assert api.get(f"/api/v1/orders/{data['order_id']}/tracking", headers=auth_headers(token)).status_code == 409

    event = {"event_id": "evt-success-1", "external_payment_id": f"external-{data['order_id']}", "status": "succeeded", "amount": 259800, "currency": "INR"}
    assert post_webhook(api, gateway, "upi", event).status_code == 202
    assert post_webhook(api, gateway, "upi", event).json()["status"] == "duplicate_ignored"
    order = api.get(f"/api/v1/orders/{data['order_id']}", headers=auth_headers(token))
    assert order.status_code == 200
    assert order.json()["payment_status"] == "paid"
    assert order.json()["tracking_code"]
    assert api.get(f"/api/v1/orders/{data['order_id']}/tracking", headers=auth_headers(token)).status_code == 200
    assert api.get("/api/v1/cart", headers=auth_headers(token)).json()["items"] == []
    assert api.post(f"/api/v1/orders/{data['order_id']}/refund", headers={**auth_headers(token), "Idempotency-Key": "refund-key-1234567890"}).status_code == 200

    with SessionLocal() as db:
        assert db.get(Product, 1).stock == 13


    def test_checkout_currency_is_calculated_by_backend(client):
        api, _ = client
        token, _ = create_account(api)
        add_product_to_cart(api, token, quantity=1)
        response = api.post(
            "/api/v1/checkout",
            headers={**auth_headers(token), "Idempotency-Key": "checkout-usd-currency-key"},
            json={
                "payment_method": "card",
                "currency": "USD",
                "shipping": {
                    "full_name": "Test Buyer", "email": "buyer@example.com", "mobile": "+919876543210",
                    "address": "12 Test Street", "city": "Chennai", "postal_code": "600001",
                },
            },
        )
        assert response.status_code == 201
        assert response.json()["currency"] == "USD"
        assert response.json()["amount"] == 1565


def test_webhook_rejects_bad_signature_and_wrong_amount(client):
    api, gateway = client
    token, _ = create_account(api)
    add_product_to_cart(api, token)
    checkout = make_checkout(api, token).json()
    body = {"event_id": "evt-bad", "external_payment_id": f"external-{checkout['order_id']}", "status": "succeeded", "amount": 1, "currency": "INR"}
    assert api.post("/api/v1/payments/webhooks/upi", json=body, headers={"Payment-Signature": "bad"}).status_code == 400
    assert post_webhook(api, gateway, "upi", body).status_code == 400
    assert api.get(f"/api/v1/orders/{checkout['order_id']}", headers=auth_headers(token)).status_code == 409


def test_reconcile_fetches_provider_state_before_confirming(client):
    api, gateway = client
    token, _ = create_account(api)
    add_product_to_cart(api, token)
    checkout = make_checkout(api, token).json()
    gateway.event = VerifiedPaymentEvent(
        event_id="evt-reconciled",
        external_payment_id=f"external-{checkout['order_id']}",
        status="succeeded",
        amount=129900,
        currency="INR",
    )
    response = api.post(f"/api/v1/payments/{checkout['payment_id']}/reconcile", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["status"] == "succeeded"
    assert api.get(f"/api/v1/orders/{checkout['order_id']}", headers=auth_headers(token)).status_code == 200


def test_checkout_empty_cart_and_order_ownership(client):
    api, _ = client
    token, _ = create_account(api)
    other_token, _ = create_account(api, "other@example.com")
    assert make_checkout(api, token).status_code == 409
    add_product_to_cart(api, token)
    checkout = make_checkout(api, token).json()
    assert api.get(f"/api/v1/orders/{checkout['order_id']}", headers=auth_headers(other_token)).status_code == 404
    assert api.get("/api/v1/orders", headers=auth_headers(token)).status_code == 200


def test_live_payment_disabled_by_default(client):
    api, _ = client
    token, _ = create_account(api)
    add_product_to_cart(api, token)
    app.dependency_overrides[get_payment_gateway] = lambda: __import__("app.payments", fromlist=["DisabledPaymentGateway"]).DisabledPaymentGateway()
    response = make_checkout(api, token, key="another-idempotency-key-002")
    assert response.status_code == 503
    assert api.get("/api/v1/orders", headers=auth_headers(token)).json() == []