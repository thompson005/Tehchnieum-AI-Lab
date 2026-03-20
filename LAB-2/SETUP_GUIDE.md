# SecureBank AI - Setup Guide

## Prerequisites

- Docker Desktop installed and running
- At least 8GB RAM available
- 10GB free disk space
- Internet connection (for pulling images and models)

## Quick Start (Recommended)

```bash
# Navigate to LAB-2
cd "Rejen Thompson/AI_course/Labs/LAB-2"

# Start all services
docker-compose up -d

# Wait for services to be healthy (2-3 minutes)
docker-compose ps

# Pull Ollama model (first time only)
docker exec securebank-llm ollama pull llama3

# Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

## Default Credentials

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| john.doe | SecureBank123! | customer | Regular user testing |
| jane.smith | SecureBank123! | customer | Regular user testing |
| attacker | SecureBank123! | customer | Penetration testing |
| admin | SecureBank123! | admin | Administrative access |

## Service Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Ollama**: http://localhost:11434

## Step-by-Step Setup

### 1. Start Infrastructure Services

```bash
# Start database and cache first
docker-compose up -d postgres redis

# Wait for health checks
docker-compose ps
```

### 2. Start Ollama and Pull Model

```bash
# Start Ollama
docker-compose up -d ollama

# Wait 30 seconds for Ollama to initialize
sleep 30

# Pull the LLM model (this may take 5-10 minutes)
docker exec securebank-llm ollama pull llama3

# Verify model is available
docker exec securebank-llm ollama list
```

### 3. Start Backend API

```bash
# Start the FastAPI backend
docker-compose up -d backend

# Check logs
docker-compose logs -f backend

# Wait for "Application startup complete"
```

### 4. Start Frontend

```bash
# Start React frontend
docker-compose up -d frontend

# Check logs
docker-compose logs -f frontend

# Wait for "webpack compiled successfully"
```

### 5. Verify Installation

```bash
# Check all services are running
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Open frontend
open http://localhost:3000
```

## Troubleshooting

### Ollama Model Not Found

```bash
# Pull the model manually
docker exec -it securebank-llm ollama pull llama3

# Or use a smaller model
docker exec -it securebank-llm ollama pull mistral
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection
docker exec securebank-db psql -U bankadmin -d securebank -c "SELECT 1;"
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Backend API Errors

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check environment variables
docker exec securebank-api env | grep DATABASE_URL
```

## Development Mode

For development with hot-reload:

```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend development
cd frontend
npm install
npm start
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Stop and remove everything including images
docker-compose down -v --rmi all
```

## Resource Requirements

- **Minimum**: 8GB RAM, 4 CPU cores
- **Recommended**: 16GB RAM, 8 CPU cores
- **Disk Space**: ~10GB (including Ollama models)

## Next Steps

1. Login with test credentials
2. Explore the dashboard
3. Try the AI features
4. Review [Vulnerability Scenarios](./docs/SCENARIOS.md)
5. Start penetration testing!

## Support

If you encounter issues:
1. Check service logs: `docker-compose logs [service-name]`
2. Verify all services are healthy: `docker-compose ps`
3. Restart problematic service: `docker-compose restart [service-name]`
4. Clean restart: `docker-compose down -v && docker-compose up -d`
