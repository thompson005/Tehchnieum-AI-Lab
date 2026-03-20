"""
TravelNest AI Security Lab — Hotel Service
LAB-4: Intentionally vulnerable hotel microservice
VULNERABILITIES: XSS in description field (stored as raw HTML),
                 no sanitization of reviews, exposes internal cost data
"""
import os
import logging
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [HOTEL-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.hotel")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="TravelNest Hotel Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ReviewRequest(BaseModel):
    hotel_id: int
    author: str
    rating: float
    title: str
    content: str  # VULNERABILITY: stored as raw HTML without sanitization


def row_to_hotel_dict(r) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "city": r.city,
        "country": r.country,
        "address": r.address,
        "stars": r.stars,
        "price_per_night": float(r.price_per_night),
        "cost_per_night": float(r.cost_per_night),  # VULNERABILITY: exposes internal cost
        "description": r.description,               # VULNERABILITY: raw HTML, XSS possible
        "amenities": list(r.amenities) if r.amenities else [],
        "available_rooms": r.available_rooms,
        "image_url": r.image_url,
        "rating": float(r.rating) if r.rating else 0.0,
        "internal_notes": r.internal_notes,         # VULNERABILITY: exposes internal notes
    }


@app.get("/search")
def search_hotels(
    city: Optional[str] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    guests: Optional[int] = 1,
    stars: Optional[int] = None,
    max_price: Optional[float] = None
):
    conditions = ["available_rooms >= 1"]
    params: dict = {}

    if city:
        conditions.append("LOWER(city) LIKE :city")
        params["city"] = f"%{city.lower()}%"

    if stars:
        conditions.append("stars >= :stars")
        params["stars"] = stars

    if max_price:
        conditions.append("price_per_night <= :max_price")
        params["max_price"] = max_price

    where_clause = " AND ".join(conditions)
    sql = f"SELECT * FROM hotels WHERE {where_clause} ORDER BY rating DESC, stars DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    return {
        "hotels": [row_to_hotel_dict(r) for r in rows],
        "total": len(rows),
        "search_params": {"city": city, "check_in": check_in, "check_out": check_out, "guests": guests}
    }


@app.get("/hotels/{hotel_id}")
def get_hotel(hotel_id: int):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM hotels WHERE id = :id"), {"id": hotel_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return row_to_hotel_dict(row)


@app.get("/hotels")
def list_hotels():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM hotels ORDER BY city, stars DESC")).fetchall()
    return {"hotels": [row_to_hotel_dict(r) for r in rows], "total": len(rows)}


@app.post("/reviews")
def post_review(review: ReviewRequest):
    """
    VULNERABILITY: Stores raw HTML in description without sanitization.
    The content field accepts arbitrary HTML/JavaScript which will be rendered
    in the frontend causing Stored XSS.
    """
    logger.warning(f"New review posted — storing raw HTML (XSS risk): {review.content[:200]}")

    # Append review to hotel description (simulating stored XSS)
    with engine.connect() as conn:
        hotel = conn.execute(text("SELECT id, name FROM hotels WHERE id = :id"), {"id": review.hotel_id}).fetchone()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        # VULNERABILITY: Concatenates raw HTML directly to description
        new_review_html = (
            f'<div class="review">'
            f'<strong>{review.author}</strong> rated {review.rating}/5<br>'
            f'<em>{review.title}</em><br>'
            f'{review.content}'  # Raw HTML — no sanitization
            f'</div>'
        )

        conn.execute(
            text("UPDATE hotels SET description = description || :review WHERE id = :id"),
            {"review": new_review_html, "id": review.hotel_id}
        )
        conn.commit()

    return {
        "message": "Review posted successfully",
        "hotel_id": review.hotel_id,
        "hotel_name": hotel.name,
        "review_preview": review.content[:100],
        "warning": "Review content stored as raw HTML"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "hotel-service"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
