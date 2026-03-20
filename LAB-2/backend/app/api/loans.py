from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.api.auth import get_current_user_id
from app.agents.loan_agent import loan_agent

router = APIRouter()

@router.post("/apply")
async def apply_for_loan(
    amount: float = Form(...),
    purpose: str = Form(...),
    bank_statement: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """
    Apply for a loan with bank statement
    VULNERABLE: Hidden text in PDF, hallucination
    """
    
    # Read PDF file
    pdf_bytes = await bank_statement.read()
    
    # Process with AI agent
    result = await loan_agent.process_loan_application(
        user_id=user_id,
        amount=amount,
        purpose=purpose,
        bank_statement_pdf=pdf_bytes
    )
    
    return result
