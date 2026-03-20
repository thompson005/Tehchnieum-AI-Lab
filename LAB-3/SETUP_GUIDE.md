# ShopSec-AI Setup Guide

## Prerequisites

### Required Software

1. **Docker Desktop** (v24.0+)
   - [Download for Mac](https://www.docker.com/products/docker-desktop/)
   - Ensure Docker Compose is included

2. **Python 3.11+**
   ```bash
   python3 --version  # Should be 3.11 or higher
   ```

3. **Node.js 18+**
   ```bash
   node --version  # Should be v18 or higher
   npm --version
   ```

4. **Ollama** (for local LLM)
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Pull required model
   ollama pull llama3
   ```

### Optional Tools

- **PostgreSQL Client** (for database inspection)
  ```bash
  brew install postgresql  # macOS
  ```

- **HTTPie** (for API testing)
  ```bash
  brew install httpie  # macOS
  ```

## Installation Steps

### 1. Environment Setup

```bash
# Navigate to LAB-3 directory
cd "Rejen Thompson/AI_course/Labs/LAB-3"

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://shopsec:shopsec123@localhost:5432/shopsec_db
POSTGRES_USER=shopsec
POSTGRES_PASSWORD=shopsec123
POSTGRES_DB=shopsec_db

# AI Models
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# API Keys (for production models - optional)
OPENAI_API_KEY=your_key_here  # Optional: for GPT-4 comparison
ANTHROPIC_API_KEY=your_key_here  # Optional: for Claude comparison

# Security Settings
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-change-in-production
ADMIN_PASSWORD=admin123  # Change this!

# Feature Flags
ENABLE_GUARDRAILS=false  # Set to true for defensive mode
ENABLE_MONITORING=true
ENABLE_TRAFFIC_GEN=false  # Set to true for realistic traffic

# Stripe Mock
STRIPE_MOCK_PORT=8004
STRIPE_PUBLISHABLE_KEY=pk_test_mock
STRIPE_SECRET_KEY=sk_test_mock

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### 3. Database Initialization

```bash
# Start PostgreSQL with pgvector
docker-compose up -d postgres

# Wait for database to be ready
sleep 5

# Run migrations
python backend/database/migrate.py

# Seed with sample data
python backend/database/seed_data.py
```

Expected output:
```
✓ Created tables
✓ Inserted 50 products
✓ Created 10 user accounts
✓ Generated 25 sample reviews
✓ Created 15 sample orders
Database seeded successfully!
```

### 4. Start Services

#### Option A: Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

#### Option B: Manual Start (for development)

Terminal 1 - Backend API:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Terminal 2 - Order Service:
```bash
cd backend/services/order_service
uvicorn main:app --reload --port 8001
```

Terminal 3 - Search Service:
```bash
cd backend/services/search_service
uvicorn main:app --reload --port 8002
```

Terminal 4 - Agent Core:
```bash
cd backend/services/agent_core
uvicorn main:app --reload --port 8003
```

Terminal 5 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 6 - Monitoring Dashboard:
```bash
cd monitoring
streamlit run dashboard.py --server.port 8501
```

### 5. Verify Installation

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000

# Test AI agent
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me find a laptop?"}'

# Test search
curl http://localhost:8000/api/search?q=laptop

# Check monitoring dashboard
open http://localhost:8501
```

## Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main storefront |
| API Gateway | http://localhost:8000 | Backend API |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Order Service | http://localhost:8001 | Cart & checkout |
| Search Service | http://localhost:8002 | Product search |
| Agent Core | http://localhost:8003 | AI agents |
| Payment Mock | http://localhost:8004 | Stripe simulation |
| Monitoring | http://localhost:8501 | Streamlit dashboard |
| Admin Panel | http://localhost:3000/admin | Admin interface |

## Test Accounts

### Customer Accounts
- **Email**: alice@example.com | **Password**: password123
- **Email**: bob@example.com | **Password**: password123
- **Email**: charlie@example.com | **Password**: password123

### Admin Account
- **Email**: admin@shopsec.ai | **Password**: admin123

## Troubleshooting

### Issue: Ollama connection refused

```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Test connection
curl http://localhost:11434/api/tags
```

### Issue: Database connection error

```bash
# Check PostgreSQL container
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection
psql postgresql://shopsec:shopsec123@localhost:5432/shopsec_db -c "SELECT 1;"
```

### Issue: Port already in use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different ports in .env
```

### Issue: Frontend build errors

```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Issue: Vector embeddings not working

```bash
# Reinstall sentence-transformers
pip uninstall sentence-transformers
pip install sentence-transformers

# Download model manually
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

## Development Workflow

### Running Tests

```bash
# Backend tests
pytest backend/tests/ -v

# Frontend tests
cd frontend
npm test

# Integration tests
pytest tests/integration/ -v
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U shopsec -d shopsec_db

# Backup database
docker-compose exec postgres pg_dump -U shopsec shopsec_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U shopsec shopsec_db < backup.sql

# Reset database
make reset-db
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f agent_core

# Backend logs
tail -f backend/logs/app.log

# Frontend logs
cd frontend && npm run dev  # Logs to console
```

## Performance Optimization

### For Faster Embeddings

```bash
# Use GPU acceleration (if available)
pip install sentence-transformers[gpu]

# Or use smaller model
EMBEDDING_MODEL=sentence-transformers/paraphrase-MiniLM-L3-v2
```

### For Faster LLM Responses

```bash
# Use smaller Ollama model
ollama pull llama3:8b  # Instead of default

# Or use quantized version
ollama pull llama3:8b-q4_0
```

## Security Notes

### For Lab Environment Only

- Default passwords are intentionally weak for testing
- CORS is wide open for development
- Rate limiting is disabled
- Logging is verbose

### Before Production (Never Deploy This!)

This lab contains intentionally vulnerable code. If you were to adapt this:
- Change all default passwords
- Enable HTTPS/TLS
- Implement proper authentication
- Enable rate limiting
- Restrict CORS
- Enable all guardrails
- Audit all agent prompts
- Implement input validation
- Add comprehensive logging
- Set up monitoring and alerting

## Next Steps

Once setup is complete:

1. Read [LAB_OBJECTIVES.md](./LAB_OBJECTIVES.md) for learning goals
2. Start with [labs/LAB01_price_manipulation.md](./labs/LAB01_price_manipulation.md)
3. Explore the admin dashboard at http://localhost:3000/admin
4. Monitor agent behavior at http://localhost:8501

## Getting Help

- Check [FAQ.md](./FAQ.md) for common questions
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging
- Examine logs in `backend/logs/` and `frontend/.next/`

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes database)
docker-compose down -v

# Remove all containers and images
make clean
```
