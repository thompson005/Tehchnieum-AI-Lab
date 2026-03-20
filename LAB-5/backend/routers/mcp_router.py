from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Any, Dict, Optional
import httpx

from database import get_db
from models import McpAuditLog
from auth import get_current_user
from models import AppUser
from config import settings

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

MCP_SERVERS = {
    "citizen": settings.MCP_CITIZEN_URL,
    "dmv": settings.MCP_DMV_URL,
    "tax": settings.MCP_TAX_URL,
    "permit": settings.MCP_PERMIT_URL,
    "health": settings.MCP_HEALTH_URL,
    "docs": settings.MCP_DOCS_URL,
    "notify": settings.MCP_NOTIFY_URL,
    "files": settings.MCP_FILES_URL,
    "civic": settings.MCP_CIVIC_URL,
}


class InvokeRequest(BaseModel):
    server: str
    tool: str
    args: Optional[Dict[str, Any]] = {}


@router.get("/servers")
async def list_servers():
    """Return all registered MCP server names and URLs."""
    return {
        "servers": [
            {"name": name, "url": url} for name, url in MCP_SERVERS.items()
        ]
    }


@router.get("/tools")
async def list_all_tools(current_user: AppUser = Depends(get_current_user)):
    """Fetch and return all tools from all MCP servers."""
    all_tools: Dict[str, Any] = {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        for server_name, server_url in MCP_SERVERS.items():
            try:
                resp = await client.post(
                    f"{server_url}/mcp",
                    json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}},
                )
                data = resp.json()
                tools = data.get("result", {}).get("tools", [])
                all_tools[server_name] = tools
            except Exception as exc:
                all_tools[server_name] = {"error": str(exc)}
    return {"tools": all_tools}


@router.post("/invoke")
async def invoke_tool(
    request: InvokeRequest,
    db: AsyncSession = Depends(get_db),
    # VULNERABILITY: No auth dependency — any caller can invoke any MCP tool directly
):
    """
    INTENTIONALLY VULNERABLE: Directly invokes any MCP tool with no authorization check.
    This endpoint is exposed for LAB-5 training purposes to demonstrate
    broken function-level authorisation and direct MCP tool invocation.
    """
    server_url = MCP_SERVERS.get(request.server)
    if not server_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown MCP server: {request.server}",
        )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{server_url}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "tools/call",
                    "params": {
                        "name": request.tool,
                        "arguments": request.args or {},
                    },
                },
            )
        result = resp.json()
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MCP server unreachable: {exc}",
        )

    # Log the invocation (verbatim — another vulnerability for training)
    log_entry = McpAuditLog(
        session_id=None,
        user_id=None,
        mcp_server=request.server,
        tool_name=request.tool,
        tool_args=request.args,
        tool_result=result.get("result"),
    )
    db.add(log_entry)
    await db.commit()

    return {"server": request.server, "tool": request.tool, "result": result.get("result")}


@router.get("/audit-log")
async def get_audit_log(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return last 100 MCP tool call audit log entries."""
    result = await db.execute(
        select(McpAuditLog).order_by(desc(McpAuditLog.called_at)).limit(100)
    )
    logs = result.scalars().all()
    return {
        "audit_log": [
            {
                "id": log.id,
                "session_id": log.session_id,
                "user_id": log.user_id,
                "mcp_server": log.mcp_server,
                "tool_name": log.tool_name,
                "tool_args": log.tool_args,
                "tool_result": log.tool_result,
                "called_at": log.called_at.isoformat() if log.called_at else None,
            }
            for log in logs
        ]
    }
