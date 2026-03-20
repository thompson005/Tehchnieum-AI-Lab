#!/bin/bash

# ShopSec-AI Lite Mode Runner
# Runs services locally without Docker

echo "🚀 Starting ShopSec-AI in Lite Mode..."

# 1. Setup Environment
echo "📦 Setting up environment..."
source venv/bin/activate
export DATABASE_URL="sqlite:///$(pwd)/shopsec.db"
export OPENAI_API_KEY="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"
export OLLAMA_BASE_URL="http://mock-ollama" # Ignored when OpenAI Key is present
export ENABLE_GUARDRAILS="false"
export LOG_LEVEL="INFO"

# 2. Initialize Database (if needed)
if [ ! -f "shopsec.db" ]; then
    echo "💽 Initializing SQLite database..."
    # We need a small script to create tables since we can't run the full alembic migration easily without config
    # Creating a temp init script
    cat <<EOF > init_db_lite.py
from backend.database.models import Base
from sqlalchemy import create_engine
import os

db_url = os.getenv("DATABASE_URL")
print(f"Creating tables in {db_url}")
engine = create_engine(db_url)
Base.metadata.create_all(engine)
print("Tables created!")
EOF
    
    python3 init_db_lite.py
    
    echo "🌱 Seeding data..."
    # We might need to patch seed_data.py to work with SQLite if it uses postgres specific stuff
    # For now, let's try running it directly
    python3 backend/database/seed_data.py
    
    rm init_db_lite.py
fi

# 3. Start Services
# We will use background processes
echo "🔌 Starting services..."

# Kill existing
pkill -f "uvicorn"

# Agent Core (8003)
echo "   - Agent Core (Port 8003)..."
(cd backend/services/agent_core && uvicorn main:app --port 8003 --host 0.0.0.0) &
PID_AGENT=$!

# Order Service (8001)
if [ -d "backend/services/order_service" ]; then
    echo "   - Order Service (Port 8001)..."
    (cd backend/services/order_service && uvicorn main:app --port 8001 --host 0.0.0.0) &
    PID_ORDER=$!
fi

# API Gateway (8000)
echo "   - API Gateway (Port 8000)..."
(cd backend && uvicorn main:app --port 8000 --host 0.0.0.0) &
PID_GATEWAY=$!

# Frontend (3000)
echo "   - Frontend (Port 3000)..."
(cd lite_frontend && python3 -m http.server 3000) &
PID_FRONTEND=$!

echo "✅ Services are running!"
echo "   - 🖥️  Frontend: http://localhost:3000"
echo "   - 🔌 API Gateway: http://localhost:8000/docs"
echo "   - 🤖 Agent Core: http://localhost:8003/docs"
echo ""
echo "📝 To stop: Press Ctrl+C"

# Wait for Ctrl+C
trap "kill $PID_AGENT $PID_ORDER $PID_GATEWAY $PID_FRONTEND; echo '🛑 Stopped all services'; exit" INT
wait
