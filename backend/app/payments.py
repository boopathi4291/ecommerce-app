from dataclasses import dataclass
from typing import Protocol

from app.schemas import PaymentMethod


class PaymentGatewayUnavailable(Exception):
    pass


class InvalidPaymentSignature(Exception):
    pass


@dataclass(frozen=True)
class CheckoutSession:
    provider: str
    external_payment_id: str
    checkout_url: str


@dataclass(frozen=True)
class VerifiedPaymentEvent:
    event_id: str
    external_payment_id: str
    status: str
    amount: int
    currency: str


class PaymentGateway(Protocol):
    def create_checkout_session(
        self,
        *,
        order_id: str,
        amount: int,
        currency: str,
        method: PaymentMethod,
        idempotency_key: str,
        provider: str | None,
        success_url: str,
        cancel_url: str,
    ) -> CheckoutSession: ...

    def verify_webhook(self, *, provider: str, payload: bytes, signature: str | None) -> VerifiedPaymentEvent: ...

    def retrieve_payment(self, *, external_payment_id: str) -> VerifiedPaymentEvent: ...

    def refund(self, *, external_payment_id: str, amount: int, idempotency_key: str) -> str: ...


class DisabledPaymentGateway:
    def create_checkout_session(self, **_: object) -> CheckoutSession:
        raise PaymentGatewayUnavailable("No live payment provider is configured")

    def verify_webhook(self, **_: object) -> VerifiedPaymentEvent:
        raise PaymentGatewayUnavailable("No live payment provider is configured")

    def retrieve_payment(self, **_: object) -> VerifiedPaymentEvent:
        raise PaymentGatewayUnavailable("No live payment provider is configured")

    def refund(self, **_: object) -> str:
        raise PaymentGatewayUnavailable("No live payment provider is configured")


def get_payment_gateway() -> PaymentGateway:
    return DisabledPaymentGateway()