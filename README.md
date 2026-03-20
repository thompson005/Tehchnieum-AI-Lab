# TECHNIEUM AI Security Research Labs

> **For authorized security training only. Contains intentional AI vulnerabilities.**

A unified platform for learning AI/LLM security through hands-on exploitation of five production-grade vulnerable applications. Built for cybersecurity conferences and workshops.

---

## Platform Overview

| Component | URL | Description |
|-----------|-----|-------------|
| **Portal** | `http://localhost:5555` | Login, lab dashboard, scoreboard, flag submission |
| **LAB-1: MedAssist AI** | `http://localhost:5000` | Multi-agent healthcare system (15 flags) |
| **LAB-2: SecureBank AI** | `http://localhost:3000` | Banking AI platform (4 flags) |
| **LAB-3: ShopSec AI** | `http://localhost:8080` | E-commerce agentic platform (12 flags) |
| **LAB-4: TravelNest AI** | `http://localhost:3100` | Travel booking microservices (10 flags) |
| **LAB-5: GovConnect AI** | `http://localhost:3200` | Smart city MCP platform (14 flags) |

---

## Quick Start

For EC2 auto-deploy from GitHub Actions, see `DEPLOYMENT_EC2.md`.

### Prerequisites
- Docker Desktop (with BuildKit enabled — default on Docker Desktop ≥ 4.x)
- An OpenAI API key with `gpt-4o-mini` access

### 1. Configure

```bash
cd Labs/
# Edit .env and set your OPENAI_API_KEY
```

The `.env` file already exists. Only `OPENAI_API_KEY` needs to be set — all other values have sensible defaults.

### 2. Launch Everything

```bash
cd Labs/
docker compose up --build -d
```

This single command starts **Portal + all 5 labs** on the shared `technieum` network.

### 3. Access

1. Open **http://localhost:5555** — register an account at the Technieum portal
2. From the dashboard, click any lab card to launch it
3. Capture flags, submit them at the portal, climb the scoreboard

---

## Port Reference

| Service | Host Port(s) |
|---------|-------------|
| Portal | 5555 |
| LAB-1 (MedAssist) | 5000 |
| LAB-2 Frontend | 3000 |
| LAB-2 API | 8000 |
| LAB-3 Gateway | 8080 |
| LAB-3 Agent | 8083 |
| LAB-3 Frontend (lite) | 3001 |
| LAB-4 Frontend | 3100 |
| LAB-4 Gateway | 8090 |
| LAB-4 AI Agent | 9000 |
| LAB-5 Frontend | 3200 |
| LAB-5 API | 8100 |
| LAB-5 MCP Servers | 8110–8118 |

---

## Environment Variables

The `.env` file in this directory controls the platform. Required:

```env
OPENAI_API_KEY=sk-...        # Required — used by all AI labs
```

Optional overrides (defaults shown):

```env
LAB4_DB_PASSWORD=travelnest123
LAB4_SECRET_KEY=travelnest_secret_key_2024
```

All other secrets (LAB-2, LAB-3, LAB-5 DB passwords) are hardcoded to their development defaults in `docker-compose.yml`.

---

## Build Times

First-time build downloads large ML packages (PyTorch ~670 MB, NVIDIA CUDA libs). Expect:

| Build | First run | Subsequent runs |
|-------|-----------|-----------------|
| LAB-1 | ~10–15 min | ~30 s (cache) |
| LAB-2 | ~3–5 min | ~20 s (cache) |
| LAB-3 | ~15–20 min | ~30 s (cache) |
| LAB-4 | ~2–3 min | ~15 s (cache) |
| LAB-5 | ~5–8 min | ~20 s (cache) |

**Tip — parallel builds use all CPU cores.** BuildKit cache mounts are enabled in all Dockerfiles so pip/npm packages are cached across rebuilds (no re-download after the first build).

---

## Flags

All flags follow the format `TECHNIEUM{...}`. Submit them at `http://localhost:5555`.

| Lab | Total Flags | Max Score |
|-----|-------------|-----------|
| LAB-1 MedAssist | 15 flags | 7,500 pts |
| LAB-2 SecureBank | 4 flags | 1,850 pts |
| LAB-3 ShopSec | 12 flags | 7,000 pts |
| LAB-4 TravelNest | 10 flags | 3,550 pts |
| LAB-5 GovConnect | 14 flags | 6,500 pts |
| **Total** | **55 flags** | **26,400 pts** |

---

## Difficulty Guide

| Tier | Points | Description |
|------|--------|-------------|
| 🟢 EASY | 100 pts | First challenges — basic prompt injection |
| 🟡 MEDIUM | 250 pts | Mid-tier — output handling, RAG attacks |
| 🟠 HARD | 500 pts | Advanced — chaining vulnerabilities |
| 🔴 EXPERT | 950–1000 pts | Multi-step compromise chains |

---

## OWASP LLM Top 10 Coverage

| OWASP ID | Vulnerability | Labs |
|----------|--------------|------|
| LLM01 | Prompt Injection | LAB-1, LAB-2, LAB-3, LAB-4, LAB-5 |
| LLM02 | Insecure Output Handling | LAB-1, LAB-2, LAB-5 |
| LLM03 | Training Data Poisoning / RAG Poisoning | All labs |
| LLM04 | Model Denial of Service | LAB-1 |
| LLM06 | Sensitive Information Disclosure | All labs |
| LLM07 | Insecure Plugin / MCP Design | LAB-1, LAB-5 |
| LLM08 | Excessive Agency | All labs |

---

## Running Labs Individually

Each lab has its own `docker-compose.yml` for standalone use:

```bash
# LAB-5 standalone example
cd LAB-5/
cp .env.example .env   # set OPENAI_API_KEY
docker compose up --build
```

---

## Security Warning

- **Never expose these labs to the public internet** — they contain intentional RCE, SQLi, path traversal, and data exposure vulnerabilities
- **Rotate your OpenAI API key** after each session
- **Do not use real credentials or data** in these environments
- All content (citizens, bank accounts, flight data) is fictional test data

---

*Built by Technieum AI Security Research Labs · `gpt-4o-mini` powered*
