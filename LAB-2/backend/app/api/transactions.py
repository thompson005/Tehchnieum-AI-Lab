from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Dict
from app.core.database import get_db
from app.api.auth import get_current_user_id
from app.agents.transfer_agent import transfer_agent
from app.agents.transaction_agent import transaction_analyzer

router = APIRouter()

class TransferRequest(BaseModel):
    message: str  # Natural language transfer request

class AnalyzeRequest(BaseModel):
    limit: int = 5

@router.get("/")
async def get_transactions(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's recent transactions"""
    
    query = text("""
        SELECT 
            t.id,
            t.amount,
            t.transaction_type,
            t.description,
            t.note,
            t.status,
            t.created_at,
            fa.account_number as from_account,
            ta.account_number as to_account
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        WHERE fa.user_id = :user_id OR ta.user_id = :user_id
        ORDER BY t.created_at DESC
        LIMIT :limit
    """)
    
    result = await db.execute(query, {"user_id": user_id, "limit": limit})
    transactions = result.fetchall()
    
    return {
        "transactions": [
            {
                "id": str(tx.id),
                "amount": float(tx.amount),
                "type": tx.transaction_type,
                "description": tx.description,
                "note": tx.note,
                "status": tx.status,
                "created_at": tx.created_at.isoformat(),
                "from_account": tx.from_account,
                "to_account": tx.to_account
            }
            for tx in transactions
        ]
    }

@router.post("/transfer")
async def smart_transfer(
    transfer_req: TransferRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Natural language money transfer
    VULNERABLE: Excessive agency, no confirmation
    """
    
    # Get user's primary checking account
    query = text("""
        SELECT account_number
        FROM accounts
        WHERE user_id = :user_id AND account_type = 'checking'
        LIMIT 1
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    account = result.fetchone()
    
    if not account:
        raise HTTPException(status_code=404, detail="No checking account found")
    
    # Process transfer with AI agent
    result = await transfer_agent.process_transfer_request(
        transfer_req.message,
        account.account_number
    )
    
    return result

@router.post("/analyze")
async def analyze_transactions(
    analyze_req: AnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    AI-powered transaction analysis
    VULNERABLE: XSS via unsanitized AI output
    """
    
    # Get recent transactions
    query = text("""
        SELECT 
            t.amount,
            t.description,
            t.note,
            t.created_at
        FROM transactions t
        JOIN accounts a ON t.from_account_id = a.id
        WHERE a.user_id = :user_id
        ORDER BY t.created_at DESC
        LIMIT :limit
    """)
    
    result = await db.execute(query, {"user_id": user_id, "limit": analyze_req.limit})
    transactions = result.fetchall()
    
    if not transactions:
        return {"analysis": "<p>No transactions to analyze.</p>"}
    
    # Format for AI
    tx_list = [
        {
            "amount": float(tx.amount),
            "description": tx.description,
            "note": tx.note,
            "created_at": tx.created_at.strftime("%Y-%m-%d")
        }
        for tx in transactions
    ]
    
    # Get AI analysis (VULNERABLE: returns unsanitized HTML)
    analysis = await transaction_analyzer.analyze_transactions(tx_list)
    
    return {"analysis": analysis}
