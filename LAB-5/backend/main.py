import uuid
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from config import settings
from database import init_db, AsyncSessionFactory
from models import AppUser, Flag
from auth import hash_password
from ai.mcp_client import MCPClient
from ai.orchestrator import AIOrchestrator
from routers import auth_router, chat_router, mcp_router, admin_router, flag_router
from routers.chat_router import set_orchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("govconnect")

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

SEED_USERS = [
    # (username, password, role, citizen_id)
    ("alice",           "password123",      "citizen",      "NM-000042"),
    ("bob",             "password123",      "citizen",      "NM-000099"),
    ("clerk_johnson",   "clerk2024!",       "clerk",        "NM-000010"),
    ("supervisor_chen", "super2024!",       "supervisor",   "NM-000005"),
    ("sysadmin",        "GovConnect@2024",  "system_admin", None),
]

FLAGS = [
    ("LAB5-01",  "TECHNIEUM{mcp_t00l5_3num3r4t3d}",       100,  "MCP Tool Reconnaissance"),
    ("LAB5-02",  "TECHNIEUM{5y5t3m_pr0mpt_l34k3d}",        100,  "System Prompt via MCP Resource"),
    ("LAB5-03",  "TECHNIEUM{r35p0n53_1nj3ct10n}",          100,  "MCP Response Injection"),
    ("LAB5-04",  "TECHNIEUM{t00l_d35c_p01s0n3d}",          250,  "Tool Description Poisoning"),
    ("LAB5-05",  "TECHNIEUM{5h4d0w_t00l_f0und}",           250,  "Shadow Tool Discovery"),
    ("LAB5-06",  "TECHNIEUM{3xc3551v3_4g3ncy_g0v}",        250,  "Excessive Agency"),
    ("LAB5-07",  "TECHNIEUM{c0nfu53d_d3puty_g0v}",         500,  "Confused Deputy"),
    ("LAB5-08",  "TECHNIEUM{1nt3rn4l_d0c5_mcp_br34ch}",    500,  "Internal Docs Breach"),
    ("LAB5-09",  "TECHNIEUM{r4g_p01s0n_mcp_1ng35t}",       500,  "RAG Poisoning via MCP"),
    ("LAB5-10",  "TECHNIEUM{f1l35y5t3m_mcp_tr4v3r54l}",    500,  "Filesystem Path Traversal"),
    ("LAB5-11",  "TECHNIEUM{p3r515t3nt_b4ckd00r_mcp}",     500,  "Persistent Backdoor"),
    ("LAB5-12",  "TECHNIEUM{mcp_rug_pull_3xpl01t3d}",      1000, "MCP Tool Poisoning Rug Pull"),
    ("LAB5-13",  "TECHNIEUM{full_c1t1z3n_db_3xf1l}",       1000, "Full Database Exfiltration"),
    ("LAB5-14",  "TECHNIEUM{g0vc0nn3ct_g0d_m0d3}",         950,  "GovConnect God Mode"),
]


async def seed_users(session):
    for username, password, role, citizen_id in SEED_USERS:
        result = await session.execute(
            select(AppUser).where(AppUser.username == username)
        )
        if result.scalar_one_or_none() is None:
            user = AppUser(
                id=str(uuid.uuid4()),
                username=username,
                password_hash=hash_password(password),
                role=role,
                citizen_id=citizen_id,
                is_active=True,
            )
            session.add(user)
            logger.info("Seeded user: %s (%s)", username, role)
    await session.commit()


async def seed_flags(session):
    for flag_id, flag_value, points, name in FLAGS:
        result = await session.execute(
            select(Flag).where(Flag.flag_id == flag_id)
        )
        if result.scalar_one_or_none() is None:
            flag = Flag(
                id=str(uuid.uuid4()),
                flag_id=flag_id,
                flag_value=flag_value,
                points=points,
                name=name,
                is_active=True,
            )
            session.add(flag)
            logger.info("Seeded flag: %s — %s (%d pts)", flag_id, name, points)
    await session.commit()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GovConnect AI starting up...")

    # Initialise database schema
    await init_db()
    logger.info("Database schema initialised.")

    # Seed reference data
    async with AsyncSessionFactory() as session:
        await seed_users(session)
        await seed_flags(session)

    # Build MCP client and orchestrator
    mcp_servers = {
        "citizen": settings.MCP_CITIZEN_URL,
        "dmv":     settings.MCP_DMV_URL,
        "tax":     settings.MCP_TAX_URL,
        "permit":  settings.MCP_PERMIT_URL,
        "health":  settings.MCP_HEALTH_URL,
        "docs":    settings.MCP_DOCS_URL,
        "notify":  settings.MCP_NOTIFY_URL,
        "files":   settings.MCP_FILES_URL,
        "civic":   settings.MCP_CIVIC_URL,
    }
    mcp_client = MCPClient(servers=mcp_servers)
    orchestrator = AIOrchestrator(mcp_client=mcp_client)
    set_orchestrator(orchestrator)
    logger.info("AI orchestrator ready.")

    yield

    logger.info("GovConnect AI shutting down.")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="GovConnect AI API",
    description=(
        "GovConnect AI — Neo Meridian Smart City Services backend. "
        "Intentionally vulnerable application for AI security training (LAB-5)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# INTENTIONALLY INSECURE: allow all origins for lab accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router.router)
app.include_router(chat_router.router)
app.include_router(mcp_router.router)
app.include_router(admin_router.router)
app.include_router(flag_router.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "GovConnect AI API",
        "version": "1.0.0",
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8100,
        reload=False,
        log_level="info",
    )
