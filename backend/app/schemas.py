from datetime import datetime
from enum import StrEnum

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PaymentMethod(StrEnum):
    UPI = "upi"
    PAYPAL = "paypal"
    ZELLE = "zelle"
    ONLINE_BANKING = "online-banking"
    CARD = "card"


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str | None
    mobile: str | None
    first_name: str
    last_name: str
    created_at: datetime


class SignUpRequest(BaseModel):
    email_or_mobile: str = Field(min_length=5, max_length=320)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=10, max_length=128)

    @field_validator("first_name", "last_name")
    @classmethod
    def require_nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank")
        return value


class LoginRequest(BaseModel):
    email_or_mobile: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    category: str
    price: int
    original_price: int | None
    image: str
    stock: int


class CartAddRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartUpdateRequest(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartLineOut(BaseModel):
    product: ProductOut
    quantity: int
    line_total: int


class CartOut(BaseModel):
    items: list[CartLineOut]
    subtotal: int
    currency: str = "INR"


class ShippingDetails(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=5, max_length=320)
    mobile: str = Field(min_length=7, max_length=24)
    address: str = Field(min_length=5, max_length=300)
    city: str = Field(min_length=2, max_length=120)
    postal_code: str = Field(min_length=3, max_length=20)

    @field_validator("full_name", "address", "city", "postal_code")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field must not be blank")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, value: str) -> str:
        value = re.sub(r"[\s().-]", "", value)
        if not re.fullmatch(r"\+?\d{7,15}", value):
            raise ValueError("Enter a valid mobile number")
        return value


class CheckoutRequest(BaseModel):
    payment_method: PaymentMethod
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")
    shipping: ShippingDetails


class CheckoutOut(BaseModel):
    order_id: str
    payment_id: str
    payment_status: str
    amount: int
    currency: str
    checkout_url: str


class PaymentStatusOut(BaseModel):
    id: str
    order_id: str
    status: str
    amount: int
    currency: str
    checkout_url: str | None


class OrderSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    payment_status: str
    payment_method: str
    subtotal: int
    currency: str
    tracking_code: str | None
    created_at: datetime


class OrderDetailsOut(OrderSummaryOut):
    items: list[dict]
    shipping: ShippingDetails


class TrackingOut(BaseModel):
    order_id: str
    tracking_code: str
    status: str
    updated_at: datetime


class RefundOut(BaseModel):
    order_id: str
    payment_status: str
    refund_id: str


class WishlistOut(BaseModel):
    items: list[ProductOut]