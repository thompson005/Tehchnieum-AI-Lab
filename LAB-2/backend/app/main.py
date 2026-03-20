from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.redis_client import redis_client
from app.api import auth, chat, transactions, accounts, loans
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SecureBank AI API",
    description="Banking at the Speed of Intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting SecureBank AI API...")
    await redis_client.connect()
    logger.info("Connected to Redis")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Vulnerable Mode: {settings.ENABLE_VULNERABLE_MODE}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down SecureBank AI API...")
    await redis_client.disconnect()

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SecureBank AI",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to SecureBank AI",
        "tagline": "Banking at the Speed of Intelligence",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(accounts.router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(loans.router, prefix="/api/loans", tags=["Loans"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please contact support."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
