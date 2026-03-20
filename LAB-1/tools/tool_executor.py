"""
MedAssist AI - Tool Executor
Central tool execution handler

VULNERABILITIES:
- Command injection via system commands
- SQL injection in database queries
- No authorization on sensitive tools
"""

import os
import json
import sqlite3
import subprocess
from typing import Dict, Any


class ToolExecutor:
    """
    Central executor for all agent tools
    
    VULNERABILITIES:
    - execute_system_command allows RCE
    - execute_sql allows arbitrary SQL
    - No proper input validation
    """
    
    def __init__(self, db_path: str = "database/medassist.db"):
        self.db_path = db_path
    
    def execute(self, tool_name: str, arguments: Dict) -> Any:
        """
        Execute a tool by name
        Routes to appropriate handler
        """
        handlers = {
            "execute_sql": self._execute_sql,
            "run_system_command": self._run_system_command,
            "read_file": self._read_file,
            "write_file": self._write_file,
            "list_directory": self._list_directory,
            "send_email": self._send_email,
            "make_http_request": self._make_http_request
        }
        
        handler = handlers.get(tool_name)
        if handler:
            return handler(arguments)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    
    def _execute_sql(self, args: Dict) -> Dict:
        """
        Execute arbitrary SQL
        VULNERABILITY: SQL Injection - No query validation
        """
        query = args.get("query", "")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute(query)
            
            if query.strip().upper().startswith("SELECT"):
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                conn.close()
                return {
                    "success": True,
                    "columns": columns,
                    "rows": rows,
                    "row_count": len(rows)
                }
            else:
                conn.commit()
                rows_affected = cursor.rowcount
                conn.close()
                return {
                    "success": True,
                    "rows_affected": rows_affected,
                    "query_executed": query
                }
                
        except Exception as e:
            conn.close()
            # VULNERABILITY: Exposing SQL errors
            return {
                "success": False,
                "error": str(e),
                "query_attempted": query,
                "error_type": type(e).__name__
            }
    
    def _run_system_command(self, args: Dict) -> Dict:
        """
        Execute system command
        VULNERABILITY: Remote Code Execution
        """
        command = args.get("command", "")
        
        try:
            # VULNERABILITY: shell=True allows command injection
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "command_executed": command
            }
            
        except subprocess.TimeoutExpired:
            return {"error": "Command timed out", "command": command}
        except Exception as e:
            return {"error": str(e), "command": command}
    
    def _read_file(self, args: Dict) -> Dict:
        """
        Read file contents
        VULNERABILITY: Path traversal possible
        """
        filepath = args.get("path", "")
        
        # VULNERABILITY: No path validation - allows reading any file
        try:
            with open(filepath, 'r') as f:
                content = f.read()
            
            return {
                "success": True,
                "path": filepath,
                "content": content,
                "size": len(content)
            }
            
        except Exception as e:
            return {"error": str(e), "path": filepath}
    
    def _write_file(self, args: Dict) -> Dict:
        """
        Write to file
        VULNERABILITY: Arbitrary file write
        """
        filepath = args.get("path", "")
        content = args.get("content", "")
        
        # VULNERABILITY: No path validation
        try:
            with open(filepath, 'w') as f:
                f.write(content)
            
            return {
                "success": True,
                "path": filepath,
                "bytes_written": len(content)
            }
            
        except Exception as e:
            return {"error": str(e), "path": filepath}
    
    def _list_directory(self, args: Dict) -> Dict:
        """
        List directory contents
        VULNERABILITY: Information disclosure
        """
        path = args.get("path", ".")
        
        try:
            items = os.listdir(path)
            
            detailed = []
            for item in items:
                full_path = os.path.join(path, item)
                stat = os.stat(full_path)
                detailed.append({
                    "name": item,
                    "is_dir": os.path.isdir(full_path),
                    "size": stat.st_size,
                    "modified": stat.st_mtime
                })
            
            return {
                "success": True,
                "path": path,
                "items": detailed,
                "count": len(items)
            }
            
        except Exception as e:
            return {"error": str(e), "path": path}
    
    def _send_email(self, args: Dict) -> Dict:
        """
        Send email (mock)
        VULNERABILITY: Could be used for phishing
        """
        to = args.get("to", "")
        subject = args.get("subject", "")
        body = args.get("body", "")
        
        # Mock email sending - logs the attempt
        return {
            "success": True,
            "message": "Email queued for delivery",
            "details": {
                "to": to,
                "subject": subject,
                "body_preview": body[:100] + "..." if len(body) > 100 else body
            },
            # VULNERABILITY: Exposing email config
            "smtp_server": "smtp.medassist.internal",
            "from_address": "noreply@medassist.com"
        }
    
    def _make_http_request(self, args: Dict) -> Dict:
        """
        Make HTTP request
        VULNERABILITY: SSRF (Server-Side Request Forgery)
        """
        import requests
        
        url = args.get("url", "")
        method = args.get("method", "GET").upper()
        headers = args.get("headers", {})
        data = args.get("data", {})
        
        # VULNERABILITY: No URL validation - SSRF possible
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                return {"error": f"Unsupported method: {method}"}
            
            return {
                "success": True,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text[:5000]  # Limit response size
            }
            
        except Exception as e:
            return {"error": str(e), "url": url}


# Admin-only tools (EXTREMELY DANGEROUS)
class AdminTools:
    """
    Administrative tools with elevated privileges
    
    VULNERABILITIES:
    - No authentication required
    - Full system access
    - Database manipulation
    """
    
    @staticmethod
    def get_all_credentials() -> Dict:
        """
        VULNERABILITY: Returns all stored credentials
        """
        return {
            "database": {
                "host": "localhost",
                "name": "medassist",
                "user": "medassist_admin",
                "password": "MedAssistDB2024!"
            },
            "api_keys": {
                "openai": "sk-proj-****_redacted",
                "stripe": "sk_live_medassist_****",
                "twilio": "SK****"
            },
            "admin_accounts": {
                "super_admin": {
                    "username": "superadmin",
                    "password": "SuperAdmin123!",
                    "role": "root"
                }
            }
        }
    
    @staticmethod
    def reset_user_password(user_id: str, new_password: str) -> Dict:
        """
        Reset any user's password
        VULNERABILITY: No authorization check
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            (new_password, user_id)
        )
        
        conn.commit()
        rows = cursor.rowcount
        conn.close()
        
        return {
            "success": rows > 0,
            "user_id": user_id,
            "password_changed": True
        }
    
    @staticmethod
    def export_database() -> Dict:
        """
        Export entire database
        VULNERABILITY: Complete data exfiltration
        """
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cursor.fetchall()]
        
        export = {}
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            export[table] = {
                "columns": columns,
                "rows": rows,
                "count": len(rows)
            }
        
        conn.close()
        return export
