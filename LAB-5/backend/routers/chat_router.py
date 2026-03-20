from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional, List, Any
import uuid

from database import get_db
from models import AppUser, ChatSession
from auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Lazy import to avoid circular deps — orchestrator is injected at startup
_orchestrator = None


def set_orchestrator(orchestrator):
    global _orchestrator
    _orchestrator = orchestrator


def get_orchestrator():
    if _orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI orchestrator not initialised",
        )
    return _orchestrator


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    tools_called: List[Any] = []


class MessageItem(BaseModel):
    role: str
    content: str


class HistoryResponse(BaseModel):
    session_id: str
    messages: List[MessageItem]


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    orchestrator = get_orchestrator()
    session_id = request.session_id or str(uuid.uuid4())

    result = await orchestrator.process_message(
        message=request.message,
        user=current_user,
        session_id=session_id,
        db=db,
    )

    return ChatResponse(
        response=result["response"],
        session_id=result["session_id"],
        tools_called=result.get("tools_called", []),
    )


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(
    session_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # VULNERABILITY: No ownership check — any authenticated user can view any session's history
    messages = [
        MessageItem(role=m.get("role", "user"), content=m.get("content", ""))
        for m in (session.messages or [])
        if isinstance(m, dict)
    ]

    return HistoryResponse(session_id=session_id, messages=messages)


@router.delete("/history/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history(
    session_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    await db.execute(
        delete(ChatSession).where(ChatSession.session_id == session_id)
    )
    await db.commit()

    # Also clear in-memory orchestrator history
    orchestrator = get_orchestrator()
    orchestrator.conversation_history.pop(session_id, None)
