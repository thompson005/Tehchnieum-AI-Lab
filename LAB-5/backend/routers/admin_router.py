from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Dict, Any, Optional

from database import get_db
from models import AppUser, ChatSession, FlagSubmission, McpAuditLog
from auth import require_role, get_current_user
from config import settings

router = APIRouter(prefix="/api/admin", tags=["admin"])


class McpConfigUpdate(BaseModel):
    server_name: str
    new_url: str


@router.get("/stats")
async def get_stats(
    current_user: AppUser = Depends(require_role("supervisor", "system_admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return platform-wide statistics."""
    total_users_result = await db.execute(select(func.count()).select_from(AppUser))
    total_users = total_users_result.scalar()

    total_sessions_result = await db.execute(select(func.count()).select_from(ChatSession))
    total_sessions = total_sessions_result.scalar()

    total_flags_result = await db.execute(select(func.count()).select_from(FlagSubmission))
    total_flags_captured = total_flags_result.scalar()

    total_mcp_calls_result = await db.execute(select(func.count()).select_from(McpAuditLog))
    total_mcp_calls = total_mcp_calls_result.scalar()

    points_result = await db.execute(select(func.sum(FlagSubmission.points_awarded)))
    total_points = points_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_chat_sessions": total_sessions,
        "total_flags_captured": total_flags_captured,
        "total_mcp_calls": total_mcp_calls,
        "total_points_awarded": total_points,
    }


@router.get("/all-sessions")
async def get_all_sessions(
    current_user: AppUser = Depends(require_role("system_admin")),
    db: AsyncSession = Depends(get_db),
):
    """List all active chat sessions. Admin only."""
    result = await db.execute(
        select(ChatSession).order_by(ChatSession.updated_at.desc())
    )
    sessions = result.scalars().all()
    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "user_id": s.user_id,
                "message_count": len(s.messages) if s.messages else 0,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in sessions
        ]
    }


@router.post("/mcp/config")
async def update_mcp_config(
    update: McpConfigUpdate,
    # VULNERABILITY: No auth check — intentionally exposed for lab training.
    # Demonstrates that MCP server URL reconfiguration without authentication
    # can allow an attacker to redirect MCP traffic to a malicious server.
    db: AsyncSession = Depends(get_db),
):
    """
    INTENTIONALLY VULNERABLE: Update MCP server URL configuration without
    authentication or restart. This is intentionally insecure for training
    purposes to demonstrate dynamic MCP server URL reconfiguration attacks.
    """
    valid_servers = [
        "citizen", "dmv", "tax", "permit", "health",
        "docs", "notify", "files", "civic",
    ]
    if update.server_name not in valid_servers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown server name: {update.server_name}",
        )

    # Dynamically update the module-level MCP_SERVERS dict in mcp_router
    from routers.mcp_router import MCP_SERVERS
    old_url = MCP_SERVERS.get(update.server_name, "unknown")
    MCP_SERVERS[update.server_name] = update.new_url

    return {
        "message": f"MCP server '{update.server_name}' URL updated",
        "old_url": old_url,
        "new_url": update.new_url,
        "warning": "Configuration updated in-memory. Restart not required.",
    }
