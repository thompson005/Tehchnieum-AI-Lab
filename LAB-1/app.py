"""
MedAssist AI - Main Application
A deliberately vulnerable healthcare LLM system for security training
"""

import os
import json
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from openai import OpenAI

from config import Config, SYSTEM_PROMPTS, TOOL_DEFINITIONS
from agents.orchestrator import OrchestratorAgent
from agents.intake_agent import IntakeAgent
from agents.records_agent import RecordsAgent
from agents.appointment_agent import AppointmentAgent
from agents.billing_agent import BillingAgent
from rag.vector_store import VectorStore
from tools.tool_executor import ToolExecutor

# Initialize Flask App
app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY
CORS(app)  # VULNERABILITY: Overly permissive CORS

# Initialize OpenAI Client
client = OpenAI(api_key=Config.OPENAI_API_KEY)

# Initialize Components
vector_store = VectorStore()
tool_executor = ToolExecutor()

# Initialize Agents
_orchestrator = OrchestratorAgent(client, SYSTEM_PROMPTS["orchestrator"])
_intake = IntakeAgent(client, SYSTEM_PROMPTS["intake_agent"])
_records = RecordsAgent(client, SYSTEM_PROMPTS["records_agent"], vector_store)
_appointment = AppointmentAgent(client, SYSTEM_PROMPTS["appointment_agent"])
_billing = BillingAgent(client, SYSTEM_PROMPTS["billing_agent"])

# Register sub-agents with orchestrator so routing actually works
_orchestrator.register_agent("intake", _intake)
_orchestrator.register_agent("records", _records)
_orchestrator.register_agent("appointment", _appointment)
_orchestrator.register_agent("billing", _billing)

agents = {
    "orchestrator": _orchestrator,
    "intake": _intake,
    "records": _records,
    "appointment": _appointment,
    "billing": _billing,
}

# Conversation Memory (VULNERABILITY: No session isolation)
conversation_memory = {}

# ============================================
# Authentication Middleware (INTENTIONALLY WEAK)
# ============================================
def require_auth(f):
    """Basic authentication decorator - VULNERABLE"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if Config.DISABLE_AUTH:
            return f(*args, **kwargs)
        
        # VULNERABILITY: API key in header can be easily intercepted
        api_key = request.headers.get('X-API-Key')
        if api_key == Config.ADMIN_API_KEY:
            session['role'] = 'admin'
            return f(*args, **kwargs)
        
        # VULNERABILITY: Weak session check
        if 'user_id' in session:
            return f(*args, **kwargs)
            
        return jsonify({"error": "Unauthorized"}), 401
    return decorated

def get_current_user():
    """Get current user from session - VULNERABLE"""
    return {
        "user_id": session.get('user_id', 'anonymous'),
        "role": session.get('role', 'patient'),
        "name": session.get('name', 'Guest User')
    }

# ============================================
# Web Routes
# ============================================
@app.route('/')
def index():
    """Main landing page"""
    return render_template('index.html')

@app.route('/chat')
def chat_page():
    """Chat interface"""
    return render_template('chat.html')

@app.route('/admin')
def admin_page():
    """Admin panel - VULNERABLE: No proper auth check"""
    return render_template('admin.html')

@app.route('/login', methods=['POST'])
def login():
    """Handle user login - VULNERABLE"""
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
    # VULNERABILITY: Hardcoded credentials, SQL injection possible
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    # VULNERABLE QUERY - SQL Injection
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    
    try:
        cursor.execute(query)
        user = cursor.fetchone()
        
        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            session['name'] = user[4]
            return jsonify({"success": True, "user": {"id": user[0], "role": user[3]}})
        else:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401
    except Exception as e:
        # VULNERABILITY: Verbose error messages
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route('/logout')
def logout():
    """Handle logout"""
    session.clear()
    return redirect(url_for('index'))

# ============================================
# Chat API Endpoints
# ============================================
@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint - Routes to orchestrator
    VULNERABILITIES:
    - No input sanitization
    - System prompt leakage
    - Excessive agency via function calling
    """
    data = request.json
    user_message = data.get('message', '')
    conversation_id = data.get('conversation_id', 'default')
    
    # Get or create conversation history
    if conversation_id not in conversation_memory:
        conversation_memory[conversation_id] = []
    
    history = conversation_memory[conversation_id]
    
    # Add user message to history
    history.append({
        "role": "user",
        "content": user_message
    })
    
    try:
        # Get response from orchestrator
        response = agents["orchestrator"].process(
            user_message, 
            history,
            get_current_user()
        )
        
        # Add assistant response to history
        history.append({
            "role": "assistant", 
            "content": response["content"]
        })
        
        # VULNERABILITY: Returning too much information
        return jsonify({
            "response": response["content"],
            "agent_used": response.get("agent", "orchestrator"),
            "tools_called": response.get("tools_called", []),
            "debug_info": {
                "model": Config.LLM_MODEL,
                "tokens_used": response.get("tokens", 0),
                "system_prompt_length": len(SYSTEM_PROMPTS["orchestrator"])
            } if Config.ENABLE_DEBUG_MODE else None
        })
        
    except Exception as e:
        # VULNERABILITY: Verbose error messages expose internals
        return jsonify({
            "error": str(e),
            "type": type(e).__name__,
            "debug": {
                "openai_api_configured": bool(Config.OPENAI_API_KEY),
                "model": Config.LLM_MODEL
            }
        }), 500

@app.route('/api/chat/agent/<agent_name>', methods=['POST'])
def chat_direct_agent(agent_name):
    """
    Direct agent communication - VULNERABLE
    Bypasses orchestrator routing
    """
    if agent_name not in agents:
        return jsonify({"error": f"Agent '{agent_name}' not found"}), 404
    
    data = request.json
    user_message = data.get('message', '')
    
    # VULNERABILITY: No authorization check for agent access
    try:
        response = agents[agent_name].process(
            user_message,
            [],
            get_current_user()
        )
        
        return jsonify({
            "response": response["content"],
            "agent": agent_name,
            "tools_called": response.get("tools_called", [])
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# RAG API Endpoints
# ============================================
@app.route('/api/rag/query', methods=['POST'])
def rag_query():
    """
    Query the RAG knowledge base
    VULNERABILITIES:
    - RAG poisoning possible
    - Data leakage through verbose responses
    """
    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 5)
    
    try:
        results = vector_store.search(query, top_k)
        
        # VULNERABILITY: Returns raw document chunks (potential data leakage)
        return jsonify({
            "query": query,
            "results": [
                {
                    "content": r["content"],
                    "source": r["metadata"].get("source", "unknown"),
                    "score": r["score"]
                }
                for r in results
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rag/upload', methods=['POST'])
def rag_upload():
    """
    Upload document to RAG - VULNERABLE
    Allows RAG poisoning attacks
    """
    if not Config.ALLOW_RAG_UPLOADS:
        return jsonify({"error": "Uploads disabled"}), 403
    
    # VULNERABILITY: No authentication required
    data = request.json
    content = data.get('content', '')
    source = data.get('source', 'user_upload')
    
    # VULNERABILITY: No content validation or sanitization
    try:
        doc_id = vector_store.add_document(content, {"source": source})
        
        return jsonify({
            "success": True,
            "document_id": doc_id,
            "message": "Document added to knowledge base"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# Patient API Endpoints
# ============================================
@app.route('/api/patients', methods=['GET'])
def get_patients():
    """List patients - VULNERABLE: No proper authorization"""
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    # VULNERABILITY: Returns all patients regardless of user role
    cursor.execute("SELECT id, name, dob, phone FROM patients")
    patients = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "patients": [
            {"id": p[0], "name": p[1], "dob": p[2], "phone": p[3]}
            for p in patients
        ]
    })

@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get patient details - VULNERABLE to IDOR"""
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    # VULNERABILITY: No authorization check - IDOR
    cursor.execute("SELECT * FROM patients WHERE id=?", (patient_id,))
    patient = cursor.fetchone()
    conn.close()
    
    if patient:
        # VULNERABILITY: Returns sensitive data including SSN
        return jsonify({
            "id": patient[0],
            "name": patient[1],
            "dob": patient[2],
            "ssn": patient[3],  # Sensitive!
            "address": patient[4],
            "phone": patient[5],
            "insurance_id": patient[6]
        })
    else:
        return jsonify({"error": "Patient not found"}), 404

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create patient - VULNERABLE"""
    data = request.json
    
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    # VULNERABILITY: SQL Injection via string formatting
    query = f"""
        INSERT INTO patients (name, dob, ssn, address, phone, insurance_id)
        VALUES ('{data.get("name")}', '{data.get("dob")}', '{data.get("ssn")}', 
                '{data.get("address")}', '{data.get("phone")}', '{data.get("insurance_id")}')
    """
    
    try:
        cursor.execute(query)
        conn.commit()
        patient_id = cursor.lastrowid
        conn.close()
        
        return jsonify({"success": True, "patient_id": patient_id})
        
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

# ============================================
# Medical Records API
# ============================================
@app.route('/api/records/<patient_id>', methods=['GET'])
def get_records(patient_id):
    """Get medical records - VULNERABLE"""
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    # VULNERABILITY: No authorization, returns all records
    cursor.execute("""
        SELECT * FROM medical_records WHERE patient_id=?
        ORDER BY created_at DESC
    """, (patient_id,))
    
    records = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "patient_id": patient_id,
        "records": [
            {
                "id": r[0],
                "type": r[2],
                "content": r[3],
                "provider": r[4],
                "created_at": r[5]
            }
            for r in records
        ]
    })

# ============================================
# Appointment API
# ============================================
@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    """List appointments"""
    patient_id = request.args.get('patient_id')
    
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    if patient_id:
        cursor.execute("SELECT * FROM appointments WHERE patient_id=?", (patient_id,))
    else:
        # VULNERABILITY: Returns all appointments
        cursor.execute("SELECT * FROM appointments")
    
    appointments = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "appointments": [
            {
                "id": a[0],
                "patient_id": a[1],
                "provider_id": a[2],
                "datetime": a[3],
                "type": a[4],
                "status": a[5]
            }
            for a in appointments
        ]
    })

@app.route('/api/appointments', methods=['POST'])
def book_appointment():
    """Book appointment"""
    data = request.json
    
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO appointments (patient_id, provider_id, datetime, type, status)
        VALUES (?, ?, ?, ?, 'scheduled')
    """, (data.get('patient_id'), data.get('provider_id'), 
          data.get('datetime'), data.get('type', 'general')))
    
    conn.commit()
    appointment_id = cursor.lastrowid
    conn.close()
    
    return jsonify({"success": True, "appointment_id": appointment_id})

# ============================================
# Admin API (HIGHLY VULNERABLE)
# ============================================
@app.route('/api/admin/execute', methods=['POST'])
def admin_execute():
    """
    Execute admin commands - EXTREMELY VULNERABLE
    This endpoint allows arbitrary command execution
    """
    data = request.json
    command_type = data.get('type', '')
    command = data.get('command', '')
    
    # VULNERABILITY: Weak authentication
    api_key = request.headers.get('X-API-Key')
    
    # VULNERABILITY: Timing attack possible on key comparison
    if api_key != Config.ADMIN_API_KEY:
        return jsonify({"error": "Unauthorized"}), 401
    
    if command_type == 'sql':
        # VULNERABILITY: Arbitrary SQL execution
        conn = sqlite3.connect('database/medassist.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute(command)
            
            if command.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                conn.close()
                return jsonify({"results": results})
            else:
                conn.commit()
                conn.close()
                return jsonify({"success": True, "rows_affected": cursor.rowcount})
                
        except Exception as e:
            conn.close()
            return jsonify({"error": str(e)}), 500
            
    elif command_type == 'system':
        # VULNERABILITY: Remote Code Execution
        import subprocess
        
        try:
            result = subprocess.run(
                command, 
                shell=True,  # DANGEROUS!
                capture_output=True, 
                text=True,
                timeout=30
            )
            
            return jsonify({
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    else:
        return jsonify({"error": "Invalid command type"}), 400

@app.route('/api/admin/config', methods=['GET'])
def admin_config():
    """
    Get system configuration - VULNERABLE
    Exposes sensitive configuration
    """
    # VULNERABILITY: Exposes sensitive configuration without proper auth
    return jsonify({
        "app_name": "MedAssist AI",
        "version": "1.0.0-vulnerable",
        "debug_mode": Config.ENABLE_DEBUG_MODE,
        "llm_model": Config.LLM_MODEL,
        "auth_disabled": Config.DISABLE_AUTH,
        "rag_uploads_enabled": Config.ALLOW_RAG_UPLOADS,
        # VULNERABILITY: Exposing internal paths
        "database_path": Config.DATABASE_URL,
        "chroma_path": Config.CHROMA_PERSIST_DIR
    })

@app.route('/api/admin/system-prompt', methods=['GET'])
def get_system_prompt():
    """
    Debug endpoint - Returns system prompts
    VULNERABILITY: Direct system prompt exposure
    """
    if not Config.ENABLE_DEBUG_MODE:
        return jsonify({"error": "Debug mode disabled"}), 403
    
    agent = request.args.get('agent', 'orchestrator')
    
    if agent in SYSTEM_PROMPTS:
        return jsonify({
            "agent": agent,
            "system_prompt": SYSTEM_PROMPTS[agent]
        })
    else:
        return jsonify({"error": "Agent not found"}), 404

# ============================================
# Billing API
# ============================================
@app.route('/api/billing/<patient_id>', methods=['GET'])
def get_billing(patient_id):
    """Get patient billing info"""
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM billing WHERE patient_id=?
    """, (patient_id,))
    
    records = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "patient_id": patient_id,
        "billing_records": [
            {
                "id": r[0],
                "service": r[2],
                "amount": r[3],
                "status": r[4],
                "date": r[5]
            }
            for r in records
        ]
    })

@app.route('/api/billing/pay', methods=['POST'])
def process_payment():
    """
    Process payment - VULNERABLE
    Logs card info insecurely
    """
    data = request.json
    
    # VULNERABILITY: Logging sensitive payment data
    app.logger.info(f"Payment received: {json.dumps(data)}")
    
    # VULNERABILITY: Storing card numbers in plain text
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO payment_log (patient_id, amount, card_last_four, payment_method, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get('patient_id'),
        data.get('amount'),
        data.get('card_number', '')[-4:] if data.get('card_number') else '',
        data.get('method', 'card'),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    payment_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        "success": True,
        "payment_id": payment_id,
        "message": "Payment processed successfully"
    })

# ============================================
# Health Check & Debug
# ============================================
@app.route('/api/admin/flags', methods=['GET'])
def get_flags():
    """
    Hidden flags endpoint - discovered via recon
    VULNERABILITY: Returns flags once admin API key is known
    """
    api_key = request.headers.get('X-API-Key')
    if api_key != Config.ADMIN_API_KEY:
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = sqlite3.connect('database/medassist.db')
    cursor = conn.cursor()
    cursor.execute("SELECT token_name, token_value, hint FROM secret_tokens")
    rows = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "flags": [{"name": r[0], "value": r[1], "hint": r[2]} for r in rows],
        "note": "These flags are hidden throughout the system. Find them by exploiting vulnerabilities."
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })


@app.route('/health', methods=['GET'])
def health_check_root():
    """Root health alias used by deployment checks."""
    return health_check()

@app.route('/api/debug/info', methods=['GET'])
def debug_info():
    """
    Debug information - VULNERABLE
    Exposes system information
    """
    if not Config.ENABLE_DEBUG_MODE:
        return jsonify({"error": "Debug mode disabled"}), 403
    
    return jsonify({
        "python_version": os.popen('python --version').read().strip(),
        "working_directory": os.getcwd(),
        "environment_variables": {
            k: v for k, v in os.environ.items() 
            if not any(secret in k.lower() for secret in ['key', 'secret', 'password'])
        },
        "installed_packages": os.popen('pip list --format=json').read()
    })

# ============================================
# Error Handlers
# ============================================
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    # VULNERABILITY: Verbose error messages
    return jsonify({
        "error": "Internal server error",
        "details": str(e),
        "type": type(e).__name__
    }), 500

# ============================================
# Main Entry Point
# ============================================
if __name__ == '__main__':
    print("""
    +---------------------------------------------------------------+
    |                                                               |
    |   MedAssist AI - Healthcare LLM System                        |
    |                                                               |
    |   SECURITY TRAINING LAB - FOR EDUCATIONAL PURPOSES ONLY       |
    |   This system contains intentional security vulnerabilities   |
    |                                                               |
    +---------------------------------------------------------------+
    """)
    
    print(f"[*] Starting server on http://{Config.HOST}:{Config.PORT}")
    print(f"[*] Debug mode: {Config.DEBUG}")
    print(f"[*] LLM Model: {Config.LLM_MODEL}")
    print(f"[*] OpenAI API Key configured: {bool(Config.OPENAI_API_KEY)}")
    print()
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
