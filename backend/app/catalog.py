from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Product


CATALOG = [
    {"id": 1, "name": "Premium Wireless Headphones", "category": "Electronics", "price": 1299, "original_price": 1799, "stock": 15, "image": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=60"},
    {"id": 2, "name": "Professional Running Shoes", "category": "Sports", "price": 2399, "original_price": 3499, "stock": 24, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=60"},
    {"id": 3, "name": "Smart Watch Pro", "category": "Electronics", "price": 3499, "original_price": 4999, "stock": 8, "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=60"},
    {"id": 4, "name": "100% Organic Cotton T-Shirt", "category": "Fashion", "price": 799, "original_price": 1199, "stock": 42, "image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=60"},
    {"id": 5, "name": "Premium Coffee Maker", "category": "Home & Kitchen", "price": 1899, "original_price": 2699, "stock": 12, "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=500&q=60"},
    {"id": 6, "name": "Luxury Face Serum 30ml", "category": "Beauty", "price": 1099, "original_price": 1699, "stock": 28, "image": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=60"},
    {"id": 7, "name": "Stainless Steel Water Bottle", "category": "Sports", "price": 599, "original_price": 899, "stock": 55, "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e9?auto=format&fit=crop&w=500&q=60"},
    {"id": 8, "name": "Leather Messenger Bag", "category": "Fashion", "price": 2499, "original_price": 3499, "stock": 6, "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=60"},
    {"id": 9, "name": "Wireless Bluetooth Speaker", "category": "Electronics", "price": 1599, "original_price": 2399, "stock": 0, "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=60"},
    {"id": 10, "name": "Ceramic Non-Stick Pan Set", "category": "Home & Kitchen", "price": 1299, "original_price": 1999, "stock": 19, "image": "https://images.unsplash.com/photo-1578500494198-246f612d03b3?auto=format&fit=crop&w=500&q=60"},
    {"id": 11, "name": "Premium Yoga Mat", "category": "Sports", "price": 899, "original_price": 1299, "stock": 31, "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=500&q=60"},
    {"id": 12, "name": "Anti-Aging Night Cream", "category": "Beauty", "price": 1799, "original_price": 2499, "stock": 14, "image": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=500&q=60"},
]


def seed_catalog(db: Session) -> None:
    if db.scalar(select(Product.id).limit(1)) is not None:
        return
    db.add_all(Product(**product, description="Premium quality product for everyday use.") for product in CATALOG)
    db.commit()