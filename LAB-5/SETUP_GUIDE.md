# GovConnect AI — Setup Guide

## Prerequisites

| Requirement        | Minimum Version | Notes                                     |
|--------------------|-----------------|-------------------------------------------|
| Docker Desktop     | 24.0+           | Docker Engine + Compose bundled           |
| Docker Compose     | 2.x             | Bundled with Docker Desktop               |
| RAM                | 8 GB free       | 12 GB+ recommended for comfortable use   |
| Disk Space         | 5 GB            | For images, volumes, and build cache      |
| OpenAI API Key     | GPT-4 access    | GPT-4o or GPT-4-turbo required           |
| Ports              | See table below | Must not be in use by other services      |

### Required Ports

```
3200  — Frontend
8100  — Backend API
8110–8118 — MCP Servers
5433  — PostgreSQL (mapped from 5432)
6380  — Redis (mapped from 6379)
```

---

## Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` in a text editor and configure:

```env
# REQUIRED: Your OpenAI API key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# These can remain as-is for local Docker deployment
DATABASE_URL=postgresql://govconnect:govconnect2024@localhost:5432/govconnect
JWT_SECRET=govconnect_secret_key_2024
REDIS_URL=redis://localhost:6379
```

> **Security Note:** The `JWT_SECRET` and database credentials are intentionally weak for this training lab. Never use these values in production.

---

## Docker Deployment (Recommended)

### Full Build and Launch

```bash
cd LAB-5/
docker-compose up --build
```

This command:
1. Builds the frontend (Next.js)
2. Builds the backend (FastAPI)
3. Builds all 9 MCP server images
4. Starts PostgreSQL and runs `database/init.sql`
5. Starts Redis
6. Brings all services online

### Verify All Services

```bash
# Check all containers are running
docker-compose ps

# View combined logs
docker-compose logs -f

# Check a specific service
docker-compose logs -f govconnect-backend
```

### Expected startup output (backend):
```
govconnect-backend  | INFO:     Starting GovConnect AI Backend
govconnect-backend  | INFO:     Connected to PostgreSQL
govconnect-backend  | INFO:     Connected to Redis
govconnect-backend  | INFO:     Loaded MCP server: citizen-records-mcp (9 tools)
govconnect-backend  | INFO:     Loaded MCP server: dmv-mcp (6 tools)
...
govconnect-backend  | INFO:     Application startup complete.
```

---

## Manual Setup (Without Docker)

If you need to run services without Docker:

### 1. PostgreSQL

Install PostgreSQL 15 and create the database:

```bash
createdb govconnect
createuser govconnect --password govconnect2024
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE govconnect TO govconnect;"
psql -U govconnect -d govconnect -f database/init.sql
```

### 2. Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis
```

### 3. Backend

```bash
cd backend/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8100 --reload
```

### 4. MCP Servers

Launch each in its own terminal:

```bash
# Terminal 1
cd mcp_servers/citizen_records_mcp/
pip install -r requirements.txt
uvicorn server:app --port 8110

# Terminal 2
cd mcp_servers/dmv_mcp/
uvicorn server:app --port 8111

# Repeat for ports 8112–8118
```

### 5. Frontend

```bash
cd frontend/
npm install
NEXT_PUBLIC_API_URL=http://localhost:8100 npm run dev
# Access at http://localhost:3200
```

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Issue: "Port is already in use"
**Solution:** Find and kill the process using the port, or edit port mappings in `docker-compose.yml`.

```bash
# Find process on port 3200 (macOS/Linux)
lsof -i :3200

# Windows
netstat -ano | findstr :3200
```

### Issue: "OpenAI API error: 401 Unauthorized"
**Solution:** Check your `OPENAI_API_KEY` in `.env`. Ensure it has GPT-4 access.

### Issue: "AI responses are generic and don't use MCP tools"
**Solution:** Ensure all MCP containers are healthy. Check:
```bash
curl http://localhost:8110/health
curl http://localhost:8111/health
```

### Issue: "Database relation does not exist"
**Solution:** The init.sql may not have run. Reset:
```bash
docker-compose down -v
docker-compose up --build
```

### Issue: Frontend shows "API connection error"
**Solution:** Verify `NEXT_PUBLIC_API_URL` is set correctly. In Docker, this should be `http://localhost:8100`.

### Issue: Login returns "Invalid credentials"
**Solution:** The password hashes in the seed data use bcrypt. Ensure the backend is running and connected to the database. Try waiting 10 seconds and retrying.

---

## Resetting the Lab

To completely reset all data and start fresh:

```bash
# Stop containers and remove all volumes (database data)
docker-compose down -v

# Rebuild and restart
docker-compose up --build
```

This will re-run `init.sql` and restore all seed data including the injection payloads.

---

## Updating Lab Data

To modify seed data without a full rebuild:

```bash
# Access PostgreSQL directly
docker exec -it govconnect-postgres psql -U govconnect -d govconnect

# Example: view flags
SELECT flag_id, flag_value, points, name FROM flags;

# Example: view injection payloads
SELECT citizen_id, violation_notes FROM traffic_violations WHERE citizen_id = 'CIT-00003';
```
