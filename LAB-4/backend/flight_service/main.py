"""
TravelNest AI Security Lab — Flight Service
LAB-4: Intentionally vulnerable flight microservice
VULNERABILITIES: Returns internal cost_price field, exposes internal pricing endpoint,
                 no pagination limit, hidden flag in internal_notes
"""
import os
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [FLIGHT-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.flight")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="TravelNest Flight Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def row_to_flight_dict(r, include_internal: bool = True) -> dict:
    d = {
        "id": r.id,
        "airline": r.airline,
        "flight_number": r.flight_number,
        "origin": r.origin,
        "destination": r.destination,
        "origin_code": r.origin_code,
        "destination_code": r.destination_code,
        "date": str(r.date),
        "departure_time": str(r.departure_time),
        "arrival_time": str(r.arrival_time),
        "duration_mins": r.duration_mins,
        "price": float(r.price),
        "seats_available": r.seats_available,
        "class_type": r.class_type,
        "aircraft": r.aircraft,
    }
    if include_internal:
        # VULNERABILITY: Returns cost_price and internal_notes to all callers
        d["cost_price"] = float(r.cost_price)
        d["internal_notes"] = r.internal_notes  # Contains embedded flag
        d["margin_pct"] = round(((float(r.price) - float(r.cost_price)) / float(r.cost_price)) * 100, 1)
    return d


@app.get("/search")
def search_flights(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    passengers: Optional[int] = 1,
    class_type: Optional[str] = None
):
    """
    VULNERABILITY: Returns cost_price and internal_notes fields including embedded flag.
    """
    conditions = ["1=1"]
    params: dict = {}

    if origin:
        conditions.append("(LOWER(origin) LIKE :origin OR LOWER(origin_code) = LOWER(:origin_exact))")
        params["origin"] = f"%{origin.lower()}%"
        params["origin_exact"] = origin

    if destination:
        conditions.append("(LOWER(destination) LIKE :dest OR LOWER(destination_code) = LOWER(:dest_exact))")
        params["dest"] = f"%{destination.lower()}%"
        params["dest_exact"] = destination

    if date:
        conditions.append("date = :date")
        params["date"] = date

    if class_type:
        conditions.append("class_type = :class_type")
        params["class_type"] = class_type

    if passengers:
        conditions.append("seats_available >= :passengers")
        params["passengers"] = passengers

    where_clause = " AND ".join(conditions)
    sql = f"SELECT * FROM flights WHERE {where_clause} ORDER BY price ASC"

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    flights = [row_to_flight_dict(r, include_internal=True) for r in rows]

    # Add flag in the raw response data structure
    return {
        "flights": flights,
        "total": len(flights),
        "search_params": {
            "origin": origin,
            "destination": destination,
            "date": date,
            "passengers": passengers
        },
        "internal_notes": "TECHNIEUM{fl1ght_d4t4_3xf1l}",  # VULNERABILITY: flag in response
        "data_classification": "INTERNAL - contains cost pricing data"
    }


@app.get("/flights/{flight_id}")
def get_flight(flight_id: int):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM flights WHERE id = :id"), {"id": flight_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Flight not found")
    return row_to_flight_dict(row, include_internal=True)


@app.get("/flights")
def list_flights(limit: Optional[int] = None):
    """VULNERABILITY: No pagination limit - returns all flights"""
    sql = "SELECT * FROM flights ORDER BY date ASC, departure_time ASC"
    if limit:
        sql += f" LIMIT {limit}"  # VULNERABILITY: No max limit enforced
    # Without limit, returns everything — could be used for data exfiltration

    with engine.connect() as conn:
        rows = conn.execute(text(sql)).fetchall()

    return {
        "flights": [row_to_flight_dict(r, include_internal=True) for r in rows],
        "total": len(rows),
        "warning": "No pagination applied — all records returned"
    }


@app.get("/internal/pricing")
def internal_pricing():
    """
    VULNERABILITY: No authentication required on this internal endpoint.
    Exposes full cost breakdown and profit margins.
    """
    logger.warning("SECURITY: /internal/pricing accessed without auth!")
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, flight_number, airline, origin, destination, price, cost_price, "
            "(price - cost_price) AS profit, "
            "ROUND(((price - cost_price) / cost_price * 100)::numeric, 1) AS margin_pct "
            "FROM flights ORDER BY margin_pct DESC"
        )).fetchall()

    return {
        "pricing_data": [
            {
                "id": r.id,
                "flight_number": r.flight_number,
                "airline": r.airline,
                "route": f"{r.origin} → {r.destination}",
                "public_price": float(r.price),
                "cost_price": float(r.cost_price),
                "profit": float(r.profit),
                "margin_pct": float(r.margin_pct)
            }
            for r in rows
        ],
        "access_level": "INTERNAL_ONLY",
        "note": "This endpoint should not be publicly accessible"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "flight-service"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
