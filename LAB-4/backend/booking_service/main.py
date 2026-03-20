"""
TravelNest AI Security Lab — Booking Service
LAB-4: Intentionally vulnerable booking microservice
VULNERABILITIES: No user_id validation (returns all bookings without filter),
                 admin endpoint with weak ?admin_key=admin123 auth,
                 sensitive passenger data in JSON response
"""
import os
import logging
from typing import Optional
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [BOOKING-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.booking")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="TravelNest Booking Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class BookingRequest(BaseModel):
    user_id: int
    booking_type: str   # flight, hotel, train, bus
    reference_id: int
    details: dict
    total_price: float
    currency: Optional[str] = "USD"
    passengers: Optional[list] = []


def row_to_booking(r) -> dict:
    return {
        "id": r.id,
        "booking_ref": r.booking_ref,
        "user_id": r.user_id,
        "booking_type": r.booking_type,
        "reference_id": r.reference_id,
        "details": r.details,      # VULNERABILITY: includes sensitive passenger PII
        "total_price": float(r.total_price),
        "currency": r.currency,
        "status": r.status,
        "passengers": r.passengers,  # VULNERABILITY: full passport numbers exposed
        "created_at": str(r.created_at)
    }


@app.post("/bookings")
def create_booking(req: BookingRequest):
    if req.booking_type not in ("flight", "hotel", "train", "bus", "package"):
        raise HTTPException(status_code=400, detail="Invalid booking type")

    with engine.connect() as conn:
        result = conn.execute(
            text(
                "INSERT INTO bookings (user_id, booking_type, reference_id, details, total_price, currency, passengers) "
                "VALUES (:uid, :btype, :rid, :details::jsonb, :price, :currency, :passengers::jsonb) "
                "RETURNING id, booking_ref, status, created_at"
            ),
            {
                "uid": req.user_id,
                "btype": req.booking_type,
                "rid": req.reference_id,
                "details": json.dumps(req.details),
                "price": req.total_price,
                "currency": req.currency,
                "passengers": json.dumps(req.passengers)
            }
        )
        conn.commit()
        row = result.fetchone()

    logger.info(f"Booking created: id={row.id} ref={row.booking_ref} user_id={req.user_id} price={req.total_price}")
    return {
        "id": row.id,
        "booking_ref": row.booking_ref,
        "status": row.status,
        "total_price": req.total_price,
        "currency": req.currency,
        "booking_type": req.booking_type,
        "created_at": str(row.created_at),
        "message": "Booking confirmed"
    }


@app.get("/bookings")
def get_bookings(user_id: Optional[int] = Query(None)):
    """
    VULNERABILITY: If no user_id is provided, returns ALL bookings in the system.
    This is a data leakage vulnerability — no authentication required.
    """
    if user_id is None:
        logger.warning("SECURITY: /bookings called with no user_id — returning ALL bookings!")
        with engine.connect() as conn:
            rows = conn.execute(
                text("SELECT * FROM bookings ORDER BY created_at DESC")
            ).fetchall()
        return {
            "bookings": [row_to_booking(r) for r in rows],
            "total": len(rows),
            "warning": "No user_id filter applied — all bookings returned"
        }

    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM bookings WHERE user_id = :uid ORDER BY created_at DESC"),
            {"uid": user_id}
        ).fetchall()

    return {"bookings": [row_to_booking(r) for r in rows], "total": len(rows)}


@app.get("/bookings/{booking_id}")
def get_booking(booking_id: int):
    """VULNERABILITY: No ownership check — any booking can be retrieved by ID"""
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM bookings WHERE id = :id"),
            {"id": booking_id}
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found")
    return row_to_booking(row)


@app.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: int, user_id: Optional[int] = Query(None)):
    """VULNERABILITY: No ownership validation — any booking can be cancelled"""
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM bookings WHERE id = :id"),
            {"id": booking_id}
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Booking not found")

        conn.execute(
            text("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = :id"),
            {"id": booking_id}
        )
        conn.commit()

    return {"message": "Booking cancelled", "booking_id": booking_id, "booking_ref": row.booking_ref}


@app.get("/admin/all-bookings")
def admin_all_bookings(admin_key: Optional[str] = Query(None)):
    """
    VULNERABILITY: Admin endpoint protected only by ?admin_key=admin123
    Anyone who knows (or guesses) the admin key gets full data dump.
    """
    if admin_key != "admin123":
        raise HTTPException(status_code=403, detail="Invalid admin key")

    logger.warning(f"SECURITY: Admin all-bookings accessed via weak admin_key!")

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT b.*, u.username, u.email, u.passport_number "
                "FROM bookings b "
                "LEFT JOIN users u ON b.user_id = u.id "
                "ORDER BY b.created_at DESC"
            )
        ).fetchall()

    bookings = []
    for r in rows:
        b = row_to_booking(r)
        b["user_info"] = {
            "username": r.username,
            "email": r.email,
            "passport_number": r.passport_number  # VULNERABILITY: full PII exposed
        }
        bookings.append(b)

    return {
        "bookings": bookings,
        "total": len(bookings),
        "note": "Full booking data with user PII — admin access"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "booking-service"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
