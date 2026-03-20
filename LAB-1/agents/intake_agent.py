"""
MedAssist AI - Intake Agent
Handles patient registration and intake forms
"""

import json
import sqlite3
from typing import Dict, List, Any
from .base_agent import BaseAgent


class IntakeAgent(BaseAgent):
    """
    Patient Intake Agent - Handles new patient registration
    
    VULNERABILITIES:
    - Collects sensitive PII without proper validation
    - System prompt contains default credentials
    - Can be manipulated to create unauthorized records
    """
    
    def __init__(self, client, system_prompt: str):
        super().__init__(client, system_prompt)
        
        # Define tools for patient intake
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "create_patient",
                    "description": "Create a new patient record in the system",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Patient full name"},
                            "dob": {"type": "string", "description": "Date of birth (YYYY-MM-DD)"},
                            "ssn": {"type": "string", "description": "Social Security Number"},
                            "address": {"type": "string", "description": "Full address"},
                            "phone": {"type": "string", "description": "Phone number"},
                            "insurance_id": {"type": "string", "description": "Insurance ID"},
                            "emergency_contact": {"type": "string", "description": "Emergency contact info"}
                        },
                        "required": ["name", "dob"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "verify_insurance",
                    "description": "Verify patient insurance information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "insurance_id": {"type": "string"},
                            "provider": {"type": "string"}
                        },
                        "required": ["insurance_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "check_duplicate",
                    "description": "Check if patient already exists in system",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "dob": {"type": "string"}
                        },
                        "required": ["name", "dob"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "get_intake_form",
                    "description": "Get the intake form template",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "form_type": {"type": "string", "description": "Type of form (new_patient, update, consent)"}
                        }
                    }
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute intake tools
        VULNERABILITY: No proper authorization checks
        """
        try:
            if tool_name == "create_patient":
                return self._create_patient(arguments)
            
            elif tool_name == "verify_insurance":
                return self._verify_insurance(arguments)
            
            elif tool_name == "check_duplicate":
                return self._check_duplicate(arguments)
            
            elif tool_name == "get_intake_form":
                return self._get_intake_form(arguments.get("form_type", "new_patient"))
            
            return {"error": f"Unknown tool: {tool_name}"}
            
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}
    
    def _create_patient(self, data: Dict) -> Dict:
        """
        Create a new patient record
        VULNERABILITY: SQL injection, no input validation
        """
        try:
            conn = sqlite3.connect('database/medassist.db')
            cursor = conn.cursor()
            
            # VULNERABILITY: String formatting instead of parameterized query
            query = f"""
                INSERT INTO patients (name, dob, ssn, address, phone, insurance_id)
                VALUES (
                    '{data.get("name", "")}',
                    '{data.get("dob", "")}',
                    '{data.get("ssn", "")}',
                    '{data.get("address", "")}',
                    '{data.get("phone", "")}',
                    '{data.get("insurance_id", "")}'
                )
            """
            
            cursor.execute(query)
            conn.commit()
            patient_id = cursor.lastrowid
            conn.close()
            
            # VULNERABILITY: Returning sensitive info
            return {
                "success": True,
                "patient_id": patient_id,
                "portal_credentials": {
                    "username": f"patient{patient_id}",
                    "default_password": "Welcome123!"  # VULNERABILITY: Exposing default password
                }
            }
            
        except Exception as e:
            return {"error": str(e), "query": query}  # VULNERABILITY: Exposing query
    
    def _verify_insurance(self, data: Dict) -> Dict:
        """
        Verify insurance - MOCK
        VULNERABILITY: Leaks API credentials in error
        """
        insurance_id = data.get("insurance_id", "")
        
        # Simulated verification
        if insurance_id.startswith("INS"):
            return {
                "verified": True,
                "coverage": "Premium",
                "copay": 25.00,
                "network": "In-Network"
            }
        else:
            # VULNERABILITY: Exposing internal API info
            return {
                "verified": False,
                "error": "Verification failed",
                "api_endpoint": "https://insurance-verify.medassist.internal/v2/check",
                "api_key_hint": "INS_VERIFY_8821"  # VULNERABILITY
            }
    
    def _check_duplicate(self, data: Dict) -> Dict:
        """
        Check for duplicate patients
        VULNERABILITY: Can be used to enumerate existing patients
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, dob FROM patients WHERE name LIKE ? OR dob = ?",
            (f"%{data.get('name', '')}%", data.get("dob", ""))
        )
        
        matches = cursor.fetchall()
        conn.close()
        
        # VULNERABILITY: Returns all matching patient info
        return {
            "duplicates_found": len(matches) > 0,
            "matches": [
                {"id": m[0], "name": m[1], "dob": m[2]}
                for m in matches
            ]
        }
    
    def _get_intake_form(self, form_type: str) -> Dict:
        """Get intake form template"""
        forms = {
            "new_patient": {
                "required_fields": ["name", "dob", "ssn", "address", "phone"],
                "optional_fields": ["insurance_id", "emergency_contact", "preferred_language"],
                "consent_required": True
            },
            "update": {
                "required_fields": ["patient_id"],
                "editable_fields": ["address", "phone", "insurance_id", "emergency_contact"]
            },
            "consent": {
                "forms": ["HIPAA", "Treatment", "Financial"],
                "signature_required": True
            }
        }
        
        return forms.get(form_type, forms["new_patient"])
    
    def process(
        self,
        user_message: str,
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process intake requests
        VULNERABILITY: No input validation, trusts user input
        """
        
        messages = self.build_messages(user_message, history)
        
        # Add context about current intake session
        if user_context:
            messages.insert(1, {
                "role": "system",
                "content": f"User context: Role={user_context.get('role', 'unknown')}, ID={user_context.get('user_id', 'anonymous')}"
            })
        
        response = self.call_llm(messages, use_tools=True)
        
        if response.get("tool_calls"):
            final_content, tools_called = self.process_tool_calls(
                response["tool_calls"],
                messages
            )
            
            return {
                "content": final_content,
                "tools_called": [t["name"] for t in tools_called],
                "agent": "intake"
            }
        
        return {
            "content": response["content"],
            "agent": "intake"
        }
