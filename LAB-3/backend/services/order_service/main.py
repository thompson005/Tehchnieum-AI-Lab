from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import os
import sys

# Add backend to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database.models import Product, Order

app = FastAPI(title="ShopSec-AI Order Service (Lite)")

# Database definition
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shopsec.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "healthy", "service": "order-service"}

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
        "stock": product.stock
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
            "image_url": p.image_url
        } for p in products
    ]

# Mock Cart Endpoints
@app.post("/cart/add")
def add_to_cart(item: dict):
    return {"status": "success", "message": "Item added to cart (mock)"}

@app.get("/cart")
def get_cart(user_id: str = None):
    return {"items": [], "total": 0.0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
