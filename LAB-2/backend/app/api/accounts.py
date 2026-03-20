from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db
from app.api.auth import get_current_user_id

router = APIRouter()

@router.get("/")
async def get_accounts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's accounts"""
    
    query = text("""
        SELECT 
            id,
            account_number,
            account_type,
            balance,
            currency,
            status,
            created_at
        FROM accounts
        WHERE user_id = :user_id AND status = 'active'
        ORDER BY account_type
    """)
    
    result = await db.execute(query, {"user_id": user_id})
    accounts = result.fetchall()
    
    return {
        "accounts": [
            {
                "id": str(acc.id),
                "account_number": acc.account_number,
                "type": acc.account_type,
                "balance": float(acc.balance),
                "currency": acc.currency,
                "status": acc.status,
                "created_at": acc.created_at.isoformat()
            }
            for acc in accounts
        ]
    }

@router.get("/{account_number}/balance")
async def get_balance(
    account_number: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get account balance"""
    
    query = text("""
        SELECT balance, account_type
        FROM accounts
        WHERE account_number = :account_number AND user_id = :user_id
    """)
    
    result = await db.execute(query, {
        "account_number": account_number,
        "user_id": user_id
    })
    account = result.fetchone()
    
    if not account:
        return {"error": "Account not found"}
    
    return {
        "account_number": account_number,
        "balance": float(account.balance),
        "type": account.account_type
    }
