from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Product, User, WishlistItem
from app.schemas import ProductOut, WishlistOut


router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=WishlistOut)
def get_wishlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> WishlistOut:
    products = db.scalars(
        select(Product)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .where(WishlistItem.user_id == user.id, Product.is_active.is_(True))
        .order_by(WishlistItem.created_at.desc())
    ).all()
    return WishlistOut(items=[ProductOut.model_validate(product) for product in products])


@router.put("/{product_id}", response_model=WishlistOut)
def add_to_wishlist(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> WishlistOut:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    exists = db.scalar(select(WishlistItem.id).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id))
    if exists is None:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    products = db.scalars(
        select(Product)
        .join(WishlistItem, WishlistItem.product_id == Product.id)
        .where(WishlistItem.user_id == user.id, Product.is_active.is_(True))
        .order_by(WishlistItem.created_at.desc())
    ).all()
    return WishlistOut(items=[ProductOut.model_validate(item) for item in products])


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    result = db.execute(delete(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)