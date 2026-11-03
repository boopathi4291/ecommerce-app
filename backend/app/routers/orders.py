from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Order, PaymentAttempt, User
from app.payments import PaymentGateway, PaymentGatewayUnavailable, get_payment_gateway
from app.schemas import OrderDetailsOut, OrderSummaryOut, RefundOut, ShippingDetails, TrackingOut


router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderSummaryOut])
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Order]:
    return list(db.scalars(select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())).all())


@router.get("/{order_id}", response_model=OrderDetailsOut)
def get_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> OrderDetailsOut:
    order = db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user.id))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status != "paid":
        raise HTTPException(status_code=409, detail="Order is not confirmed as paid")
    return OrderDetailsOut(
        id=order.id,
        status=order.status,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        subtotal=order.subtotal,
        currency=order.currency,
        tracking_code=order.tracking_code,
        created_at=order.created_at,
        items=order.items_snapshot,
        shipping=ShippingDetails.model_validate(order.shipping_details),
    )


@router.get("/{order_id}/tracking", response_model=TrackingOut)
def track_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TrackingOut:
    order = db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user.id))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status != "paid" or not order.tracking_code:
        raise HTTPException(status_code=409, detail="Tracking is available after payment confirmation")
    return TrackingOut(order_id=order.id, tracking_code=order.tracking_code, status=order.status, updated_at=order.created_at)


@router.post("/{order_id}/refund", response_model=RefundOut)
def refund_order(
    order_id: str,
    idempotency_key: str = Header(min_length=16, max_length=128, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    gateway: PaymentGateway = Depends(get_payment_gateway),
) -> RefundOut:
    order = db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user.id))
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == "refunded":
        attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.order_id == order.id))
        return RefundOut(order_id=order.id, payment_status="refunded", refund_id=attempt.external_refund_id or f"refund-{attempt.id}")
    if order.payment_status not in {"paid", "refund_pending"}:
        raise HTTPException(status_code=409, detail="Only a paid or refund-pending order can be refunded")
    attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.order_id == order.id))
    if attempt is None or not attempt.external_payment_id:
        raise HTTPException(status_code=409, detail="Payment provider reference is unavailable")
    if attempt.refund_idempotency_key and attempt.refund_idempotency_key != idempotency_key:
        raise HTTPException(status_code=409, detail="A refund was already requested with a different idempotency key")

    try:
        refund_id = gateway.refund(
            external_payment_id=attempt.external_payment_id,
            amount=attempt.amount,
            idempotency_key=idempotency_key,
        )
    except PaymentGatewayUnavailable as exc:
        raise HTTPException(status_code=503, detail="Payment provider is not configured; no refund was attempted") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Refund provider request failed; check payment status before retrying") from exc

    attempt.status = "refunded"
    attempt.refund_idempotency_key = idempotency_key
    attempt.external_refund_id = refund_id
    order.payment_status = "refunded"
    order.status = "refunded"
    db.commit()
    return RefundOut(order_id=order.id, payment_status="refunded", refund_id=refund_id)