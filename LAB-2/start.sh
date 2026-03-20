#!/bin/bash

# SecureBank AI - Startup Script
# This script automates the initial setup and deployment

set -e

echo "================================================"
echo "  SecureBank AI - Production-Grade AI Security Lab"
echo "  Banking at the Speed of Intelligence"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "Checking prerequisites..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check available memory
AVAILABLE_MEM=$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
if [ "$AVAILABLE_MEM" -lt 8000000000 ]; then
    echo -e "${YELLOW}Warning: Less than 8GB RAM allocated to Docker. Performance may be affected.${NC}"
fi

# Check disk space
AVAILABLE_DISK=$(df -k . | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_DISK" -lt 10000000 ]; then
    echo -e "${YELLOW}Warning: Less than 10GB disk space available.${NC}"
fi

echo ""
echo "Starting SecureBank AI services..."
echo ""

# Stop any existing containers
echo "Cleaning up existing containers..."
docker-compose down > /dev/null 2>&1 || true

# Start infrastructure services first
echo "Starting infrastructure services (PostgreSQL, Redis)..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "Waiting for database to initialize..."
sleep 10

# Check database health
until docker-compose exec -T postgres pg_isready -U bankadmin > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Check Redis health
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo "  Waiting for Redis..."
    sleep 2
done
echo -e "${GREEN}✓ Redis is ready${NC}"

# Start Ollama
echo ""
echo "Starting Ollama LLM service..."
docker-compose up -d ollama

echo "Waiting for Ollama to initialize (30 seconds)..."
sleep 30

# Check if model exists
echo "Checking for Llama 3 model..."
if docker exec securebank-llm ollama list 2>/dev/null | grep -q "llama3"; then
    echo -e "${GREEN}✓ Llama 3 model already available${NC}"
else
    echo "Pulling Llama 3 model (this may take 5-10 minutes)..."
    echo -e "${YELLOW}Note: This is a one-time download. Grab a coffee! ☕${NC}"
    docker exec securebank-llm ollama pull llama3
    echo -e "${GREEN}✓ Llama 3 model downloaded${NC}"
fi

# Start backend
echo ""
echo "Starting backend API..."
docker-compose up -d backend

echo "Waiting for backend to start..."
sleep 15

# Check backend health
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "  Waiting for backend API..."
    sleep 3
done
echo -e "${GREEN}✓ Backend API is ready${NC}"

# Start frontend
echo ""
echo "Starting frontend..."
docker-compose up -d frontend

echo "Waiting for frontend to compile (this may take 2-3 minutes)..."
echo -e "${YELLOW}Note: Webpack is compiling the React application...${NC}"
sleep 60

# Final status check
echo ""
echo "================================================"
echo "  Checking service status..."
echo "================================================"
docker-compose ps

echo ""
echo "================================================"
echo "  🎉 SecureBank AI is ready!"
echo "================================================"
echo ""
echo "Access the application:"
echo -e "  ${GREEN}Frontend:${NC}        http://localhost:3000"
echo -e "  ${GREEN}API Docs:${NC}        http://localhost:8000/docs"
echo -e "  ${GREEN}Health Check:${NC}    http://localhost:8000/health"
echo ""
echo "Test Credentials:"
echo "  Username: attacker"
echo "  Password: SecureBank123!"
echo ""
echo "Other users: john.doe, jane.smith, admin"
echo "  (all use password: SecureBank123!)"
echo ""
echo "Documentation:"
echo "  Quick Start:     ./QUICK_START.md"
echo "  Setup Guide:     ./SETUP_GUIDE.md"
echo "  Attack Guide:    ./docs/ATTACK_GUIDE.md"
echo "  Scenarios:       ./docs/SCENARIOS.md"
echo ""
echo "Useful commands:"
echo "  View logs:       docker-compose logs -f"
echo "  Stop services:   docker-compose down"
echo "  Restart:         docker-compose restart"
echo ""
echo -e "${GREEN}Happy hacking! 🚀🔒${NC}"
echo ""
