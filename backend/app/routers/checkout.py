from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user
from app.database import get_db
from app.models import CartItem, Order, PaymentAttempt, Product, User
from app.config import get_settings
from app.payments import PaymentGateway, PaymentGatewayUnavailable, get_payment_gateway
from app.pricing import INR_PER_UNIT, inr_to_minor_units
from app.schemas import CheckoutOut, CheckoutRequest


router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutOut, status_code=status.HTTP_201_CREATED)
def create_checkout(
    payload: CheckoutRequest,
    idempotency_key: str = Header(min_length=16, max_length=128, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    gateway: PaymentGateway = Depends(get_payment_gateway),
) -> CheckoutOut:
    existing = db.scalar(select(PaymentAttempt).where(PaymentAttempt.idempotency_key == idempotency_key))
    if existing is not None:
        if existing.user_id != user.id:
            raise HTTPException(status_code=409, detail="Idempotency key was already used")
        if existing.checkout_url is None:
            raise HTTPException(status_code=409, detail="The existing checkout is not available")
        return CheckoutOut(
            order_id=existing.order_id,
            payment_id=existing.id,
            payment_status=existing.status,
            amount=existing.amount,
            currency=existing.currency,
            checkout_url=existing.checkout_url,
        )

    cart_items = db.scalars(
        select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.product_id)
    ).unique().all()
    if not cart_items:
        raise HTTPException(status_code=409, detail="Cannot checkout an empty cart")

    snapshots: list[dict] = []
    subtotal_inr = 0
    for item in cart_items:
        product = item.product
        if not product.is_active:
            raise HTTPException(status_code=409, detail=f"Product {product.id} is unavailable")
        if item.quantity > product.stock:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for product {product.id}")
        line_total_inr = product.price * item.quantity
        subtotal_inr += line_total_inr
        snapshots.append({
            "product_id": product.id,
            "name": product.name,
            "image": product.image,
            "unit_price_inr": product.price,
            "quantity": item.quantity,
            "line_total_inr": line_total_inr,
        })

    currency = payload.currency.upper()
    if currency not in INR_PER_UNIT:
        raise HTTPException(status_code=422, detail="Unsupported checkout currency")
    subtotal = inr_to_minor_units(subtotal_inr, currency)
    for snapshot in snapshots:
        snapshot["unit_price"] = inr_to_minor_units(snapshot.pop("unit_price_inr"), currency)
        snapshot["line_total"] = inr_to_minor_units(snapshot.pop("line_total_inr"), currency)

    order = Order(
        user_id=user.id,
        status="pending",
        payment_status="pending",
        payment_method=payload.payment_method.value,
        subtotal=subtotal,
        currency=currency,
        shipping_details=payload.shipping.model_dump(),
        items_snapshot=snapshots,
    )
    db.add(order)
    db.flush()
    attempt = PaymentAttempt(
        order_id=order.id,
        user_id=user.id,
        provider=payload.payment_method.value,
        payment_method=payload.payment_method.value,
        status="pending",
        amount=subtotal,
        currency=order.currency,
        idempotency_key=idempotency_key,
    )
    db.add(attempt)
    db.flush()

    try:
        session = gateway.create_checkout_session(
            order_id=order.id,
            amount=subtotal,
            currency=order.currency,
            method=payload.payment_method,
            idempotency_key=idempotency_key,
            success_url=f"{get_settings().frontend_base_url.rstrip('/')}/payment-return?order_id={order.id}&payment_id={attempt.id}",
            cancel_url=f"{get_settings().frontend_base_url.rstrip('/')}/checkout?payment=cancelled",
        )
    except PaymentGatewayUnavailable as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Payment provider is not configured") from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail="Could not create provider checkout session") from exc

    attempt.provider = session.provider
    attempt.external_payment_id = session.external_payment_id
    attempt.checkout_url = session.checkout_url
    db.commit()
    return CheckoutOut(
        order_id=order.id,
        payment_id=attempt.id,
        payment_status=attempt.status,
        amount=attempt.amount,
        currency=attempt.currency,
        checkout_url=session.checkout_url,
    )