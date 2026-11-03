from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import CartItem, Product, User
from app.schemas import CartAddRequest, CartLineOut, CartOut, CartUpdateRequest, ProductOut


router = APIRouter(prefix="/cart", tags=["cart"])


def serialize_cart(db: Session, user_id: str) -> CartOut:
    rows = db.scalars(select(CartItem).where(CartItem.user_id == user_id).order_by(CartItem.id)).unique().all()
    lines = [
        CartLineOut(
            product=ProductOut.model_validate(row.product),
            quantity=row.quantity,
            line_total=row.product.price * row.quantity,
        )
        for row in rows
    ]
    return CartOut(items=lines, subtotal=sum(line.line_total for line in lines))


@router.get("", response_model=CartOut)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CartOut:
    return serialize_cart(db, user.id)


@router.post("/items", response_model=CartOut)
def add_cart_item(
    payload: CartAddRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartOut:
    product = db.get(Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock == 0:
        raise HTTPException(status_code=409, detail="Product is out of stock")

    item = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product.id))
    requested_quantity = payload.quantity + (item.quantity if item else 0)
    if requested_quantity > product.stock:
        raise HTTPException(status_code=409, detail="Requested quantity exceeds available stock")
    if item:
        item.quantity = requested_quantity
    else:
        db.add(CartItem(tenant_id=user.tenant_id, user_id=user.id, product_id=product.id, quantity=payload.quantity))
    db.commit()
    return serialize_cart(db, user.id)


@router.put("/items/{product_id}", response_model=CartOut)
def update_cart_item(
    product_id: int,
    payload: CartUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartOut:
    item = db.scalar(select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity > item.product.stock:
        raise HTTPException(status_code=409, detail="Requested quantity exceeds available stock")
    item.quantity = payload.quantity
    db.commit()
    return serialize_cart(db, user.id)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_cart_item(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    result = db.execute(delete(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    db.execute(delete(CartItem).where(CartItem.user_id == user.id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)