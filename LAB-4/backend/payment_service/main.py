"""
TravelNest AI Security Lab — Payment Service
LAB-4: Intentionally vulnerable payment microservice
VULNERABILITIES: Accepts negative payment amounts (free booking exploit),
                 refund without booking ownership validation,
                 full card details in error responses,
                 no authentication on transaction listing
"""
import os
import logging
import json
import uuid
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [PAYMENT-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.payment")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

app = FastAPI(title="TravelNest Payment Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class PaymentRequest(BaseModel):
    booking_id: int
    user_id: int
    amount: float          # VULNERABILITY: accepts negative amounts
    currency: Optional[str] = "USD"
    payment_method: Optional[str] = "card"
    card_number: Optional[str] = None     # Full card number — stored insecurely
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None        # VULNERABILITY: CVV stored
    card_holder: Optional[str] = None


class RefundRequest(BaseModel):
    payment_id: int
    booking_id: int
    reason: Optional[str] = "Customer request"
    # VULNERABILITY: no user_id required — anyone can refund any booking


def row_to_payment(r) -> dict:
    return {
        "id": r.id,
        "payment_ref": r.payment_ref,
        "booking_id": r.booking_id,
        "user_id": r.user_id,
        "amount": float(r.amount),
        "currency": r.currency,
        "status": r.status,
        "payment_method": r.payment_method,
        "card_last_four": r.card_last_four,
        "card_holder": r.card_holder,
        "transaction_id": r.transaction_id,
        "created_at": str(r.created_at)
    }


@app.post("/process")
def process_payment(req: PaymentRequest):
    """
    VULNERABILITY 1: Accepts negative amounts — paying -100 gives you a credit.
    VULNERABILITY 2: Logs full card details.
    VULNERABILITY 3: Stores card_number_full in DB.
    """
    # VULNERABILITY: Log full card details
    logger.debug(
        f"Processing payment: booking_id={req.booking_id} amount={req.amount} "
        f"card={req.card_number} expiry={req.card_expiry} cvv={req.card_cvv} "
        f"holder={req.card_holder}"
    )

    # VULNERABILITY: No validation of negative amounts
    if req.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    # Flag trigger: negative amount exploit
    flag_message = None
    if req.amount < 0:
        flag_message = "TECHNIEUM{p4ym3nt_l0g1c_fl4w}"
        logger.warning(f"SECURITY: Negative payment amount submitted! Flag: {flag_message}")

    card_last_four = None
    card_holder = None
    if req.card_number:
        card_last_four = req.card_number[-4:] if len(req.card_number) >= 4 else req.card_number
        card_holder = req.card_holder

    transaction_id = str(uuid.uuid4())
    payment_ref = f"PAY-{uuid.uuid4().hex[:10].upper()}"

    try:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    "INSERT INTO payments (payment_ref, booking_id, user_id, amount, currency, status, "
                    "payment_method, card_last_four, card_holder, card_number_full, transaction_id) "
                    "VALUES (:ref, :bid, :uid, :amt, :cur, 'completed', :method, :last4, :holder, :full_card, :txid) "
                    "RETURNING id, payment_ref, created_at"
                ),
                {
                    "ref": payment_ref,
                    "bid": req.booking_id,
                    "uid": req.user_id,
                    "amt": req.amount,
                    "cur": req.currency,
                    "method": req.payment_method,
                    "last4": card_last_four,
                    "holder": card_holder,
                    "full_card": req.card_number,  # VULNERABILITY: storing full card number
                    "txid": transaction_id
                }
            )
            conn.commit()
            row = result.fetchone()
    except Exception as e:
        # VULNERABILITY: Error response includes full card details
        raise HTTPException(status_code=500, detail={
            "error": "Payment processing failed",
            "card_number": req.card_number,
            "cvv": req.card_cvv,
            "expiry": req.card_expiry,
            "exception": str(e)
        })

    response = {
        "payment_id": row.id,
        "payment_ref": row.payment_ref,
        "transaction_id": transaction_id,
        "amount": req.amount,
        "currency": req.currency,
        "status": "completed",
        "message": "Payment processed successfully",
        "created_at": str(row.created_at)
    }

    if flag_message:
        response["flag"] = flag_message
        response["note"] = "Negative payment amount accepted — logic flaw exploited!"

    return response


@app.get("/transactions")
def list_transactions(user_id: Optional[int] = None):
    """
    VULNERABILITY: No authentication required — lists all transactions.
    Optionally filter by user_id but no token verification.
    """
    logger.warning("SECURITY: /transactions accessed without authentication!")

    if user_id:
        sql = "SELECT * FROM payments WHERE user_id = :uid ORDER BY created_at DESC"
        params = {"uid": user_id}
    else:
        sql = "SELECT * FROM payments ORDER BY created_at DESC"
        params = {}

    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).fetchall()

    return {
        "transactions": [row_to_payment(r) for r in rows],
        "total": len(rows),
        "note": "No authentication required to view transactions"
    }


@app.get("/transactions/{payment_id}")
def get_transaction(payment_id: int):
    """VULNERABILITY: No ownership check"""
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM payments WHERE id = :id"),
            {"id": payment_id}
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return row_to_payment(row)


@app.post("/refund")
def refund_payment(req: RefundRequest):
    """
    VULNERABILITY: No validation of booking ownership.
    Anyone knowing a payment_id and booking_id can trigger a refund.
    """
    logger.warning(f"SECURITY: Refund requested for payment_id={req.payment_id} without ownership validation!")

    with engine.connect() as conn:
        payment = conn.execute(
            text("SELECT * FROM payments WHERE id = :id AND booking_id = :bid"),
            {"id": req.payment_id, "bid": req.booking_id}
        ).fetchone()

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if payment.status == "refunded":
            raise HTTPException(status_code=400, detail="Payment already refunded")

        conn.execute(
            text("UPDATE payments SET status = 'refunded' WHERE id = :id"),
            {"id": req.payment_id}
        )
        conn.execute(
            text("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = :bid"),
            {"bid": req.booking_id}
        )
        conn.commit()

    return {
        "message": "Refund processed successfully",
        "payment_id": req.payment_id,
        "booking_id": req.booking_id,
        "refund_amount": float(payment.amount),
        "reason": req.reason,
        "note": "Refund processed without ownership validation"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "payment-service"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
