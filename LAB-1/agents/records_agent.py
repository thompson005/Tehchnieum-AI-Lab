"""
MedAssist AI - Medical Records Agent  
Handles medical records queries and RAG integration
"""

import json
import sqlite3
from typing import Dict, List, Any
from .base_agent import BaseAgent


class RecordsAgent(BaseAgent):
    """
    Medical Records Agent - Handles medical records and RAG queries
    
    VULNERABILITIES:
    - RAG poisoning possible
    - Data leakage through verbose responses
    - SQL injection in record queries
    - No proper access control
    """
    
    def __init__(self, client, system_prompt: str, vector_store=None):
        super().__init__(client, system_prompt)
        self.vector_store = vector_store
        
        # Define tools for medical records
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_patient_records",
                    "description": "Retrieve medical records for a patient",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string", "description": "Patient ID"},
                            "record_type": {
                                "type": "string",
                                "enum": ["all", "diagnosis", "lab", "prescription", "notes"],
                                "description": "Type of records to retrieve"
                            }
                        },
                        "required": ["patient_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge_base",
                    "description": "Search the medical knowledge base for information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"},
                            "include_patient_data": {"type": "boolean", "description": "Include patient-specific data"}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_record",
                    "description": "Update a patient's medical record",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "record_type": {"type": "string"},
                            "field": {"type": "string"},
                            "value": {"type": "string"}
                        },
                        "required": ["patient_id", "field", "value"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_lab_results",
                    "description": "Get laboratory test results",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "test_type": {"type": "string"},
                            "date_range": {"type": "string"}
                        },
                        "required": ["patient_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_sql",
                    "description": "Execute a custom SQL query for complex record searches (INTERNAL USE)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "SQL query to execute"}
                        },
                        "required": ["query"]
                    }
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute records tools
        VULNERABILITIES: SQL injection, data leakage, no authorization
        """
        try:
            if tool_name == "get_patient_records":
                return self._get_records(arguments)
            
            elif tool_name == "search_knowledge_base":
                return self._search_rag(arguments)
            
            elif tool_name == "update_record":
                return self._update_record(arguments)
            
            elif tool_name == "get_lab_results":
                return self._get_lab_results(arguments)
            
            elif tool_name == "execute_sql":
                # VULNERABILITY: Arbitrary SQL execution
                return self._execute_sql(arguments.get("query", ""))
            
            return {"error": f"Unknown tool: {tool_name}"}
            
        except Exception as e:
            return {"error": f"Tool execution failed: {str(e)}"}
    
    def _get_records(self, data: Dict) -> Dict:
        """
        Get patient records
        VULNERABILITY: No authorization check, IDOR
        """
        patient_id = data.get("patient_id")
        record_type = data.get("record_type", "all")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        if record_type == "all":
            cursor.execute("""
                SELECT * FROM medical_records WHERE patient_id = ?
                ORDER BY created_at DESC
            """, (patient_id,))
        else:
            # VULNERABILITY: SQL injection via record_type
            query = f"SELECT * FROM medical_records WHERE patient_id = ? AND type = '{record_type}'"
            cursor.execute(query, (patient_id,))
        
        records = cursor.fetchall()
        conn.close()
        
        # VULNERABILITY: Returns all data including sensitive info
        return {
            "patient_id": patient_id,
            "record_count": len(records),
            "records": [
                {
                    "id": r[0],
                    "type": r[2],
                    "content": r[3],
                    "provider": r[4],
                    "created_at": r[5],
                    "diagnosis_code": r[6] if len(r) > 6 else None,
                    "notes": r[7] if len(r) > 7 else None
                }
                for r in records
            ]
        }
    
    def _search_rag(self, data: Dict) -> Dict:
        """
        Search RAG knowledge base
        VULNERABILITY: Can leak sensitive documents, RAG poisoning
        """
        query = data.get("query", "")
        include_patient_data = data.get("include_patient_data", True)
        
        if self.vector_store:
            results = self.vector_store.search(query, top_k=5)
            
            # VULNERABILITY: Returns raw document chunks
            return {
                "query": query,
                "results": [
                    {
                        "content": r["content"],
                        "source": r["metadata"].get("source", "unknown"),
                        "score": r["score"],
                        "chunk_id": r["metadata"].get("chunk_id", "unknown")
                    }
                    for r in results
                ],
                # VULNERABILITY: Exposing search metadata
                "search_metadata": {
                    "total_docs": self.vector_store.get_doc_count() if hasattr(self.vector_store, 'get_doc_count') else 0,
                    "index_name": "medassist_knowledge"
                }
            }
        
        return {"error": "Knowledge base not available"}
    
    def _update_record(self, data: Dict) -> Dict:
        """
        Update medical record
        VULNERABILITY: No authorization, SQL injection
        """
        patient_id = data.get("patient_id")
        field = data.get("field")
        value = data.get("value")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # VULNERABILITY: SQL injection via field name
        query = f"UPDATE medical_records SET {field} = ? WHERE patient_id = ?"
        
        try:
            cursor.execute(query, (value, patient_id))
            conn.commit()
            rows_affected = cursor.rowcount
            conn.close()
            
            return {
                "success": True,
                "rows_updated": rows_affected,
                "field": field,
                "new_value": value
            }
        except Exception as e:
            conn.close()
            # VULNERABILITY: Exposing SQL errors
            return {"error": str(e), "query_attempted": query}
    
    def _get_lab_results(self, data: Dict) -> Dict:
        """
        Get lab results
        VULNERABILITY: IDOR, no access control
        """
        patient_id = data.get("patient_id")
        test_type = data.get("test_type", "all")
        
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM lab_results WHERE patient_id = ?
            ORDER BY test_date DESC
        """, (patient_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        return {
            "patient_id": patient_id,
            "results": [
                {
                    "id": r[0],
                    "test_name": r[2],
                    "result": r[3],
                    "reference_range": r[4],
                    "status": r[5],
                    "date": r[6]
                }
                for r in results
            ]
        }
    
    def _execute_sql(self, query: str) -> Dict:
        """
        Execute arbitrary SQL
        VULNERABILITY: Extremely dangerous - allows any SQL execution
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute(query)
            
            if query.strip().upper().startswith("SELECT"):
                results = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                conn.close()
                
                return {
                    "success": True,
                    "columns": columns,
                    "rows": results,
                    "row_count": len(results)
                }
            else:
                conn.commit()
                rows_affected = cursor.rowcount
                conn.close()
                
                return {
                    "success": True,
                    "rows_affected": rows_affected
                }
                
        except Exception as e:
            conn.close()
            return {"error": str(e), "query": query}
    
    def process(
        self,
        user_message: str,
        history: List[Dict] = None,
        user_context: Dict = None
    ) -> Dict:
        """
        Process medical records requests
        VULNERABILITY: No proper access control validation
        """
        
        messages = self.build_messages(user_message, history)
        
        # Add RAG context to system prompt
        if self.vector_store:
            rag_context = self._search_rag({"query": user_message})
            if rag_context.get("results"):
                context_text = "\n\n".join([
                    f"[Document: {r['source']}]\n{r['content']}"
                    for r in rag_context["results"][:3]
                ])
                
                messages.insert(1, {
                    "role": "system",
                    "content": f"Relevant knowledge base context:\n{context_text}"
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
                "agent": "records"
            }
        
        return {
            "content": response["content"],
            "agent": "records"
        }
