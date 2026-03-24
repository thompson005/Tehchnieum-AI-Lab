# CLAUDE.md

This document helps Claude quickly understand and safely work in the TECHNIEUM AI Security Labs repository.

## Project Purpose

TECHNIEUM is a multi-lab AI security training platform with intentionally vulnerable applications.
Use this repo for authorized security training only.

The workspace contains:
- Root orchestrator and shared deployment files.
- 5 labs (LAB-1 to LAB-5), each with distinct architecture and attack scenarios.
- A portal app for login, navigation, and scoreboard.

## High-Level Architecture

Primary entrypoints:
- Portal UI: localhost:5555
- LAB-1 MedAssist: localhost:5000
- LAB-2 SecureBank UI/API: localhost:3000 and localhost:8000
- LAB-3 ShopSec gateway/agent/UI: localhost:8080, localhost:8083, localhost:3001
- LAB-4 TravelNest UI/gateway/agent: localhost:3100, localhost:8090, localhost:9000
- LAB-5 GovConnect UI/API/MCP: localhost:3200, localhost:8100, localhost:8110-8118

Shared stack patterns:
- Python backends (FastAPI and Flask depending on lab).
- React or static frontends.
- PostgreSQL and Redis in most labs.
- LLM integrations via OpenAI (and some lab-specific variants).
- Docker Compose for full-platform and per-lab startup.

## Where To Start (Navigation)

Read in this order:
1. Root README.md for full platform run instructions.
2. Target lab README.md + QUICK_START.md + SETUP_GUIDE.md.
3. LAB_OBJECTIVES.md to understand intended vulnerabilities and challenge goals.
4. docker-compose.yml files to see real service dependencies and ports.

Fast orientation files:
- README.md
- docker-compose.yml
- LAB-1/README.md
- LAB-2/README.md
- LAB-3/README.md
- LAB-4/README.md
- LAB-5/README.md
- portal/app.py

## Lab-by-Lab Code Landmarks

LAB-1 (MedAssist):
- Core app: LAB-1/app.py
- Agent implementations: LAB-1/agents/
- RAG and challenge docs: LAB-1/labs/

LAB-2 (SecureBank):
- Backend API: LAB-2/backend/app/
- Frontend: LAB-2/frontend/src/
- Startup helper: LAB-2/start.sh

LAB-3 (ShopSec):
- Gateway API: LAB-3/backend/
- Agent service: LAB-3/backend/services/agent_core/
- Order service: LAB-3/backend/services/order_service/
- DB models/seed: LAB-3/backend/database/
- Frontend: LAB-3/frontend/ and LAB-3/lite_frontend/

LAB-4 (TravelNest):
- Microservices: LAB-4/backend/
- Gateway: LAB-4/backend/gateway/
- Frontend: LAB-4/frontend/

LAB-5 (GovConnect):
- Backend API: LAB-5/backend/
- MCP services: LAB-5/mcp_servers/
- Frontend: LAB-5/frontend/
- MCP reference: LAB-5/MCP_PROTOCOL_GUIDE.md

## Working Rules For Claude

1. Preserve intentional vulnerabilities unless the user explicitly asks to harden/remove them.
2. Prefer minimal, targeted edits over broad rewrites.
3. Keep per-lab behavior and APIs stable unless a migration is requested.
4. Avoid changing unrelated files when fixing one lab.
5. Always verify with available health checks, startup scripts, or tests after edits.

## Common Failure Patterns

1. Missing OPENAI_API_KEY in root .env or lab-specific .env.
2. Database dependency race (service starts before DB is healthy).
3. Inconsistent local environment vs Docker assumptions.
4. Frontend actions that appear wired but fail due to backend contract drift.
5. Heavy Docker images causing long build/startup cycles.

## Recommended Debug Workflow

1. Confirm env values first (.env, compose env blocks).
2. Start only the target lab services instead of entire platform when debugging.
3. Check container health status and logs before code edits.
4. Verify one core user flow end-to-end.
5. Verify one vulnerability flow from the corresponding labs/ challenge docs.

## Docker Notes

- Root docker-compose.yml runs full platform.
- Each LAB-x/docker-compose.yml supports standalone execution.
- Prefer lightweight runtime images for static frontends.
- Keep health checks cheap and deterministic.
- Add or maintain .dockerignore files to reduce build context.

## If Asked To "Fix Everything"

Prioritize in this order:
1. Startup blockers (env, DB init, health checks).
2. Broken API flows and dead UI controls.
3. Docker image/runtime optimization.
4. UI modularization and code cleanup.
5. Documentation updates to reflect actual behavior.

## Scope Safety Reminder

These labs intentionally include insecure patterns for training. If a request is ambiguous,
ask whether the goal is:
- Keep vulnerable behavior (lab fidelity), or
- Harden behavior (production security).

Default to preserving lab fidelity.
