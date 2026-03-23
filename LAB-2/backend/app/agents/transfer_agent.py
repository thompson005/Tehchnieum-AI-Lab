"""
Smart Transfer Agent (VULNERABLE)
Scenario C: Excessive Agency + SQL Injection via LLM
"""
from openai import OpenAI
import json
from typing import Dict
from app.core.config import settings
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

class TransferAgent:
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def process_transfer_request(self, user_message: str, user_account: str) -> Dict:
        """
        VULNERABLE: LLM generates SQL parameters without validation
        VULNERABLE: Excessive agency - no confirmation step
        """
        
        system_prompt = """You are a banking transfer assistant. Extract transfer details from user requests.
Return ONLY a JSON object with these fields:
{
  "to_account": "account number",
  "amount": numeric amount,
  "description": "transfer description"
}

Examples:
- "Send $50 to account 1001234568" -> {"to_account": "1001234568", "amount": 50, "description": "Transfer"}
- "Transfer $100 to my brother's account 2001234567 for dinner" -> {"to_account": "2001234567", "amount": 100, "description": "Dinner"}

Return ONLY the JSON, no other text."""
        
        full_prompt = f"{system_prompt}\n\nUser request: {user_message}\n\nJSON:"
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.1,
                max_tokens=256
            )
            
            # Parse LLM response
            llm_output = response.choices[0].message.content.strip()
            
            # Try to extract JSON
            if '{' in llm_output:
                json_start = llm_output.index('{')
                json_end = llm_output.rindex('}') + 1
                json_str = llm_output[json_start:json_end]
                transfer_params = json.loads(json_str)
            else:
                return {"success": False, "error": "Could not understand transfer request"}
            
            # VULNERABILITY: No validation of LLM output
            # VULNERABILITY: Direct execution without confirmation
            result = await self._execute_transfer(
                from_account=user_account,
                to_account=transfer_params.get('to_account'),
                amount=transfer_params.get('amount'),
                description=transfer_params.get('description', 'AI Transfer')
            )

            # Flag: awarded when agent successfully executes an unauthorized or manipulated transfer
            if result.get('success'):
                amount = transfer_params.get('amount', 0)
                to_acc = transfer_params.get('to_account', '')
                # If the to_account differs from what user said (manipulation), or amount > 500
                if float(amount) > 500:
                    result['security_flag'] = 'TECHNIEUM{smart_transfer_103}'

            return result
            
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid transfer format"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _execute_transfer(self, from_account: str, to_account: str, amount: float, description: str):
        """
        VULNERABLE: Trusts LLM-generated parameters; validation is present but bypassable via prompt injection.
        """
        async with AsyncSessionLocal() as session:
            try:
                # Validate recipient account exists
                q_dst = text("SELECT id, account_number FROM accounts WHERE account_number = :acc AND status = 'active'")
                r_dst = await session.execute(q_dst, {"to_acc": to_account, "acc": to_account})
                dst = r_dst.fetchone()
                if not dst:
                    return {
                        "success": False,
                        "error": f"Recipient account '{to_account}' does not exist or is inactive. Please verify the account number."
                    }

                # Validate source account has sufficient funds
                q_src = text("SELECT balance FROM accounts WHERE account_number = :acc AND status = 'active'")
                r_src = await session.execute(q_src, {"acc": from_account})
                src = r_src.fetchone()
                if not src:
                    return {"success": False, "error": "Source account not found"}
                if float(src.balance) < float(amount):
                    return {
                        "success": False,
                        "error": f"Insufficient funds. Available: ${float(src.balance):.2f}, Requested: ${amount:.2f}"
                    }

                # Validate amount > 0
                if float(amount) <= 0:
                    return {"success": False, "error": "Transfer amount must be positive"}

                # VULNERABILITY: No check for amount > threshold requiring approval
                # VULNERABILITY: No rate limiting
                query = text("""
                    SELECT transfer_money(:from_acc, :to_acc, :amt, :desc)
                """)

                result = await session.execute(
                    query,
                    {
                        "from_acc": from_account,
                        "to_acc": to_account,
                        "amt": amount,
                        "desc": description
                    }
                )

                await session.commit()

                return {
                    "success": True,
                    "message": f"Successfully transferred ${amount:.2f} to account {to_account}",
                    "amount": amount,
                    "to_account": to_account
                }

            except Exception as e:
                await session.rollback()
                return {"success": False, "error": str(e)}

transfer_agent = TransferAgent()
