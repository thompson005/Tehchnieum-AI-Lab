"""
TravelNest AI Security Lab — API Gateway
LAB-4: Intentionally vulnerable API gateway for security training
VULNERABILITIES: CORS misconfiguration, JWT bypass via X-Admin-Override header,
                 sensitive data logging, bypassable rate limiting
"""
import os
import time
import logging
from collections import defaultdict
from typing import Optional

import httpx
from fastapi import FastAPI, Request, Response, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ─────────────────────────────────────────────────────────────────────────────
# Logging (intentionally logs sensitive data)
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [GATEWAY] %(levelname)s %(message)s"
)
logger = logging.getLogger("travelnest.gateway")

# ─────────────────────────────────────────────────────────────────────────────
# Service URLs
# ─────────────────────────────────────────────────────────────────────────────
USER_SERVICE_URL      = os.getenv("USER_SERVICE_URL",      "http://lab4-user:8001")
FLIGHT_SERVICE_URL    = os.getenv("FLIGHT_SERVICE_URL",    "http://lab4-flight:8002")
HOTEL_SERVICE_URL     = os.getenv("HOTEL_SERVICE_URL",     "http://lab4-hotel:8003")
BOOKING_SERVICE_URL   = os.getenv("BOOKING_SERVICE_URL",   "http://lab4-booking:8004")
PAYMENT_SERVICE_URL   = os.getenv("PAYMENT_SERVICE_URL",   "http://lab4-payment:8005")
TRANSPORT_SERVICE_URL = os.getenv("TRANSPORT_SERVICE_URL", "http://lab4-transport:8006")
AI_AGENT_URL          = os.getenv("AI_AGENT_URL",          "http://lab4-ai-agent:9000")

# ─────────────────────────────────────────────────────────────────────────────
# App + CORS (VULNERABILITY: wide-open CORS)
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="TravelNest AI Gateway",
    description="API Gateway for TravelNest AI travel booking platform",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# VULNERABILITY: CORS completely open - any origin can make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Rate limiting (VULNERABILITY: easily bypassable by rotating IPs / X-Forwarded-For)
# ─────────────────────────────────────────────────────────────────────────────
request_counts: dict = defaultdict(lambda: {"count": 0, "window_start": time.time()})
RATE_LIMIT = 100  # requests per window
RATE_WINDOW = 60  # seconds

def check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    record = request_counts[client_ip]
    if now - record["window_start"] > RATE_WINDOW:
        record["count"] = 0
        record["window_start"] = now
    record["count"] += 1
    return record["count"] <= RATE_LIMIT


# ─────────────────────────────────────────────────────────────────────────────
# Middleware: Logging + Rate limiting
# ─────────────────────────────────────────────────────────────────────────────
@app.middleware("http")
async def logging_and_rate_limit_middleware(request: Request, call_next):
    start_time = time.time()

    # VULNERABILITY: Trusts X-Forwarded-For header for rate limiting
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

    # Rate limit check
    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for {client_ip}")
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})

    # VULNERABILITY: Logs full request body including passwords/card numbers
    body = b""
    try:
        body = await request.body()
        logger.debug(
            f"REQUEST {request.method} {request.url.path} "
            f"from={client_ip} "
            f"headers={dict(request.headers)} "
            f"body={body.decode('utf-8', errors='replace')[:2000]}"
        )
    except Exception:
        pass

    # Re-attach body so downstream can read it
    async def receive():
        return {"type": "http.request", "body": body}
    request._receive = receive

    response = await call_next(request)
    duration = (time.time() - start_time) * 1000
    logger.info(f"RESPONSE {request.method} {request.url.path} status={response.status_code} duration={duration:.1f}ms")
    return response


# ─────────────────────────────────────────────────────────────────────────────
# JWT verification (VULNERABILITY: bypassable with X-Admin-Override header)
# ─────────────────────────────────────────────────────────────────────────────
def verify_jwt_or_bypass(authorization: Optional[str], x_admin_override: Optional[str]) -> dict:
    """
    VULNERABILITY: Accepts X-Admin-Override: true header to bypass all auth checks.
    This simulates a debug/maintenance backdoor left in production.
    """
    if x_admin_override and x_admin_override.lower() in ("true", "1", "yes", "OVERRIDE-TRAVELNEST-9921"):
        logger.warning("SECURITY: Admin override header used — bypassing JWT verification!")
        return {"user_id": 1, "username": "admin", "role": "admin", "bypass": True}

    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    try:
        from jose import jwt
        SECRET_KEY = "travelnest_secret_key_2024"  # VULNERABILITY: hardcoded
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception as e:
        logger.warning(f"JWT decode failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Proxy helper
# ─────────────────────────────────────────────────────────────────────────────
async def proxy_request(request: Request, target_url: str) -> Response:
    """Generic proxy that forwards the request to the target service."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        body = await request.body()
        headers = dict(request.headers)
        headers.pop("host", None)

        # Forward query params
        params = dict(request.query_params)

        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=params
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type", "application/json")
            )
        except httpx.ConnectError as e:
            logger.error(f"Service unavailable: {target_url} — {e}")
            return JSONResponse(
                status_code=503,
                content={"error": "Service unavailable", "target": target_url}
            )
        except Exception as e:
            logger.error(f"Proxy error to {target_url}: {e}")
            return JSONResponse(status_code=502, content={"error": "Bad gateway", "detail": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/auth/login")
async def login(request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/login")

@app.post("/api/auth/register")
async def register(request: Request):
    return await proxy_request(request, f"{USER_SERVICE_URL}/register")

@app.get("/api/auth/profile")
async def profile(request: Request, authorization: Optional[str] = Header(None)):
    return await proxy_request(request, f"{USER_SERVICE_URL}/profile")


# ─────────────────────────────────────────────────────────────────────────────
# FLIGHT ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/flights/search")
async def search_flights(request: Request):
    return await proxy_request(request, f"{FLIGHT_SERVICE_URL}/search")

@app.get("/api/flights/{flight_id}")
async def get_flight(request: Request, flight_id: int):
    return await proxy_request(request, f"{FLIGHT_SERVICE_URL}/flights/{flight_id}")

@app.get("/api/flights")
async def list_flights(request: Request):
    return await proxy_request(request, f"{FLIGHT_SERVICE_URL}/flights")


# ─────────────────────────────────────────────────────────────────────────────
# HOTEL ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/hotels/search")
async def search_hotels(request: Request):
    return await proxy_request(request, f"{HOTEL_SERVICE_URL}/search")

@app.get("/api/hotels/{hotel_id}")
async def get_hotel(request: Request, hotel_id: int):
    return await proxy_request(request, f"{HOTEL_SERVICE_URL}/hotels/{hotel_id}")

@app.get("/api/hotels")
async def list_hotels(request: Request):
    return await proxy_request(request, f"{HOTEL_SERVICE_URL}/hotels")

@app.post("/api/hotels/reviews")
async def post_review(request: Request):
    return await proxy_request(request, f"{HOTEL_SERVICE_URL}/reviews")


# ─────────────────────────────────────────────────────────────────────────────
# TRANSPORT ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/trains/search")
async def search_trains(request: Request):
    return await proxy_request(request, f"{TRANSPORT_SERVICE_URL}/trains/search")

@app.get("/api/buses/search")
async def search_buses(request: Request):
    return await proxy_request(request, f"{TRANSPORT_SERVICE_URL}/buses/search")

@app.get("/api/trains/{train_id}")
async def get_train(request: Request, train_id: int):
    return await proxy_request(request, f"{TRANSPORT_SERVICE_URL}/trains/{train_id}")

@app.get("/api/buses/{bus_id}")
async def get_bus(request: Request, bus_id: int):
    return await proxy_request(request, f"{TRANSPORT_SERVICE_URL}/buses/{bus_id}")


# ─────────────────────────────────────────────────────────────────────────────
# BOOKING ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/bookings")
async def create_booking(request: Request, authorization: Optional[str] = Header(None)):
    return await proxy_request(request, f"{BOOKING_SERVICE_URL}/bookings")

@app.get("/api/bookings")
async def get_bookings(request: Request, authorization: Optional[str] = Header(None)):
    return await proxy_request(request, f"{BOOKING_SERVICE_URL}/bookings")

@app.get("/api/bookings/{booking_id}")
async def get_booking(request: Request, booking_id: int):
    return await proxy_request(request, f"{BOOKING_SERVICE_URL}/bookings/{booking_id}")

@app.delete("/api/bookings/{booking_id}")
async def cancel_booking(request: Request, booking_id: int):
    return await proxy_request(request, f"{BOOKING_SERVICE_URL}/bookings/{booking_id}")


# ─────────────────────────────────────────────────────────────────────────────
# PAYMENT ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/payments")
async def process_payment(request: Request):
    return await proxy_request(request, f"{PAYMENT_SERVICE_URL}/process")

@app.post("/api/payments/refund")
async def refund_payment(request: Request):
    return await proxy_request(request, f"{PAYMENT_SERVICE_URL}/refund")

@app.get("/api/payments/transactions")
async def list_transactions(request: Request):
    return await proxy_request(request, f"{PAYMENT_SERVICE_URL}/transactions")


# ─────────────────────────────────────────────────────────────────────────────
# AI AGENT ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/ai/chat")
async def ai_chat(request: Request):
    return await proxy_request(request, f"{AI_AGENT_URL}/chat")

@app.post("/api/ai/upload-doc")
async def upload_doc(request: Request):
    """VULNERABILITY: RAG poisoning endpoint - no sanitization of uploaded docs"""
    return await proxy_request(request, f"{AI_AGENT_URL}/upload-doc")

@app.get("/api/ai/memory")
async def get_memory(request: Request):
    return await proxy_request(request, f"{AI_AGENT_URL}/memory")

@app.post("/api/ai/reset-memory")
async def reset_memory(request: Request):
    return await proxy_request(request, f"{AI_AGENT_URL}/reset-memory")

@app.get("/api/ai/system-prompt")
async def get_system_prompt(request: Request):
    """VULNERABILITY: Debug endpoint exposes system prompt"""
    return await proxy_request(request, f"{AI_AGENT_URL}/system-prompt")


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ROUTES (VULNERABILITY: weak auth)
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/api/admin/all-bookings")
async def admin_all_bookings(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_admin_override: Optional[str] = Header(None, alias="X-Admin-Override")
):
    """VULNERABILITY: Can be bypassed with X-Admin-Override header"""
    user = verify_jwt_or_bypass(authorization, x_admin_override)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Even authenticated non-admins can access with override
    if user.get("role") != "admin" and not user.get("bypass"):
        raise HTTPException(status_code=403, detail="Admin access required")

    return await proxy_request(request, f"{BOOKING_SERVICE_URL}/admin/all-bookings")

@app.get("/api/admin/users")
async def admin_users(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_admin_override: Optional[str] = Header(None, alias="X-Admin-Override")
):
    user = verify_jwt_or_bypass(authorization, x_admin_override)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return await proxy_request(request, f"{USER_SERVICE_URL}/users")

@app.get("/api/admin/flags")
async def admin_flags(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_admin_override: Optional[str] = Header(None, alias="X-Admin-Override")
):
    """VULNERABILITY: Exposes flag table via admin override"""
    user = verify_jwt_or_bypass(authorization, x_admin_override)
    if not user or (user.get("role") != "admin" and not user.get("bypass")):
        raise HTTPException(status_code=403, detail="Forbidden")
    return await proxy_request(request, f"{USER_SERVICE_URL}/admin/flags")


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Aggregate health check across all services"""
    services = {
        "user":      USER_SERVICE_URL,
        "flight":    FLIGHT_SERVICE_URL,
        "hotel":     HOTEL_SERVICE_URL,
        "booking":   BOOKING_SERVICE_URL,
        "payment":   PAYMENT_SERVICE_URL,
        "transport": TRANSPORT_SERVICE_URL,
        "ai_agent":  AI_AGENT_URL,
    }
    results = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, url in services.items():
            try:
                r = await client.get(f"{url}/health")
                results[name] = {"status": "ok", "code": r.status_code}
            except Exception as e:
                results[name] = {"status": "error", "detail": str(e)}

    overall = "healthy" if all(v["status"] == "ok" for v in results.values()) else "degraded"
    return {
        "status": overall,
        "gateway": "TravelNest API Gateway v2.1.0",
        "services": results,
        "note": "DEBUG MODE ACTIVE - CORS unrestricted"  # VULNERABILITY: leaks config info
    }


@app.get("/")
async def root():
    return {
        "service": "TravelNest AI Gateway",
        "version": "2.1.0",
        "docs": "/docs",
        "health": "/health"
    }
