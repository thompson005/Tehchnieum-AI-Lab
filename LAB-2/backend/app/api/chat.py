from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.auth import get_current_user_id
from app.agents.support_bot import support_bot
from app.core.redis_client import redis_client
import json
import uuid

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    session_id: str = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

@router.post("/support", response_model=ChatResponse)
async def chat_with_support(
    chat_msg: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat with Eva, the AI support bot
    VULNERABLE: Prompt injection, RAG poisoning
    """
    
    # Generate or use existing session ID
    session_id = chat_msg.session_id or str(uuid.uuid4())
    
    # Store message in Redis (chat history)
    history_key = f"chat_history:{user_id}:{session_id}"
    
    # Get existing history
    history_json = await redis_client.get(history_key)
    history = json.loads(history_json) if history_json else []
    
    # Add user message
    history.append({"role": "user", "content": chat_msg.message})
    
    # Get AI response (pass full history so Eva has conversation context)
    ai_response = await support_bot.chat(chat_msg.message, user_id, history[:-1])
    
    # Add AI response to history
    history.append({"role": "assistant", "content": ai_response})
    
    # Save updated history (expire after 1 hour)
    await redis_client.set(history_key, json.dumps(history), ex=3600)
    
    return {
        "response": ai_response,
        "session_id": session_id
    }

@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get chat history for a session"""
    
    history_key = f"chat_history:{user_id}:{session_id}"
    history_json = await redis_client.get(history_key)
    
    if not history_json:
        return {"history": []}
    
    return {"history": json.loads(history_json)}
