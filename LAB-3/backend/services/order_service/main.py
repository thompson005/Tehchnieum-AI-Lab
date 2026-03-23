from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Add backend to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.models import Product, CartItem, Order, OrderItem, Base

app = FastAPI(title="ShopSec-AI Order Service (Lite)")

# Database definition
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shopsec.db")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Request models ────────────────────────────────────────────────────────────
class CartAddRequest(BaseModel):
    product_id: int
    quantity: int = 1
    user_id: Optional[str] = None


class CheckoutRequest(BaseModel):
    user_id: Optional[str] = None
    shipping_address: Optional[str] = None
    payment_method: Optional[str] = "card"


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "service": "order-service"}


# ── Products ──────────────────────────────────────────────────────────────────
@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "category": product.category,
        "description": product.description,
        "stock": product.stock,
        "max_discount_percent": getattr(product, "max_discount_percent", 15.0),
        "is_refundable": getattr(product, "is_refundable", True),
    }


@app.get("/products")
def get_products(limit: int = 50, category: str = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    products = query.limit(limit).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "category": p.category,
            "image_url": p.image_url,
        }
        for p in products
    ]


# ── Cart ──────────────────────────────────────────────────────────────────────
@app.post("/cart/add")
def add_to_cart(item: CartAddRequest, db: Session = Depends(get_db)):
    """
    Add item to cart.
    VULNERABILITY: No quantity validation — negative quantities accepted.
    """
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock is not None and product.stock < item.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock} units available")

    user_id_int = _parse_user_id(item.user_id)

    # Check if item already in cart
    existing = db.query(CartItem).filter(
        CartItem.product_id == item.product_id,
        CartItem.user_id == user_id_int
    ).first()

    if existing:
        existing.quantity += item.quantity
        db.commit()
        db.refresh(existing)
    else:
        cart_item = CartItem(
            user_id=user_id_int,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)

    return {
        "status": "success",
        "message": f"Added {item.quantity}x {product.name} to cart",
        "product_id": item.product_id,
        "quantity": item.quantity,
        "unit_price": product.price
    }


@app.post("/cart/remove")
def remove_from_cart(product_id: int, user_id: Optional[str] = None, db: Session = Depends(get_db)):
    user_id_int = _parse_user_id(user_id)
    item = db.query(CartItem).filter(
        CartItem.product_id == product_id,
        CartItem.user_id == user_id_int
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Item removed from cart"}


@app.get("/cart")
def get_cart(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Get user's cart with product details"""
    user_id_int = _parse_user_id(user_id)
    items = db.query(CartItem).filter(CartItem.user_id == user_id_int).all()

    cart_items = []
    total = 0.0
    for ci in items:
        product = db.query(Product).filter(Product.id == ci.product_id).first()
        if product:
            line_total = product.price * ci.quantity
            total += line_total
            cart_items.append({
                "cart_item_id": ci.id,
                "product_id": product.id,
                "name": product.name,
                "price": product.price,
                "quantity": ci.quantity,
                "line_total": line_total,
                "image_url": product.image_url,
            })

    return {"items": cart_items, "total": round(total, 2), "item_count": len(cart_items)}


@app.post("/cart/clear")
def clear_cart(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    user_id_int = _parse_user_id(user_id)
    db.query(CartItem).filter(CartItem.user_id == user_id_int).delete()
    db.commit()
    return {"status": "success", "message": "Cart cleared"}


# ── Checkout ──────────────────────────────────────────────────────────────────
@app.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    """
    Convert cart to order.
    VULNERABILITY: Price is taken from the DB at checkout time — race condition possible.
    """
    user_id_int = _parse_user_id(req.user_id)
    items = db.query(CartItem).filter(CartItem.user_id == user_id_int).all()
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0.0
    order_items_data = []
    for ci in items:
        product = db.query(Product).filter(Product.id == ci.product_id).first()
        if not product:
            continue
        line_total = product.price * ci.quantity
        total += line_total
        order_items_data.append((product, ci.quantity, product.price))

    order = Order(
        user_id=user_id_int,
        status="pending",
        total_amount=round(total, 2),
        discount_amount=0.0,
        final_amount=round(total, 2),
        payment_method=req.payment_method,
        shipping_address=req.shipping_address,
    )
    db.add(order)
    db.flush()

    for product, qty, unit_price in order_items_data:
        oi = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=unit_price,
        )
        db.add(oi)

    # Clear cart after checkout
    db.query(CartItem).filter(CartItem.user_id == user_id_int).delete()
    db.commit()
    db.refresh(order)

    return {
        "status": "success",
        "order_id": order.id,
        "total": order.final_amount,
        "item_count": len(order_items_data),
        "message": "Order placed successfully"
    }


# ── Orders ────────────────────────────────────────────────────────────────────
@app.get("/orders")
def get_orders(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    user_id_int = _parse_user_id(user_id)
    orders = db.query(Order).filter(Order.user_id == user_id_int).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "status": o.status,
            "total": o.final_amount,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]


@app.get("/admin/orders")
def get_all_orders(admin_key: Optional[str] = None, db: Session = Depends(get_db)):
    """VULNERABILITY: Weak admin auth"""
    if admin_key != os.getenv("ADMIN_PASSWORD", "admin123"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [{"id": o.id, "user_id": o.user_id, "status": o.status, "total": o.final_amount} for o in orders]


# ── Helper ────────────────────────────────────────────────────────────────────
def _parse_user_id(user_id_str: Optional[str]) -> int:
    """Convert user_id string to int, default to 1 (guest)."""
    try:
        return int(user_id_str) if user_id_str else 1
    except (ValueError, TypeError):
        return 1


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

