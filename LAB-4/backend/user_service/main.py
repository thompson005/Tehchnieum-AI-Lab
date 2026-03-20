"""
TravelNest AI Security Lab — User Service
LAB-4: Intentionally vulnerable user/auth microservice
VULNERABILITIES: Hardcoded JWT secret, SQL injection in search,
                 passwords logged in plaintext, weak admin check
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from jose import jwt, JWTError

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [USER-SVC] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.user")

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://travelnest:travelnest123@lab4-postgres:5432/travelnest")
# VULNERABILITY: Hardcoded JWT secret
SECRET_KEY = os.getenv("SECRET_KEY", "travelnest_secret_key_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="TravelNest User Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    full_name: Optional[str]
    passport_number: Optional[str]
    created_at: str


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(authorization.split(" ", 1)[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


# ─────────────────────────────────────────────────────────────────────────────
# Startup: seed default admin if no users exist
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    try:
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
            if count == 0:
                logger.info("No users found — seeding default admin")
                hashed = pwd_context.hash("TravelNest2024!")
                conn.execute(text(
                    "INSERT INTO users (username, email, password_hash, role, full_name) "
                    "VALUES ('admin', 'admin@travelnest.ai', :pw, 'admin', 'TravelNest Admin')"
                ), {"pw": hashed})
                conn.commit()
    except Exception as e:
        logger.warning(f"Startup seed failed (DB may not be ready): {e}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/register")
def register(req: RegisterRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password too short")
    hashed = pwd_context.hash(req.password)
    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT id FROM users WHERE username = :u OR email = :e"),
            {"u": req.username, "e": req.email}
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Username or email already taken")
        result = conn.execute(
            text("INSERT INTO users (username, email, password_hash, role, full_name, phone) "
                 "VALUES (:u, :e, :pw, 'user', :fn, :ph) RETURNING id, username, email, role"),
            {"u": req.username, "e": req.email, "pw": hashed, "fn": req.full_name, "ph": req.phone}
        )
        conn.commit()
        row = result.fetchone()
    token = create_access_token({"sub": str(row.id), "username": row.username, "role": row.role})
    return {"message": "Registration successful", "token": token, "user_id": row.id, "username": row.username}


@app.post("/login")
def login(req: LoginRequest):
    # VULNERABILITY: Logs plaintext password
    logger.debug(f"Login attempt: username={req.username} password={req.password}")

    # VULNERABILITY: SQL Injection in username lookup
    raw_sql = f"SELECT * FROM users WHERE username='{req.username}'"
    logger.debug(f"Executing: {raw_sql}")

    with engine.connect() as conn:
        try:
            result = conn.execute(text(raw_sql))
            user = result.fetchone()
        except Exception as e:
            logger.error(f"SQL error: {e}")
            raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Update last login
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET last_login = NOW() WHERE id = :id"), {"id": user.id})
        conn.commit()

    token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})
    logger.info(f"Login success: user_id={user.id} username={user.username} role={user.role}")
    return {
        "token": token,
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name
    }


@app.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, username, email, role, full_name, passport_number, phone, nationality, created_at FROM users WHERE id = :id"),
            {"id": int(current_user["sub"])}
        ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "passport_number": user.passport_number,
        "phone": user.phone,
        "nationality": user.nationality,
        "created_at": str(user.created_at)
    }


@app.get("/users")
def list_users(
    admin_key: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    """
    VULNERABILITY: Weak admin check — accepts ?admin_key=admin123 as auth
    """
    is_admin = False
    if admin_key == "admin123":
        is_admin = True
        logger.warning("SECURITY: Admin endpoint accessed via weak admin_key param!")
    elif authorization and authorization.startswith("Bearer "):
        payload = verify_token(authorization.split(" ", 1)[1])
        if payload and payload.get("role") == "admin":
            is_admin = True

    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, username, email, role, full_name, passport_number, phone, nationality, created_at, last_login FROM users")
        ).fetchall()

    return {
        "users": [
            {
                "id": r.id,
                "username": r.username,
                "email": r.email,
                "role": r.role,
                "full_name": r.full_name,
                "passport_number": r.passport_number,  # VULNERABILITY: exposes passport numbers
                "phone": r.phone,
                "nationality": r.nationality,
                "created_at": str(r.created_at),
                "last_login": str(r.last_login)
            }
            for r in rows
        ],
        "total": len(rows)
    }


@app.get("/admin/flags")
def get_secret_flags(admin_key: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """VULNERABILITY: Exposes secret flags to anyone with admin_key=admin123"""
    is_admin = admin_key == "admin123"
    if not is_admin and authorization and authorization.startswith("Bearer "):
        payload = verify_token(authorization.split(" ", 1)[1])
        if payload and payload.get("role") == "admin":
            is_admin = True
    if not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT * FROM secret_flags")).fetchall()
    return {"flags": [{"id": r.id, "name": r.flag_name, "value": r.flag_value, "hint": r.hint, "points": r.points} for r in rows]}


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "service": "user-service", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
