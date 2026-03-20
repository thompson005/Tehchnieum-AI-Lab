"""
TravelNest AI Security Lab — Transport Service (Trains + Buses)
LAB-4: Transport microservice for UK rail and national coach routes
"""
import os
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [TRANSPORT-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.transport")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="TravelNest Transport Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def row_to_train(r) -> dict:
    return {
        "id": r.id,
        "operator": r.operator,
        "train_number": r.train_number,
        "origin": r.origin,
        "destination": r.destination,
        "date": str(r.date),
        "departure_time": str(r.departure_time),
        "arrival_time": str(r.arrival_time),
        "duration_mins": r.duration_mins,
        "price": float(r.price),
        "class_type": r.class_type,
        "seats_available": r.seats_available,
        "platform": r.platform
    }


def row_to_bus(r) -> dict:
    return {
        "id": r.id,
        "operator": r.operator,
        "bus_number": r.bus_number,
        "origin": r.origin,
        "destination": r.destination,
        "date": str(r.date),
        "departure_time": str(r.departure_time),
        "arrival_time": str(r.arrival_time),
        "duration_mins": r.duration_mins,
        "price": float(r.price),
        "seats_available": r.seats_available,
        "amenities": list(r.amenities) if r.amenities else []
    }


# ─────────────────────────────────────────────────────────────────────────────
# TRAIN ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/trains/search")
def search_trains(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    passengers: Optional[int] = 1,
    class_type: Optional[str] = None
):
    conditions = ["seats_available >= :passengers"]
    params: dict = {"passengers": passengers or 1}

    if origin:
        conditions.append("LOWER(origin) LIKE :origin")
        params["origin"] = f"%{origin.lower()}%"

    if destination:
        conditions.append("LOWER(destination) LIKE :destination")
        params["destination"] = f"%{destination.lower()}%"

    if date:
        conditions.append("date = :date")
        params["date"] = date

    if class_type:
        conditions.append("class_type = :class_type")
        params["class_type"] = class_type

    where_clause = " AND ".join(conditions)
    sql = f"SELECT * FROM trains WHERE {where_clause} ORDER BY departure_time ASC"

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    return {
        "trains": [row_to_train(r) for r in rows],
        "total": len(rows),
        "search_params": {"origin": origin, "destination": destination, "date": date}
    }


@app.get("/trains/{train_id}")
def get_train(train_id: int):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM trains WHERE id = :id"), {"id": train_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Train not found")
    return row_to_train(row)


@app.get("/trains")
def list_trains():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM trains ORDER BY date, departure_time")).fetchall()
    return {"trains": [row_to_train(r) for r in rows], "total": len(rows)}


# ─────────────────────────────────────────────────────────────────────────────
# BUS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/buses/search")
def search_buses(
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    date: Optional[str] = None,
    passengers: Optional[int] = 1
):
    conditions = ["seats_available >= :passengers"]
    params: dict = {"passengers": passengers or 1}

    if origin:
        conditions.append("LOWER(origin) LIKE :origin")
        params["origin"] = f"%{origin.lower()}%"

    if destination:
        conditions.append("LOWER(destination) LIKE :destination")
        params["destination"] = f"%{destination.lower()}%"

    if date:
        conditions.append("date = :date")
        params["date"] = date

    where_clause = " AND ".join(conditions)
    sql = f"SELECT * FROM buses WHERE {where_clause} ORDER BY price ASC"

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    return {
        "buses": [row_to_bus(r) for r in rows],
        "total": len(rows),
        "search_params": {"origin": origin, "destination": destination, "date": date}
    }


@app.get("/buses/{bus_id}")
def get_bus(bus_id: int):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM buses WHERE id = :id"), {"id": bus_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Bus not found")
    return row_to_bus(row)


@app.get("/buses")
def list_buses():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM buses ORDER BY date, departure_time")).fetchall()
    return {"buses": [row_to_bus(r) for r in rows], "total": len(rows)}


@app.get("/routes")
def list_all_routes():
    """All routes — no auth required"""
    with engine.connect() as conn:
        trains = conn.execute(text(
            "SELECT 'train' AS type, operator, train_number AS service_number, origin, destination, "
            "date, departure_time, arrival_time, price FROM trains ORDER BY date, departure_time"
        )).fetchall()
        buses = conn.execute(text(
            "SELECT 'bus' AS type, operator, bus_number AS service_number, origin, destination, "
            "date, departure_time, arrival_time, price FROM buses ORDER BY date, departure_time"
        )).fetchall()

    routes = []
    for r in trains:
        routes.append({
            "type": r.type, "operator": r.operator, "service_number": r.service_number,
            "origin": r.origin, "destination": r.destination, "date": str(r.date),
            "departure_time": str(r.departure_time), "arrival_time": str(r.arrival_time),
            "price": float(r.price)
        })
    for r in buses:
        routes.append({
            "type": r.type, "operator": r.operator, "service_number": r.service_number,
            "origin": r.origin, "destination": r.destination, "date": str(r.date),
            "departure_time": str(r.departure_time), "arrival_time": str(r.arrival_time),
            "price": float(r.price)
        })

    return {"routes": routes, "total": len(routes)}


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "transport-service"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
