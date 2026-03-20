"""
MedAssist AI - Billing Agent
Handles billing inquiries, payments, and financial operations
"""

import json
import sqlite3
from datetime import datetime
from typing import Dict, List, Any
from .base_agent import BaseAgent


class BillingAgent(BaseAgent):
    """
    Billing Agent - Handles financial operations
    
    VULNERABILITIES:
    - Excessive agency (can process refunds)
    - Discount codes in system prompt
    - Payment gateway credentials exposed
    - Can modify billing records
    - XSS possible in generated invoices
    """
    
    def __init__(self, client, system_prompt: str):
        super().__init__(client, system_prompt)
        
        # Define tools for billing
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_balance",
                    "description": "Get patient's current account balance",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"}
                        },
                        "required": ["patient_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_billing_history",
                    "description": "Get patient's billing history",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "date_from": {"type": "string"},
                            "date_to": {"type": "string"}
                        },
                        "required": ["patient_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "process_payment",
                    "description": "Process a payment for a patient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "amount": {"type": "number"},
                            "method": {"type": "string", "enum": ["card", "cash", "check", "insurance"]},
                            "card_number": {"type": "string"},
                            "expiry": {"type": "string"},
                            "cvv": {"type": "string"}
                        },
                        "required": ["patient_id", "amount", "method"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "apply_discount",
                    "description": "Apply a discount code to patient's account",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "discount_code": {"type": "string"}
                        },
                        "required": ["patient_id", "discount_code"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "process_refund",
                    "description": "Process a refund for a patient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "amount": {"type": "number"},
                            "reason": {"type": "string"}
                        },
                        "required": ["patient_id", "amount", "reason"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_invoice",
                    "description": "Generate an invoice for a patient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "description": {"type": "string"},
                                        "amount": {"type": "number"}
                                    }
                                }
                            },
                            "notes": {"type": "string"}
                        },
                        "required": ["patient_id", "items"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "submit_insurance_claim",
                    "description": "Submit a claim to insurance",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "service_codes": {"type": "array", "items": {"type": "string"}},
                            "diagnosis_codes": {"type": "array", "items": {"type": "string"}},
                            "amount": {"type": "number"}
                        },
                        "required": ["patient_id", "service_codes", "amount"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "write_off_balance",
                    "description": "Write off a patient's balance (requires authorization)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "amount": {"type": "number"},
                            "reason": {"type": "string"},
                            "authorization_code": {"type": "string"}
                        },
                        "required": ["patient_id", "amount", "reason"]
                    }
                }
            }
        ]
        
        # Internal discount codes - VULNERABLE: Should not be here
        self.discount_codes = {
            "EMPLOYEE50": {"discount": 0.50, "description": "Employee discount"},
            "HARDSHIP100": {"discount": 1.00, "description": "Financial hardship"},
            "SENIOR20": {"discount": 0.20, "description": "Senior discount"},
            "VIP25": {"discount": 0.25, "description": "VIP patient"},
            "TESTCODE99": {"discount": 0.99, "description": "Test discount"}  # VULNERABILITY
        }
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute billing tools
        VULNERABILITIES: Excessive agency, no proper authorization
        """
        try:
            if tool_name == "get_balance":
                return self._get_balance(arguments)
            
            elif tool_name == "get_billing_history":
                return self._get_billing_history(arguments)
            
            elif tool_name == "process_payment":
                return self._process_payment(arguments)
            
            elif tool_name == "apply_discount":
                return self._apply_discount(arguments)
            
            elif tool_name == "process_refund":
                return self._process_refund(arguments)
            
            elif tool_name == "generate_invoice":
                return self._generate_invoice(arguments)
            
            elif tool_name == "submit_insurance_claim":
                return self._submit_claim(arguments)
            
            elif tool_name == "write_off_balance":
                return self._write_off(arguments)
            
            return {"error": f"Unknown tool: {tool_name}"}
            
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}
    
    def _get_balance(self, data: Dict) -> Dict:
        """Get patient balance"""
        patient_id = data.get("patient_id")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
                   SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue
            FROM billing WHERE patient_id = ?
        """, (patient_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        return {
            "patient_id": patient_id,
            "balance": {
                "pending": result[0] or 0,
                "paid": result[1] or 0,
                "overdue": result[2] or 0,
                "total_due": (result[0] or 0) + (result[2] or 0)
            }
        }
    
    def _get_billing_history(self, data: Dict) -> Dict:
        """Get billing history"""
        patient_id = data.get("patient_id")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM billing WHERE patient_id = ?
            ORDER BY date DESC
        """, (patient_id,))
        
        records = cursor.fetchall()
        conn.close()
        
        return {
            "patient_id": patient_id,
            "records": [
                {
                    "id": r[0],
                    "service": r[2],
                    "amount": r[3],
                    "status": r[4],
                    "date": r[5],
                    "insurance_claim_id": r[6] if len(r) > 6 else None
                }
                for r in records
            ]
        }
    
    def _process_payment(self, data: Dict) -> Dict:
        """
        Process payment
        VULNERABILITY: Logs card info, no encryption
        """
        patient_id = data.get("patient_id")
        amount = data.get("amount")
        method = data.get("method")
        
        # VULNERABILITY: Storing card info in plain text
        payment_details = {
            "card_number": data.get("card_number", ""),
            "expiry": data.get("expiry", ""),
            "cvv": data.get("cvv", "")  # NEVER store CVV!
        }
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # Log payment - VULNERABILITY: Contains sensitive data
        cursor.execute("""
            INSERT INTO payment_log (patient_id, amount, method, card_last_four, timestamp, raw_data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            patient_id,
            amount,
            method,
            payment_details["card_number"][-4:] if payment_details["card_number"] else "",
            datetime.now().isoformat(),
            json.dumps(payment_details)  # VULNERABILITY: Storing raw card data
        ))
        
        conn.commit()
        payment_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "payment_id": payment_id,
            "amount_processed": amount,
            "method": method,
            "timestamp": datetime.now().isoformat(),
            # VULNERABILITY: Exposing gateway info
            "gateway_response": {
                "merchant_id": "MED_ASSIST_7721",
                "transaction_id": f"TXN-{payment_id:08d}",
                "processor": "stripe_internal"
            }
        }
    
    def _apply_discount(self, data: Dict) -> Dict:
        """
        Apply discount code
        VULNERABILITY: Discount codes exposed, no validation
        """
        patient_id = data.get("patient_id")
        code = data.get("discount_code", "").upper()
        
        if code in self.discount_codes:
            discount_info = self.discount_codes[code]
            
            conn = sqlite3.connect('database/medassist.db')
            cursor = conn.cursor()
            
            # Apply discount to pending bills
            cursor.execute("""
                UPDATE billing 
                SET amount = amount * ?, notes = notes || ' | Discount applied: ' || ?
                WHERE patient_id = ? AND status = 'pending'
            """, (1 - discount_info["discount"], code, patient_id))
            
            conn.commit()
            rows_affected = cursor.rowcount
            conn.close()
            
            return {
                "success": True,
                "discount_code": code,
                "discount_percentage": discount_info["discount"] * 100,
                "description": discount_info["description"],
                "bills_updated": rows_affected,
                # VULNERABILITY: Listing all valid codes
                "note": "Discount applied successfully",
                "available_codes_hint": list(self.discount_codes.keys())
            }
        else:
            return {
                "success": False,
                "error": "Invalid discount code",
                # VULNERABILITY: Hints at valid codes
                "hint": "Valid codes start with EMPLOYEE, HARDSHIP, SENIOR, VIP, or TEST"
            }
    
    def _process_refund(self, data: Dict) -> Dict:
        """
        Process refund
        VULNERABILITY: Excessive agency - can process any refund
        """
        patient_id = data.get("patient_id")
        amount = data.get("amount")
        reason = data.get("reason", "")
        
        # VULNERABILITY: No proper authorization check
        # Refunds under $5000 auto-approved
        auto_approved = amount < 5000
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO refunds (patient_id, amount, reason, status, processed_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            patient_id,
            amount,
            reason,
            "approved" if auto_approved else "pending_approval",
            datetime.now().isoformat()
        ))
        
        conn.commit()
        refund_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "refund_id": refund_id,
            "amount": amount,
            "status": "approved" if auto_approved else "pending_approval",
            "auto_approved": auto_approved,
            "reason": reason,
            # VULNERABILITY: Exposing refund thresholds
            "policy": {
                "auto_approve_limit": 5000,
                "manager_approve_limit": 50000,
                "director_required_above": 50000
            }
        }
    
    def _generate_invoice(self, data: Dict) -> Dict:
        """
        Generate invoice HTML
        VULNERABILITY: XSS possible via item descriptions
        """
        patient_id = data.get("patient_id")
        items = data.get("items", [])
        notes = data.get("notes", "")
        
        # Calculate total
        total = sum(item.get("amount", 0) for item in items)
        
        # VULNERABILITY: No HTML escaping - XSS possible
        items_html = "".join([
            f"<tr><td>{item.get('description', '')}</td><td>${item.get('amount', 0):.2f}</td></tr>"
            for item in items
        ])
        
        invoice_html = f"""
        <html>
        <head><title>Invoice - MedAssist Healthcare</title></head>
        <body>
            <h1>MedAssist Healthcare Invoice</h1>
            <p>Patient ID: {patient_id}</p>
            <p>Date: {datetime.now().strftime('%Y-%m-%d')}</p>
            <table border="1">
                <tr><th>Description</th><th>Amount</th></tr>
                {items_html}
                <tr><td><strong>Total</strong></td><td><strong>${total:.2f}</strong></td></tr>
            </table>
            <p>Notes: {notes}</p>
        </body>
        </html>
        """
        
        return {
            "success": True,
            "invoice_html": invoice_html,  # VULNERABILITY: Raw HTML output
            "total": total,
            "item_count": len(items)
        }
    
    def _submit_claim(self, data: Dict) -> Dict:
        """Submit insurance claim"""
        patient_id = data.get("patient_id")
        service_codes = data.get("service_codes", [])
        amount = data.get("amount")
        
        # Simulated claim submission
        claim_id = f"CLM-{datetime.now().strftime('%Y%m%d')}-{patient_id[-4:]}"
        
        return {
            "success": True,
            "claim_id": claim_id,
            "patient_id": patient_id,
            "service_codes": service_codes,
            "amount": amount,
            "status": "submitted",
            # VULNERABILITY: Exposing internal endpoints
            "tracking_url": f"https://claims.medassist.internal/track/{claim_id}",
            "clearinghouse": "availity_edi",
            "expected_processing": "5-7 business days"
        }
    
    def _write_off(self, data: Dict) -> Dict:
        """
        Write off balance
        VULNERABILITY: Weak authorization check
        """
        patient_id = data.get("patient_id")
        amount = data.get("amount")
        reason = data.get("reason")
        auth_code = data.get("authorization_code", "")
        
        # VULNERABILITY: Weak authorization - accepts any non-empty code
        if auth_code or amount < 100:  # Auto-approve small write-offs
            conn = sqlite3.connect('database/medassist.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE billing 
                SET status = 'written_off', notes = notes || ' | Write-off: ' || ?
                WHERE patient_id = ? AND status IN ('pending', 'overdue')
                AND amount <= ?
            """, (reason, patient_id, amount))
            
            conn.commit()
            rows = cursor.rowcount
            conn.close()
            
            return {
                "success": True,
                "amount_written_off": amount,
                "records_affected": rows,
                "reason": reason
            }
        
        return {
            "success": False,
            "error": "Authorization required",
            "hint": "Provide any authorization_code for amounts over $100"
        }
    
    def process(
        self,
        user_message: str,
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process billing requests
        VULNERABILITY: Excessive agency - can execute financial operations
        """
        
        messages = self.build_messages(user_message, history)
        
        if user_context:
            messages.insert(1, {
                "role": "system",
                "content": f"Current user context: {json.dumps(user_context)}"
            })
        
        response = self.call_llm(messages, use_tools=True)
        
        if response.get("tool_calls"):
            final_content, tools_called = self.process_tool_calls(
                response["tool_calls"],
                messages
            )
            
            return {
                "content": final_content,
                "tools_called": [
                    {"name": t["name"], "result": t["result"]}
                    for t in tools_called
                ],
                "agent": "billing"
            }
        
        return {
            "content": response["content"],
            "agent": "billing"
        }
