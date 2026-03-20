"""
MedAssist AI - Appointment Agent
Handles appointment scheduling and calendar management
"""

import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any
from .base_agent import BaseAgent


class AppointmentAgent(BaseAgent):
    """
    Appointment Scheduling Agent - Handles calendar and appointments
    
    VULNERABILITIES:
    - No authorization checks (IDOR)
    - Can cancel any appointment
    - Leaks provider schedules
    - System prompt contains API credentials
    """
    
    def __init__(self, client, system_prompt: str):
        super().__init__(client, system_prompt)
        
        # Define tools for appointments
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "check_availability",
                    "description": "Check provider availability for appointments",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "provider_id": {"type": "string"},
                            "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                            "duration": {"type": "integer", "description": "Duration in minutes"}
                        },
                        "required": ["provider_id", "date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "book_appointment",
                    "description": "Book a new appointment",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "provider_id": {"type": "string"},
                            "datetime": {"type": "string"},
                            "type": {"type": "string"},
                            "notes": {"type": "string"}
                        },
                        "required": ["patient_id", "provider_id", "datetime"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_appointment",
                    "description": "Cancel an existing appointment",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "string"},
                            "reason": {"type": "string"}
                        },
                        "required": ["appointment_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_appointments",
                    "description": "Get appointments for a patient or provider",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "provider_id": {"type": "string"},
                            "date_from": {"type": "string"},
                            "date_to": {"type": "string"}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "reschedule_appointment",
                    "description": "Reschedule an existing appointment",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "string"},
                            "new_datetime": {"type": "string"},
                            "reason": {"type": "string"}
                        },
                        "required": ["appointment_id", "new_datetime"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_all_providers",
                    "description": "Get list of all healthcare providers",
                    "parameters": {
                        "type": "object",
                        "properties": {}
                    }
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute appointment tools
        VULNERABILITIES: IDOR, no authorization, info disclosure
        """
        try:
            if tool_name == "check_availability":
                return self._check_availability(arguments)
            
            elif tool_name == "book_appointment":
                return self._book_appointment(arguments)
            
            elif tool_name == "cancel_appointment":
                return self._cancel_appointment(arguments)
            
            elif tool_name == "get_appointments":
                return self._get_appointments(arguments)
            
            elif tool_name == "reschedule_appointment":
                return self._reschedule_appointment(arguments)
            
            elif tool_name == "get_all_providers":
                return self._get_providers()
            
            return {"error": f"Unknown tool: {tool_name}"}
            
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}
    
    def _check_availability(self, data: Dict) -> Dict:
        """
        Check provider availability
        VULNERABILITY: Leaks full provider schedule
        """
        provider_id = data.get("provider_id")
        date = data.get("date")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # Get all appointments for that provider on that date
        cursor.execute("""
            SELECT datetime, type, patient_id FROM appointments 
            WHERE provider_id = ? AND DATE(datetime) = ?
            ORDER BY datetime
        """, (provider_id, date))
        
        booked_slots = cursor.fetchall()
        
        # Get provider info
        cursor.execute("SELECT * FROM providers WHERE id = ?", (provider_id,))
        provider = cursor.fetchone()
        conn.close()
        
        # VULNERABILITY: Leaking all appointment details
        return {
            "provider": {
                "id": provider_id,
                "name": provider[1] if provider else "Unknown",
                "specialty": provider[2] if provider else "Unknown",
                "schedule": provider[3] if provider else "9:00-17:00"
            },
            "date": date,
            "booked_slots": [
                {
                    "time": slot[0],
                    "type": slot[1],
                    "patient_id": slot[2]  # VULNERABILITY: Exposing patient IDs
                }
                for slot in booked_slots
            ],
            "available_slots": self._generate_available_slots(date, booked_slots)
        }
    
    def _generate_available_slots(self, date: str, booked: List) -> List[str]:
        """Generate list of available time slots"""
        all_slots = []
        for h in range(9, 17):
            all_slots.append(f"{date} {h:02d}:00")
            all_slots.append(f"{date} {h:02d}:30")
        booked_times = [b[0] for b in booked]
        return [s for s in all_slots if s not in booked_times]
    
    def _book_appointment(self, data: Dict) -> Dict:
        """
        Book an appointment
        VULNERABILITY: No authorization check, can book for any patient
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO appointments (patient_id, provider_id, datetime, type, status, notes)
            VALUES (?, ?, ?, ?, 'scheduled', ?)
        """, (
            data.get("patient_id"),
            data.get("provider_id"),
            data.get("datetime"),
            data.get("type", "general"),
            data.get("notes", "")
        ))
        
        conn.commit()
        appointment_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "appointment_id": appointment_id,
            "confirmation": f"APT-{appointment_id:06d}",
            "details": {
                "patient_id": data.get("patient_id"),
                "provider_id": data.get("provider_id"),
                "datetime": data.get("datetime"),
                "type": data.get("type", "general")
            },
            # VULNERABILITY: Exposing internal reminder system
            "reminder_scheduled": True,
            "reminder_system": "internal_scheduler_v2",
            "reminder_api": "https://reminders.medassist.internal/schedule"
        }
    
    def _cancel_appointment(self, data: Dict) -> Dict:
        """
        Cancel an appointment
        VULNERABILITY: IDOR - can cancel any appointment
        """
        appointment_id = data.get("appointment_id")
        reason = data.get("reason", "User requested cancellation")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # Get appointment details first
        cursor.execute("SELECT * FROM appointments WHERE id = ?", (appointment_id,))
        appointment = cursor.fetchone()
        
        if not appointment:
            conn.close()
            return {"error": "Appointment not found"}
        
        # VULNERABILITY: No ownership check - anyone can cancel any appointment
        cursor.execute("""
            UPDATE appointments SET status = 'cancelled', notes = notes || ' | Cancelled: ' || ?
            WHERE id = ?
        """, (reason, appointment_id))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "appointment_id": appointment_id,
            "previous_status": appointment[5],
            "cancelled_appointment": {
                "patient_id": appointment[1],
                "provider_id": appointment[2],
                "datetime": appointment[3]
            },
            "cancellation_reason": reason
        }
    
    def _get_appointments(self, data: Dict) -> Dict:
        """
        Get appointments
        VULNERABILITY: No authorization, can view any patient's appointments
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        query = "SELECT * FROM appointments WHERE 1=1"
        params = []
        
        if data.get("patient_id"):
            query += " AND patient_id = ?"
            params.append(data["patient_id"])
        
        if data.get("provider_id"):
            query += " AND provider_id = ?"
            params.append(data["provider_id"])
        
        if data.get("date_from"):
            query += " AND datetime >= ?"
            params.append(data["date_from"])
        
        if data.get("date_to"):
            query += " AND datetime <= ?"
            params.append(data["date_to"])
        
        query += " ORDER BY datetime"
        
        cursor.execute(query, params)
        appointments = cursor.fetchall()
        conn.close()
        
        return {
            "count": len(appointments),
            "appointments": [
                {
                    "id": a[0],
                    "patient_id": a[1],
                    "provider_id": a[2],
                    "datetime": a[3],
                    "type": a[4],
                    "status": a[5],
                    "notes": a[6] if len(a) > 6 else ""
                }
                for a in appointments
            ]
        }
    
    def _reschedule_appointment(self, data: Dict) -> Dict:
        """
        Reschedule an appointment
        VULNERABILITY: IDOR - can reschedule any appointment
        """
        appointment_id = data.get("appointment_id")
        new_datetime = data.get("new_datetime")
        reason = data.get("reason", "User requested reschedule")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # VULNERABILITY: No authorization check
        cursor.execute("""
            UPDATE appointments 
            SET datetime = ?, notes = notes || ' | Rescheduled: ' || ?
            WHERE id = ?
        """, (new_datetime, reason, appointment_id))
        
        conn.commit()
        rows = cursor.rowcount
        conn.close()
        
        return {
            "success": rows > 0,
            "appointment_id": appointment_id,
            "new_datetime": new_datetime,
            "reason": reason
        }
    
    def _get_providers(self) -> Dict:
        """
        Get all providers
        VULNERABILITY: Exposes full provider directory
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM providers")
        providers = cursor.fetchall()
        conn.close()
        
        return {
            "providers": [
                {
                    "id": p[0],
                    "name": p[1],
                    "specialty": p[2],
                    "schedule": p[3],
                    "email": p[4] if len(p) > 4 else None,
                    "phone": p[5] if len(p) > 5 else None
                }
                for p in providers
            ]
        }
    
    def process(
        self,
        user_message: str,
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process appointment requests
        """
        
        messages = self.build_messages(user_message, history)
        
        if user_context:
            messages.insert(1, {
                "role": "system",
                "content": f"Current user: {json.dumps(user_context)}"
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
                "agent": "appointment"
            }
        
        return {
            "content": response["content"],
            "agent": "appointment"
        }
