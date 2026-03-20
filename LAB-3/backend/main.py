"""
ShopSec-AI API Gateway
Main entry point for the e-commerce security testbed
"""
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import httpx
import os
from typing import Optional
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:8001")
SEARCH_SERVICE_URL = os.getenv("SEARCH_SERVICE_URL", "http://localhost:8002")
AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8003")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 ShopSec-AI Gateway starting...")
    yield
    logger.info("👋 ShopSec-AI Gateway shutting down...")

app = FastAPI(
    title="ShopSec-AI API Gateway",
    description="E-Commerce AI Security Testbed",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Intentionally permissive for lab environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # VULNERABILITY: Wide open for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    context: Optional[dict] = None

class SearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    limit: int = 10

# Health Check
@app.get("/health")
async def health_check():
    """Check health of all services"""
    services = {
        "gateway": "healthy",
        "order_service": "unknown",
        "search_service": "unknown",
        "agent_service": "unknown"
    }
    
    async with httpx.AsyncClient() as client:
        # Check order service
        try:
            response = await client.get(f"{ORDER_SERVICE_URL}/health", timeout=2.0)
            services["order_service"] = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            services["order_service"] = "unhealthy"
        
        # Check search service
        try:
            response = await client.get(f"{SEARCH_SERVICE_URL}/health", timeout=2.0)
            services["search_service"] = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            services["search_service"] = "unhealthy"
        
        # Check agent service
        try:
            response = await client.get(f"{AGENT_SERVICE_URL}/health", timeout=2.0)
            services["agent_service"] = "healthy" if response.status_code == 200 else "unhealthy"
        except:
            services["agent_service"] = "unhealthy"
    
    all_healthy = all(status == "healthy" for status in services.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "services": services
    }

# Chat Endpoint - Routes to Agent Service
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Main chat interface for AI agents
    VULNERABILITY: No input sanitization, direct passthrough to agents
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/chat",
                json=request.dict(),
                timeout=30.0
            )
            return response.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Agent service timeout")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Search Endpoint
@app.get("/api/search")
async def search(q: str, limit: int = 10):
    """
    Product search with RAG
    VULNERABILITY: Query passed directly to vector search
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SEARCH_SERVICE_URL}/search",
                params={"q": q, "limit": limit},
                timeout=10.0
            )
            return response.json()
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Product Endpoints
@app.get("/api/products")
async def get_products(category: Optional[str] = None, limit: int = 50):
    """Get product catalog"""
    try:
        async with httpx.AsyncClient() as client:
            params = {"limit": limit}
            if category:
                params["category"] = category
            response = await client.get(
                f"{ORDER_SERVICE_URL}/products",
                params=params,
                timeout=10.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/products/{product_id}")
async def get_product(product_id: int):
    """Get single product details"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ORDER_SERVICE_URL}/products/{product_id}",
                timeout=5.0
            )
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Product not found")
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cart Endpoints
@app.post("/api/cart/add")
async def add_to_cart(product_id: int, quantity: int = 1, user_id: Optional[str] = None):
    """
    Add item to cart
    VULNERABILITY: No quantity validation
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ORDER_SERVICE_URL}/cart/add",
                json={"product_id": product_id, "quantity": quantity, "user_id": user_id},
                timeout=5.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cart")
async def get_cart(user_id: Optional[str] = None):
    """Get user's cart"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ORDER_SERVICE_URL}/cart",
                params={"user_id": user_id},
                timeout=5.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Negotiation Endpoint - The "DealMaker" Agent
@app.post("/api/negotiate")
async def negotiate_price(product_id: int, message: str, user_id: Optional[str] = None):
    """
    Price negotiation with AI agent
    VULNERABILITY: This is the main attack surface for price manipulation
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/negotiate",
                json={"product_id": product_id, "message": message, "user_id": user_id},
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        logger.error(f"Negotiation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Support Endpoint
@app.post("/api/support")
async def support_chat(message: str, order_id: Optional[int] = None, user_id: Optional[str] = None):
    """
    Customer support AI agent
    VULNERABILITY: Can be socially engineered to bypass policies
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/support",
                json={"message": message, "order_id": order_id, "user_id": user_id},
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket for real-time chat
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time agent communication"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # Forward to agent service
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AGENT_SERVICE_URL}/chat",
                    json=data,
                    timeout=30.0
                )
                await websocket.send_json(response.json())
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")

# Admin Endpoints (Intentionally weak auth for lab)
@app.get("/api/admin/orders")
async def get_all_orders(admin_key: Optional[str] = None):
    """
    Get all orders - Admin only
    VULNERABILITY: Weak authentication
    """
    if admin_key != os.getenv("ADMIN_PASSWORD", "admin123"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ORDER_SERVICE_URL}/admin/orders",
                timeout=10.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/thought-chains")
async def get_thought_chains(admin_key: Optional[str] = None, limit: int = 50):
    """
    Get agent thought chains for debugging
    VULNERABILITY: Exposes internal reasoning
    """
    if admin_key != os.getenv("ADMIN_PASSWORD", "admin123"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AGENT_SERVICE_URL}/admin/thought-chains",
                params={"limit": limit},
                timeout=10.0
            )
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
