import re

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.catalog import CATALOG
from app.database import get_db
from app.dependencies import get_active_tenant, get_current_user, get_tenant_admin
from app.models import Product, Tenant, User
from app.routers.auth import create_token_pair, normalize_identifier
from app.schemas import (
    LoginRequest,
    ProductOut,
    SignUpRequest,
    TenantAuthResponse,
    TenantProductCreate,
    TenantProductPatch,
    TenantPublic,
    TenantRegistrationRequest,
    TenantSettingsPatch,
    UserPublic,
)
from app.security import hash_password, verify_password


router = APIRouter(tags=["tenants"])
admin_router = APIRouter(prefix="/admin", tags=["tenant admin"])
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
THEME_KEYS = {"primary", "secondary", "background", "surface", "text", "accent"}
PAYMENT_METHODS = {"upi", "paypal", "zelle", "online-banking", "card"}
SUPPORTED_CURRENCIES = {"INR", "USD", "EUR", "GBP", "CAD", "AUD", "BRL", "MXN", "JPY", "KRW", "CHF", "NZD"}
RESERVED_SLUGS = {"api", "admin", "cart", "checkout", "login", "products", "orders", "register-store", "payment-return"}


def public_tenant(tenant: Tenant) -> TenantPublic:
    return TenantPublic(
        id=tenant.id,
        slug=tenant.slug,
        name=tenant.name,
        logo_url=tenant.logo_url,
        theme_settings=tenant.theme_settings,
        enabled_payment_methods=tenant.enabled_payment_methods,
        default_currency=tenant.default_currency,
        payment_provider=tenant.payment_provider,
    )


def response_with_tokens(db: Session, tenant: Tenant, user: User) -> TenantAuthResponse:
    tokens = create_token_pair(db, user)
    db.commit()
    return TenantAuthResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=tokens.expires_in,
        user=tokens.user,
        tenant=public_tenant(tenant),
    )


@router.post("/tenants", response_model=TenantAuthResponse, status_code=status.HTTP_201_CREATED)
def register_tenant(payload: TenantRegistrationRequest, db: Session = Depends(get_db)) -> TenantAuthResponse:
    slug = payload.slug.lower()
    if not SLUG_PATTERN.fullmatch(slug) or slug in RESERVED_SLUGS:
        raise HTTPException(status_code=422, detail="Store slug must contain lowercase letters, numbers, and single hyphens")
    if db.scalar(select(Tenant.id).where(Tenant.slug == slug)) is not None:
        raise HTTPException(status_code=409, detail="That store address is already in use")
    email, _ = normalize_identifier(payload.email)
    tenant = Tenant(slug=slug, name=payload.company_name.strip())
    db.add(tenant)
    try:
        db.flush()
        owner = User(
            tenant_id=tenant.id,
            role="tenant_admin",
            email=email,
            first_name=payload.admin_first_name.strip(),
            last_name=payload.admin_last_name.strip(),
            password_hash=hash_password(payload.password),
        )
        db.add(owner)
        for item in CATALOG:
            db.add(Product(
                tenant_id=tenant.id,
                name=item["name"],
                category=item["category"],
                price=item["price"],
                original_price=item["original_price"],
                stock=item["stock"],
                image=item["image"],
                description="Premium quality product for everyday use.",
            ))
        db.flush()
        response = response_with_tokens(db, tenant, owner)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Store slug or administrator email is already registered") from exc
    return response


@router.get("/tenants/{slug}", response_model=TenantPublic)
def get_tenant(slug: str, db: Session = Depends(get_db)) -> TenantPublic:
    return public_tenant(get_active_tenant(slug, db))


@router.post("/tenants/{slug}/auth/login", response_model=TenantAuthResponse)
def tenant_login(slug: str, payload: LoginRequest, db: Session = Depends(get_db)) -> TenantAuthResponse:
    tenant = get_active_tenant(slug, db)
    email, mobile = normalize_identifier(payload.email_or_mobile)
    identifier_filter = User.email == email if email else User.mobile == mobile
    user = db.scalar(select(User).where(User.tenant_id == tenant.id, identifier_filter))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")
    return response_with_tokens(db, tenant, user)


@router.post("/tenants/{slug}/auth/signup", response_model=TenantAuthResponse, status_code=status.HTTP_201_CREATED)
def tenant_customer_signup(slug: str, payload: SignUpRequest, db: Session = Depends(get_db)) -> TenantAuthResponse:
    tenant = get_active_tenant(slug, db)
    email, mobile = normalize_identifier(payload.email_or_mobile)
    identifier_filter = User.email == email if email else User.mobile == mobile
    if db.scalar(select(User.id).where(User.tenant_id == tenant.id, identifier_filter)) is not None:
        raise HTTPException(status_code=409, detail="An account already exists for that identifier in this store")
    user = User(
        tenant_id=tenant.id,
        role="customer",
        email=email,
        mobile=mobile,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.flush()
        response = response_with_tokens(db, tenant, user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account already exists for that identifier in this store") from exc
    return response


@router.get("/storefront/{slug}/products", response_model=list[ProductOut])
def list_store_products(slug: str, category: str | None = None, search: str | None = None, db: Session = Depends(get_db)) -> list[Product]:
    tenant = get_active_tenant(slug, db)
    query = select(Product).where(Product.tenant_id == tenant.id, Product.is_active.is_(True))
    if category:
        query = query.where(Product.category.ilike(category.strip()))
    if search:
        query = query.where(Product.name.ilike(f"%{search.strip()}%"))
    return list(db.scalars(query.order_by(Product.id)).all())


@router.get("/storefront/{slug}/products/{product_id}", response_model=ProductOut)
def get_store_product(slug: str, product_id: int, db: Session = Depends(get_db)) -> Product:
    tenant = get_active_tenant(slug, db)
    product = db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == tenant.id, Product.is_active.is_(True)))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@admin_router.get("/tenant", response_model=TenantPublic)
def admin_get_settings(user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> TenantPublic:
    tenant = db.get(Tenant, user.tenant_id)
    if tenant is None or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Store not found")
    return public_tenant(tenant)


@admin_router.patch("/tenant", response_model=TenantPublic)
def admin_update_settings(payload: TenantSettingsPatch, user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> TenantPublic:
    tenant = db.get(Tenant, user.tenant_id)
    if tenant is None or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Store not found")
    changes = payload.model_dump(exclude_unset=True)
    if "name" in changes:
        tenant.name = changes["name"].strip()
    if "logo_url" in changes:
        tenant.logo_url = changes["logo_url"]
    if "theme_settings" in changes:
        proposed = changes["theme_settings"]
        if not set(proposed).issubset(THEME_KEYS) or any(not re.fullmatch(r"#[0-9a-fA-F]{6}", value) for value in proposed.values()):
            raise HTTPException(status_code=422, detail="Theme colors must use supported keys and #RRGGBB values")
        tenant.theme_settings = proposed
    if "enabled_payment_methods" in changes:
        methods = [method.value for method in changes["enabled_payment_methods"]]
        if not set(methods).issubset(PAYMENT_METHODS):
            raise HTTPException(status_code=422, detail="Unsupported payment method")
        tenant.enabled_payment_methods = methods
    if "default_currency" in changes:
        if changes["default_currency"] not in SUPPORTED_CURRENCIES:
            raise HTTPException(status_code=422, detail="Unsupported currency")
        tenant.default_currency = changes["default_currency"]
    if "payment_provider" in changes:
        tenant.payment_provider = changes["payment_provider"]
    db.commit()
    db.refresh(tenant)
    return public_tenant(tenant)


@admin_router.get("/products", response_model=list[ProductOut])
def admin_list_products(user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> list[Product]:
    return list(db.scalars(select(Product).where(Product.tenant_id == user.tenant_id).order_by(Product.id)).all())


@admin_router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def admin_create_product(payload: TenantProductCreate, user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> Product:
    product = Product(tenant_id=user.tenant_id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@admin_router.patch("/products/{product_id}", response_model=ProductOut)
def admin_update_product(product_id: int, payload: TenantProductPatch, user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@admin_router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_product(product_id: int, user: User = Depends(get_tenant_admin), db: Session = Depends(get_db)) -> Response:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == user.tenant_id))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)