from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Order, PaymentAttempt, Product, User, WebhookEvent
from app.payments import InvalidPaymentSignature, PaymentGateway, PaymentGatewayUnavailable, VerifiedPaymentEvent, get_payment_gateway
from app.schemas import PaymentStatusOut


router = APIRouter(prefix="/payments", tags=["payments"])


def apply_payment_event(db: Session, provider: str, event: VerifiedPaymentEvent) -> str:
    if event.status == "pending":
        return "pending"
    if event.status not in {"succeeded", "failed", "canceled"}:
        raise HTTPException(status_code=400, detail="Unsupported payment event status")
    if db.scalar(select(WebhookEvent.id).where(WebhookEvent.provider == provider, WebhookEvent.event_id == event.event_id)):
        return "duplicate_ignored"

    attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.external_payment_id == event.external_payment_id))
    if attempt is None or attempt.provider != provider:
        raise HTTPException(status_code=404, detail="Payment attempt not found")
    if attempt.amount != event.amount or attempt.currency != event.currency.upper():
        raise HTTPException(status_code=400, detail="Provider amount or currency does not match the order")
    attempt_id = attempt.id
    order_id = attempt.order_id
    user_id = attempt.user_id
    if attempt.status in {"succeeded", "failed", "canceled", "refund_pending", "refunded"}:
        db.add(WebhookEvent(provider=provider, event_id=event.event_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        return "already_final"

    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    db.add(WebhookEvent(provider=provider, event_id=event.event_id))

    if event.status == "succeeded":
        stock_reserved = True
        for item in order.items_snapshot:
            result = db.execute(
                update(Product)
                .where(Product.id == item["product_id"], Product.stock >= item["quantity"], Product.is_active.is_(True))
                .values(stock=Product.stock - item["quantity"])
            )
            if result.rowcount != 1:
                stock_reserved = False
                break

        if stock_reserved:
            attempt.status = "succeeded"
            order.payment_status = "paid"
            order.status = "confirmed"
            order.tracking_code = f"HC-{order.id.replace('-', '').upper()[:16]}"
            for item in order.items_snapshot:
                db.execute(delete(CartItem).where(
                    CartItem.user_id == user_id,
                    CartItem.product_id == item["product_id"],
                    CartItem.quantity <= item["quantity"],
                ))
                db.execute(update(CartItem).where(
                    CartItem.user_id == user_id,
                    CartItem.product_id == item["product_id"],
                    CartItem.quantity > item["quantity"],
                ).values(quantity=CartItem.quantity - item["quantity"]))
        else:
            db.rollback()
            attempt = db.get(PaymentAttempt, attempt_id)
            order = db.get(Order, order_id)
            attempt.status = "refund_pending"
            order.payment_status = "refund_pending"
            order.status = "payment_review"
            db.add(WebhookEvent(provider=provider, event_id=event.event_id))
    else:
        attempt.status = event.status
        order.payment_status = event.status
        order.status = "cancelled" if event.status == "canceled" else "payment_failed"

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(select(WebhookEvent.id).where(WebhookEvent.provider == provider, WebhookEvent.event_id == event.event_id)):
            return "duplicate_ignored"
        raise
    return "processed"


@router.get("/{payment_id}", response_model=PaymentStatusOut)
def get_payment_status(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentStatusOut:
    attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.id == payment_id, PaymentAttempt.user_id == user.id))
    if attempt is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentStatusOut(
        id=attempt.id,
        order_id=attempt.order_id,
        status=attempt.status,
        amount=attempt.amount,
        currency=attempt.currency,
        checkout_url=attempt.checkout_url,
    )


@router.post("/{payment_id}/reconcile", response_model=PaymentStatusOut)
def reconcile_payment(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    gateway: PaymentGateway = Depends(get_payment_gateway),
) -> PaymentStatusOut:
    attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.id == payment_id, PaymentAttempt.user_id == user.id))
    if attempt is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not attempt.external_payment_id:
        raise HTTPException(status_code=409, detail="Payment provider reference is not available")
    try:
        event = gateway.retrieve_payment(external_payment_id=attempt.external_payment_id)
    except PaymentGatewayUnavailable as exc:
        raise HTTPException(status_code=503, detail="Payment provider is not configured") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not reconcile provider payment status") from exc
    if event.external_payment_id != attempt.external_payment_id:
        raise HTTPException(status_code=400, detail="Provider returned a different payment reference")
    apply_payment_event(db, attempt.provider, event)
    db.refresh(attempt)
    return PaymentStatusOut(
        id=attempt.id,
        order_id=attempt.order_id,
        status=attempt.status,
        amount=attempt.amount,
        currency=attempt.currency,
        checkout_url=attempt.checkout_url,
    )


@router.post("/webhooks/{provider}", status_code=202)
async def receive_payment_webhook(
    provider: str,
    request: Request,
    signature: str | None = Header(default=None, alias="Payment-Signature"),
    db: Session = Depends(get_db),
    gateway: PaymentGateway = Depends(get_payment_gateway),
) -> dict[str, str]:
    payload = await request.body()
    if len(payload) > 1_000_000:
        raise HTTPException(status_code=413, detail="Payment event payload is too large")
    try:
        event = gateway.verify_webhook(provider=provider, payload=payload, signature=signature)
    except InvalidPaymentSignature as exc:
        raise HTTPException(status_code=400, detail="Invalid payment signature") from exc
    except PaymentGatewayUnavailable as exc:
        raise HTTPException(status_code=503, detail="Payment provider is not configured") from exc

    return {"status": apply_payment_event(db, provider, event)}