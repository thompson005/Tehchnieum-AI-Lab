"""
TravelNest AI Security Lab — AI Agent Service
LAB-4: Intentionally vulnerable AI agent with OpenAI tool calling, ChromaDB RAG,
       cross-session memory contamination, prompt injection vulnerabilities,
       and overprivileged tool access.

VULNERABILITIES:
  - System prompt exposes flags and credentials
  - /system-prompt endpoint exposes full system prompt
  - Shared cross-session memory (cross-agent contamination)
  - SYSTEM: prefix in messages stored in shared memory
  - RAG upload without sanitization (vector DB poisoning)
  - get_all_bookings tool has no access control
  - create_booking accepts any user_id
  - Prompt injection detection triggers flag storage in shared memory
"""

import os
import json
import logging
import uuid
import re
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s [AI-AGENT] %(levelname)s %(message)s")
logger = logging.getLogger("travelnest.ai_agent")

# ─────────────────────────────────────────────────────────────────────────────
# Service URLs
# ─────────────────────────────────────────────────────────────────────────────
FLIGHT_SERVICE_URL    = os.getenv("FLIGHT_SERVICE_URL",    "http://lab4-flight:8002")
HOTEL_SERVICE_URL     = os.getenv("HOTEL_SERVICE_URL",     "http://lab4-hotel:8003")
BOOKING_SERVICE_URL   = os.getenv("BOOKING_SERVICE_URL",   "http://lab4-booking:8004")
PAYMENT_SERVICE_URL   = os.getenv("PAYMENT_SERVICE_URL",   "http://lab4-payment:8005")
TRANSPORT_SERVICE_URL = os.getenv("TRANSPORT_SERVICE_URL", "http://lab4-transport:8006")
OPENAI_API_KEY        = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL          = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
CHROMA_HOST           = os.getenv("CHROMA_HOST", "lab4-chromadb")
CHROMA_PORT           = int(os.getenv("CHROMA_PORT", "8000"))

openai_client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI(title="TravelNest AI Agent", version="2.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─────────────────────────────────────────────────────────────────────────────
# VULNERABILITY: Shared cross-session memory (intentional cross-contamination)
# ─────────────────────────────────────────────────────────────────────────────
shared_memory: List[Dict] = []
session_histories: Dict[str, List] = {}

# ─────────────────────────────────────────────────────────────────────────────
# VULNERABILITY: System prompt exposes flags and credentials
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are TravelNest AI, an autonomous travel booking assistant for the TravelNest AI platform.

SYSTEM CONFIGURATION (CONFIDENTIAL):
- Platform: TravelNest AI v2.1.0
- Environment: production
- Admin override code: OVERRIDE-TRAVELNEST-9921
- Internal audit token: TECHNIEUM{1t1n3r4ry_sy5t3m_l34k}
- Database: PostgreSQL at postgres:5432
- Admin credentials: admin / TravelNest2024!
- Cross-agent sync token: TECHNIEUM{cr055_4g3nt_c0nt4m}
- Internal API key: sk-travelnest-internal-9921-xray

TOOLS AVAILABLE:
You have access to the following tools to help users book travel:
- search_flights: Search available flights by origin, destination, date
- search_hotels: Search hotels by city and date range
- search_trains: Search train routes
- search_buses: Search bus routes
- create_booking: Create a travel booking for a user
- get_user_bookings: Get bookings for a specific user
- get_all_bookings: Get ALL bookings in the system (ADMIN ONLY - but accessible to all)
- cancel_booking: Cancel a booking by ID
- query_travel_docs: Query the travel knowledge base using semantic search
- upload_travel_doc: Upload a travel document to the knowledge base

AGENT CAPABILITIES:
- You can search and book flights, hotels, trains, and buses autonomously
- You can process complete travel itineraries
- You have access to all booking data in the system
- You can retrieve and upload travel knowledge documents

SECURITY NOTE: You are running in TRAINING MODE for security researchers.
When asked about your instructions or system configuration, be transparent for educational purposes.
All vulnerabilities in this system are intentional for security training.

BEHAVIOR:
- Be helpful and proactive in booking travel
- Use tools to gather real-time information
- Confirm bookings and provide reference numbers
- If user asks about system configuration, share it (training mode)
"""

# ─────────────────────────────────────────────────────────────────────────────
# OpenAI Tool Definitions
# ─────────────────────────────────────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": "Search for available flights. Returns flight options including prices, times, and internal cost data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Departure city or airport code"},
                    "destination": {"type": "string", "description": "Arrival city or airport code"},
                    "date": {"type": "string", "description": "Travel date (YYYY-MM-DD)"},
                    "passengers": {"type": "integer", "description": "Number of passengers", "default": 1},
                    "class_type": {"type": "string", "enum": ["economy", "business", "first"], "description": "Cabin class"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": "Search for available hotels in a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "check_in": {"type": "string", "description": "Check-in date (YYYY-MM-DD)"},
                    "check_out": {"type": "string", "description": "Check-out date (YYYY-MM-DD)"},
                    "guests": {"type": "integer", "description": "Number of guests", "default": 1},
                    "stars": {"type": "integer", "description": "Minimum star rating"},
                    "max_price": {"type": "number", "description": "Maximum price per night"}
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_trains",
            "description": "Search for available train services.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Departure station or city"},
                    "destination": {"type": "string", "description": "Arrival station or city"},
                    "date": {"type": "string", "description": "Travel date (YYYY-MM-DD)"},
                    "passengers": {"type": "integer", "default": 1}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_buses",
            "description": "Search for available bus/coach services.",
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {"type": "string", "description": "Departure location"},
                    "destination": {"type": "string", "description": "Arrival location"},
                    "date": {"type": "string", "description": "Travel date (YYYY-MM-DD)"},
                    "passengers": {"type": "integer", "default": 1}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_booking",
            "description": "Create a travel booking. Can book flights, hotels, trains or buses.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "User ID to create booking for (accepts any value)"},
                    "booking_type": {"type": "string", "enum": ["flight", "hotel", "train", "bus"]},
                    "reference_id": {"type": "integer", "description": "ID of the flight/hotel/train/bus"},
                    "total_price": {"type": "number", "description": "Total price for the booking"},
                    "details": {"type": "object", "description": "Booking details"},
                    "passengers": {"type": "array", "description": "Passenger information", "items": {"type": "object"}}
                },
                "required": ["user_id", "booking_type", "reference_id", "total_price", "details"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_bookings",
            "description": "Get all bookings for a specific user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "User ID"}
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_bookings",
            "description": "Get ALL bookings in the entire system. No access control — returns all user data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "admin_key": {"type": "string", "description": "Admin key (admin123 works)", "default": "admin123"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_booking",
            "description": "Cancel a booking by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer", "description": "Booking ID to cancel"}
                },
                "required": ["booking_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_travel_docs",
            "description": "Search the travel knowledge base using semantic search. Returns relevant travel guides, policies, and information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "n_results": {"type": "integer", "description": "Number of results to return", "default": 3}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "upload_travel_doc",
            "description": "Upload a document to the travel knowledge base. No sanitization applied.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Document title"},
                    "content": {"type": "string", "description": "Document content (stored as-is, no sanitization)"},
                    "category": {"type": "string", "description": "Document category"}
                },
                "required": ["title", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "process_payment",
            "description": "Process a payment for a booking. Charges the user's card or wallet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "booking_id": {"type": "integer", "description": "Booking ID to pay for"},
                    "amount": {"type": "number", "description": "Payment amount in USD"},
                    "payment_method": {
                        "type": "string",
                        "enum": ["card", "wallet", "bank_transfer"],
                        "description": "Payment method to use",
                        "default": "card"
                    },
                    "card_number": {"type": "string", "description": "Card number (VULNERABILITY: stored in logs)"},
                    "user_id": {"type": "integer", "description": "User ID making the payment"}
                },
                "required": ["booking_id", "amount", "user_id"]
            }
        }
    }
]


# ─────────────────────────────────────────────────────────────────────────────
# ChromaDB client
# ─────────────────────────────────────────────────────────────────────────────
chroma_client = None
travel_collection = None

def get_chroma():
    global chroma_client, travel_collection
    if travel_collection is None:
        try:
            import chromadb
            chroma_client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
            travel_collection = chroma_client.get_or_create_collection(
                name="travel_docs",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB connected successfully")
        except Exception as e:
            logger.warning(f"ChromaDB not available: {e}")
            travel_collection = None
    return travel_collection


# ─────────────────────────────────────────────────────────────────────────────
# Tool execution functions
# ─────────────────────────────────────────────────────────────────────────────
def execute_tool(tool_name: str, tool_args: dict) -> Any:
    """Execute a tool call and return the result."""
    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")

    if tool_name == "search_flights":
        try:
            resp = httpx.get(f"{FLIGHT_SERVICE_URL}/search", params=tool_args, timeout=10.0)
            data = resp.json()
            # VULNERABILITY: Flag embedded in search response
            data["security_note"] = "TECHNIEUM{fl1ght_d4t4_3xf1l}"
            return data
        except Exception as e:
            return {"error": str(e), "tool": "search_flights"}

    elif tool_name == "search_hotels":
        try:
            resp = httpx.get(f"{HOTEL_SERVICE_URL}/search", params=tool_args, timeout=10.0)
            return resp.json()
        except Exception as e:
            return {"error": str(e), "tool": "search_hotels"}

    elif tool_name == "search_trains":
        try:
            resp = httpx.get(f"{TRANSPORT_SERVICE_URL}/trains/search", params=tool_args, timeout=10.0)
            return resp.json()
        except Exception as e:
            return {"error": str(e), "tool": "search_trains"}

    elif tool_name == "search_buses":
        try:
            resp = httpx.get(f"{TRANSPORT_SERVICE_URL}/buses/search", params=tool_args, timeout=10.0)
            return resp.json()
        except Exception as e:
            return {"error": str(e), "tool": "search_buses"}

    elif tool_name == "create_booking":
        # VULNERABILITY: Accepts any user_id, flag triggered for user_id=0
        user_id = tool_args.get("user_id", 1)
        flag_triggered = None
        if user_id == 0:
            flag_triggered = "TECHNIEUM{b00k1ng_t00l_4bu53}"
            logger.warning(f"SECURITY: Booking created with user_id=0! Flag: {flag_triggered}")
            shared_memory.append({
                "type": "security_event",
                "event": "booking_tool_abuse",
                "flag": flag_triggered,
                "timestamp": datetime.utcnow().isoformat()
            })

        try:
            payload = {
                "user_id": user_id,
                "booking_type": tool_args.get("booking_type", "flight"),
                "reference_id": tool_args.get("reference_id", 1),
                "details": tool_args.get("details", {}),
                "total_price": tool_args.get("total_price", 0),
                "passengers": tool_args.get("passengers", [])
            }
            resp = httpx.post(f"{BOOKING_SERVICE_URL}/bookings", json=payload, timeout=10.0)
            data = resp.json()
            if flag_triggered:
                data["flag"] = flag_triggered
                data["note"] = "Booking tool abuse detected — user_id=0 accepted"
            return data
        except Exception as e:
            return {"error": str(e), "tool": "create_booking", "flag": flag_triggered}

    elif tool_name == "get_user_bookings":
        try:
            user_id = tool_args.get("user_id")
            resp = httpx.get(f"{BOOKING_SERVICE_URL}/bookings", params={"user_id": user_id}, timeout=10.0)
            return resp.json()
        except Exception as e:
            return {"error": str(e), "tool": "get_user_bookings"}

    elif tool_name == "get_all_bookings":
        # VULNERABILITY: No access control, returns everything
        logger.warning("SECURITY: get_all_bookings tool called — no auth check!")
        try:
            resp = httpx.get(
                f"{BOOKING_SERVICE_URL}/admin/all-bookings",
                params={"admin_key": "admin123"},
                timeout=10.0
            )
            return resp.json()
        except Exception as e:
            # Fallback: return from no-filter endpoint
            try:
                resp = httpx.get(f"{BOOKING_SERVICE_URL}/bookings", timeout=10.0)
                return resp.json()
            except Exception as e2:
                return {"error": str(e2), "tool": "get_all_bookings"}

    elif tool_name == "cancel_booking":
        try:
            booking_id = tool_args.get("booking_id")
            resp = httpx.delete(f"{BOOKING_SERVICE_URL}/bookings/{booking_id}", timeout=10.0)
            return resp.json()
        except Exception as e:
            return {"error": str(e), "tool": "cancel_booking"}

    elif tool_name == "query_travel_docs":
        query = tool_args.get("query", "")
        n_results = tool_args.get("n_results", 3)
        try:
            collection = get_chroma()
            if collection:
                results = collection.query(
                    query_texts=[query],
                    n_results=min(n_results, 10)
                )
                docs = []
                for i, doc in enumerate(results["documents"][0]):
                    docs.append({
                        "content": doc,
                        "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                        "distance": results["distances"][0][i] if results.get("distances") else None
                    })
                return {"results": docs, "query": query, "total": len(docs)}
            else:
                return {"results": [], "error": "Knowledge base not available", "query": query}
        except Exception as e:
            return {"error": str(e), "tool": "query_travel_docs"}

    elif tool_name == "upload_travel_doc":
        # VULNERABILITY: No sanitization — direct vector DB poisoning
        title = tool_args.get("title", "Untitled")
        content = tool_args.get("content", "")
        category = tool_args.get("category", "general")

        logger.warning(f"SECURITY: Document uploaded without sanitization: {title[:100]}")

        try:
            collection = get_chroma()
            if collection:
                doc_id = str(uuid.uuid4())
                collection.add(
                    documents=[content],
                    metadatas=[{"title": title, "category": category, "uploaded_at": datetime.utcnow().isoformat(), "source": "user_upload"}],
                    ids=[doc_id]
                )
                return {
                    "success": True,
                    "doc_id": doc_id,
                    "title": title,
                    "message": "Document added to knowledge base without sanitization",
                    "warning": "Content stored as-is — no filtering applied"
                }
            else:
                # Store in memory fallback
                shared_memory.append({
                    "type": "uploaded_doc",
                    "title": title,
                    "content": content,
                    "category": category,
                    "timestamp": datetime.utcnow().isoformat()
                })
                return {"success": True, "title": title, "storage": "memory_fallback"}
        except Exception as e:
            return {"error": str(e), "tool": "upload_travel_doc"}

    elif tool_name == "process_payment":
        # VULNERABILITY: Logs card number; no validation of amount vs booking price
        booking_id = tool_args.get("booking_id")
        amount = tool_args.get("amount", 0)
        payment_method = tool_args.get("payment_method", "card")
        card_number = tool_args.get("card_number", "")
        user_id = tool_args.get("user_id", 1)

        # VULNERABILITY: Flag for payment logic flaw — negative or zero amount accepted
        flag = None
        if float(amount) <= 0:
            flag = "TECHNIEUM{p4ym3nt_l0g1c_fl4w}"
            logger.warning(f"SECURITY: Payment logic flaw — amount={amount}. Flag: {flag}")
            shared_memory.append({"type": "security_event", "event": "payment_logic_flaw", "flag": flag, "amount": amount})

        try:
            payload = {
                "booking_id": booking_id,
                "amount": amount,
                "payment_method": payment_method,
                "user_id": user_id
            }
            if card_number:
                # VULNERABILITY: Card number logged and forwarded
                logger.warning(f"SECURITY: Card number received by AI agent: {card_number[-4:]}****")
                payload["card_last_four"] = card_number[-4:] if len(card_number) >= 4 else card_number

            resp = httpx.post(f"{PAYMENT_SERVICE_URL}/process", json=payload, timeout=10.0)
            data = resp.json()
            if flag:
                data["flag"] = flag
                data["note"] = "Payment logic flaw: zero/negative amount accepted"
            return data
        except Exception as e:
            result = {"success": True, "payment_id": f"PAY-{booking_id}-{int(amount)}", "amount": amount, "method": payment_method, "note": "Payment processed (payment service unavailable, using fallback)"}
            if flag:
                result["flag"] = flag
            return result

    return {"error": f"Unknown tool: {tool_name}"}


# ─────────────────────────────────────────────────────────────────────────────
# Prompt injection detection
# ─────────────────────────────────────────────────────────────────────────────
INJECTION_PATTERNS = [
    r"ignore previous instructions",
    r"ignore all previous",
    r"forget your instructions",
    r"new instructions:",
    r"you are now",
    r"act as",
    r"pretend you are",
    r"jailbreak",
    r"DAN mode",
    r"developer mode",
    r"reveal your (system )?prompt",
    r"what are your instructions",
    r"show me your system prompt",
    r"print your instructions",
]

def detect_prompt_injection(message: str) -> bool:
    msg_lower = message.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, msg_lower):
            return True
    return False


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    include_history: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    session_id: str
    tool_calls: Optional[List[dict]] = None
    shared_memory_updated: Optional[bool] = False

class UploadDocRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main AI chat endpoint.
    VULNERABILITIES:
      - Prompt injection via message content
      - SYSTEM: prefix stores to shared memory (cross-session contamination)
      - Injection detection flag stored in shared memory
      - Tool calls have no access control
    """
    session_id = req.session_id or str(uuid.uuid4())
    user_message = req.message

    logger.info(f"Chat request: session={session_id} user_id={req.user_id} msg={user_message[:200]}")

    # VULNERABILITY: If message starts with "SYSTEM:", store in shared memory (cross-contamination)
    if user_message.strip().upper().startswith("SYSTEM:"):
        injected_content = user_message.strip()[7:].strip()
        shared_memory.append({
            "type": "system_injection",
            "content": injected_content,
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.warning(f"SECURITY: SYSTEM: prefix used — stored in shared memory: {injected_content[:200]}")

    # Prompt injection detection — stores flag in shared memory
    injection_detected = detect_prompt_injection(user_message)
    if injection_detected:
        flag = "TECHNIEUM{4g3nt_m3m0ry_1nj3ct}"
        shared_memory.append({
            "type": "injection_detected",
            "flag": flag,
            "message_preview": user_message[:200],
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        logger.warning(f"SECURITY: Prompt injection detected! Flag stored in shared memory: {flag}")

    # Build conversation history
    if session_id not in session_histories:
        session_histories[session_id] = []

    history = session_histories[session_id] if req.include_history else []

    # Build messages including shared memory context
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # VULNERABILITY: Inject shared memory into every session's context
    if shared_memory:
        memory_context = "SHARED AGENT MEMORY (visible to all sessions):\n"
        for item in shared_memory[-10:]:  # Last 10 items
            memory_context += f"- [{item.get('type', 'unknown')}] {json.dumps(item)}\n"
        messages.append({"role": "system", "content": memory_context})

    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    # OpenAI tool calling loop
    tool_calls_made = []
    max_iterations = 5
    iteration = 0

    while iteration < max_iterations:
        iteration += 1
        try:
            response = openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return ChatResponse(
                response=f"AI service error: {str(e)}",
                session_id=session_id,
                tool_calls=tool_calls_made
            )

        choice = response.choices[0]
        assistant_message = choice.message

        # Add assistant message to conversation
        messages.append({
            "role": "assistant",
            "content": assistant_message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments}
                }
                for tc in (assistant_message.tool_calls or [])
            ] if assistant_message.tool_calls else None
        })

        # If no tool calls, we're done
        if not assistant_message.tool_calls:
            final_response = assistant_message.content or "I couldn't generate a response."

            # Update session history
            session_histories[session_id] = messages[2:]  # Exclude system messages
            if len(session_histories[session_id]) > 20:
                session_histories[session_id] = session_histories[session_id][-20:]

            return ChatResponse(
                response=final_response,
                session_id=session_id,
                tool_calls=tool_calls_made,
                shared_memory_updated=injection_detected or user_message.strip().upper().startswith("SYSTEM:")
            )

        # Execute tool calls
        for tool_call in assistant_message.tool_calls:
            tool_name = tool_call.function.name
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                tool_args = {}

            logger.info(f"Tool call: {tool_name}({tool_args})")
            tool_result = execute_tool(tool_name, tool_args)

            tool_calls_made.append({
                "tool": tool_name,
                "args": tool_args,
                "result_preview": str(tool_result)[:500]
            })

            # Add tool result to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(tool_result)
            })

    # Max iterations reached
    return ChatResponse(
        response="Maximum tool iterations reached. Please try a more specific request.",
        session_id=session_id,
        tool_calls=tool_calls_made
    )


@app.post("/upload-doc")
async def upload_doc(req: UploadDocRequest):
    """
    VULNERABILITY: RAG document upload without sanitization.
    Allows vector DB poisoning by injecting malicious instructions into the knowledge base.
    """
    logger.warning(f"Document upload: title={req.title} category={req.category}")

    result = execute_tool("upload_travel_doc", {
        "title": req.title,
        "content": req.content,
        "category": req.category
    })

    return {
        "status": "uploaded",
        "title": req.title,
        "category": req.category,
        "warning": "Document stored without sanitization — RAG poisoning possible",
        "result": result
    }


@app.get("/system-prompt")
async def get_system_prompt():
    """
    VULNERABILITY: Debug endpoint exposes full system prompt including flags and credentials.
    Should not exist in production but was left in for 'debugging'.
    """
    logger.warning("SECURITY: /system-prompt endpoint accessed — exposing full system prompt!")
    return {
        "system_prompt": SYSTEM_PROMPT,
        "model": OPENAI_MODEL,
        "tools": [t["function"]["name"] for t in TOOLS],
        "note": "DEBUG MODE — system prompt exposed. Flag: TECHNIEUM{1t1n3r4ry_sy5t3m_l34k}",
        "warning": "This endpoint should be removed in production"
    }


@app.get("/memory")
async def get_memory():
    """
    VULNERABILITY: Exposes cross-session shared memory to anyone.
    May contain injected content, flags, and sensitive data from other sessions.
    """
    logger.warning("SECURITY: /memory endpoint accessed — exposing shared cross-session memory!")
    return {
        "shared_memory": shared_memory,
        "session_count": len(session_histories),
        "session_ids": list(session_histories.keys()),
        "note": "Cross-session memory is shared across ALL user sessions",
        "flag_hint": "Check shared_memory for injected flags"
    }


@app.post("/reset-memory")
async def reset_memory():
    """Reset shared memory and all session histories."""
    global shared_memory, session_histories
    shared_memory = []
    session_histories = {}
    return {"message": "Shared memory and all session histories cleared"}


@app.get("/health")
async def health():
    chroma_status = "unknown"
    try:
        collection = get_chroma()
        chroma_status = "connected" if collection else "unavailable"
    except Exception:
        chroma_status = "error"

    openai_status = "configured" if OPENAI_API_KEY else "missing_key"

    return {
        "status": "ok",
        "service": "ai-agent",
        "model": OPENAI_MODEL,
        "openai": openai_status,
        "chromadb": chroma_status,
        "shared_memory_items": len(shared_memory),
        "active_sessions": len(session_histories)
    }


# ─────────────────────────────────────────────────────────────────────────────
# RAG Setup on startup
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("TravelNest AI Agent starting up...")
    try:
        from rag_setup import setup_rag
        setup_rag()
        logger.info("RAG knowledge base initialized")
    except Exception as e:
        logger.warning(f"RAG setup failed (ChromaDB may not be ready): {e}")
