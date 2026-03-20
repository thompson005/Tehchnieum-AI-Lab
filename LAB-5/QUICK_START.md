# GovConnect AI — Quick Start Card

## Prerequisites

- Docker Desktop (v24+)
- Docker Compose (v2.x, bundled with Docker Desktop)
- OpenAI API Key (GPT-4 access required)
- 8 GB RAM available for containers
- Ports 3200, 8100–8118, 5433, 6380 must be free

---

## 3-Step Setup

### Step 1 — Configure

```bash
cd LAB-5/
cp .env.example .env
```

Open `.env` and replace `your_openai_api_key_here` with your actual OpenAI API key.

### Step 2 — Build and Launch

```bash
docker-compose up --build
```

First build takes 3–5 minutes. Subsequent launches take ~30 seconds.

### Step 3 — Access

Open your browser to: **http://localhost:3200**

Log in with: `citizen1` / `citizen123`

---

## Service Ports

| URL                         | Service              |
|-----------------------------|----------------------|
| http://localhost:3200       | Web Portal (Login)   |
| http://localhost:3200/chat  | AI Chat Interface    |
| http://localhost:3200/mcp-debug | MCP Debug Console|
| http://localhost:8100/docs  | Backend API (Swagger)|
| http://localhost:8100/health| Health Check         |

---

## First Challenge Hint

Start with **LAB-01: MCP Tool Reconnaissance**.

Log in as `citizen1` and navigate to the AI Chat. Ask the AI assistant:

> "What tools do you have available?"

Or visit the **MCP Debug Console** at `/mcp-debug` and click "List Tools" for the citizen-records-mcp server.

The flag for LAB-01 is revealed when you successfully enumerate all available tools.

---

## Useful Commands

```bash
# Stop all services
docker-compose down

# Reset all data (wipes database)
docker-compose down -v && docker-compose up --build

# View logs for a specific service
docker-compose logs -f govconnect-backend

# Access PostgreSQL directly
docker exec -it govconnect-postgres psql -U govconnect -d govconnect

# View all flags in database
docker exec -it govconnect-postgres psql -U govconnect -d govconnect -c "SELECT * FROM flags;"
```

---

## Lab Guides

All 14 challenge guides are in the `labs/` directory:

- `labs/LAB01_mcp_tool_reconnaissance.md`
- `labs/LAB02_system_prompt_resource.md`
- ... through ...
- `labs/LAB14_govconnect_god_mode.md`

Solutions are in `solutions/LAB01_solution.md` through `solutions/LAB14_solution.md`.

---

## Troubleshooting

**Services won't start:** Ensure Docker Desktop is running and you have sufficient RAM.

**AI not responding:** Check your `OPENAI_API_KEY` in `.env`.

**Database connection errors:** Wait 30 seconds for PostgreSQL to fully initialize.

**Port conflicts:** Change port mappings in `docker-compose.yml` if needed.
