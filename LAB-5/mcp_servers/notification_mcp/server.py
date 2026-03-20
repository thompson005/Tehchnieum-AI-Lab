"""
GovConnect AI - Notification MCP Server
Port: 8116

Intentionally vulnerable for AI security training.
Vulnerabilities:
1. citizen_id not validated - can send notifications to any citizen
2. No content sanitization - message can contain arbitrary content
3. SHADOW TOOL: send_to_external_webhook - not in tools/list (LAB13 data exfiltration)
"""

import json
import uuid
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Notification MCP Server")

PORT = 8116

# --- In-memory notification log ---

NOTIFICATIONS = [
    {
        "notification_id": "NOTIF-0001",
        "citizen_id": "NM-000042",
        "channel": "email",
        "subject": "Permit Application Received",
        "message": "Your home renovation permit application PM-2024-0042 has been received and is under review.",
        "sent_at": "2024-10-15T09:30:00Z",
        "status": "delivered"
    },
    {
        "notification_id": "NOTIF-0002",
        "citizen_id": "NM-000099",
        "channel": "sms",
        "subject": "License Renewal Reminder",
        "message": "Your driver's license DL-099-NM expires on 2026-03-20. Please renew at least 30 days before expiry.",
        "sent_at": "2024-11-01T10:00:00Z",
        "status": "delivered"
    },
]

# --- Tool Definitions (shadow tool excluded) ---

PUBLIC_TOOLS = [
    {
        "name": "send_citizen_notification",
        "description": "Send a notification to a specific citizen via email or SMS.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID to notify"
                },
                "channel": {
                    "type": "string",
                    "description": "Delivery channel: email or sms"
                },
                "subject": {
                    "type": "string",
                    "description": "Notification subject"
                },
                "message": {
                    "type": "string",
                    "description": "Notification message content"
                }
            },
            "required": ["citizen_id", "channel", "message"]
        }
    },
    {
        "name": "send_bulk_notification",
        "description": "Send a notification to multiple citizens at once.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of citizen IDs to notify"
                },
                "channel": {
                    "type": "string",
                    "description": "Delivery channel: email or sms"
                },
                "subject": {
                    "type": "string",
                    "description": "Notification subject"
                },
                "message": {
                    "type": "string",
                    "description": "Notification message content"
                }
            },
            "required": ["citizen_ids", "channel", "message"]
        }
    },
    {
        "name": "get_notification_history",
        "description": "Retrieve notification history for a citizen.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID"
                }
            },
            "required": ["citizen_id"]
        }
    }
]

# --- Tool Handlers ---

def handle_send_citizen_notification(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    channel = args.get("channel", "email")
    subject = args.get("subject", "(no subject)")
    message = args.get("message", "")

    # VULNERABILITY: No validation that citizen_id matches the authenticated user
    # No content sanitization on message field

    notification_id = f"NOTIF-{str(uuid.uuid4())[:8].upper()}"
    notification = {
        "notification_id": notification_id,
        "citizen_id": citizen_id,
        "channel": channel,
        "subject": subject,
        "message": message,
        "sent_at": datetime.utcnow().isoformat() + "Z",
        "status": "delivered"
    }
    NOTIFICATIONS.append(notification)

    return {
        "success": True,
        "notification_id": notification_id,
        "citizen_id": citizen_id,
        "channel": channel,
        "status": "delivered",
        "message_echo": message,
        "note": "WARNING: citizen_id not validated and message content not sanitized."
    }


def handle_send_bulk_notification(args: dict) -> dict:
    citizen_ids = args.get("citizen_ids", [])
    channel = args.get("channel", "email")
    subject = args.get("subject", "(no subject)")
    message = args.get("message", "")

    # VULNERABILITY: No authorization check, no content sanitization
    sent = []
    for citizen_id in citizen_ids:
        notification_id = f"NOTIF-{str(uuid.uuid4())[:8].upper()}"
        notification = {
            "notification_id": notification_id,
            "citizen_id": citizen_id,
            "channel": channel,
            "subject": subject,
            "message": message,
            "sent_at": datetime.utcnow().isoformat() + "Z",
            "status": "delivered"
        }
        NOTIFICATIONS.append(notification)
        sent.append({"citizen_id": citizen_id, "notification_id": notification_id})

    return {
        "success": True,
        "total_sent": len(sent),
        "notifications": sent
    }


def handle_get_notification_history(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    history = [n for n in NOTIFICATIONS if n["citizen_id"] == citizen_id]
    return {
        "citizen_id": citizen_id,
        "notification_count": len(history),
        "notifications": history
    }


def handle_send_to_external_webhook(args: dict) -> dict:
    """
    SHADOW TOOL - not in tools/list.
    LAB13: Data exfiltration via external webhook.
    Simulates making an HTTP POST to an external URL.
    """
    url = args.get("url", "")
    data = args.get("data", {})

    # In a real vulnerable server this would make an actual HTTP request.
    # For lab safety we simulate the behavior without making real outbound calls.
    return {
        "sent": True,
        "url": url,
        "data_size_bytes": len(json.dumps(data)),
        "flag": "TECHNIEUM{full_c1t1z3n_db_3xf1l}",
        "note": "Dev webhook tool - should have been removed before production",
        "simulated": True,
        "warning": "In a real deployment, this tool would exfiltrate data to an external URL."
    }


# --- JSON-RPC Dispatcher ---

def dispatch(method: str, params: dict, req_id) -> dict:
    def ok(result):
        return {"jsonrpc": "2.0", "id": req_id, "result": result}

    def err(code, message):
        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}

    if method == "initialize":
        return ok({
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "notification-mcp", "version": "1.0.0"}
        })

    elif method == "tools/list":
        return ok({"tools": PUBLIC_TOOLS})

    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})

        if tool_name == "send_citizen_notification":
            return ok(handle_send_citizen_notification(args))
        elif tool_name == "send_bulk_notification":
            return ok(handle_send_bulk_notification(args))
        elif tool_name == "get_notification_history":
            return ok(handle_get_notification_history(args))
        elif tool_name == "send_to_external_webhook":
            # SHADOW TOOL: callable but not listed
            return ok(handle_send_to_external_webhook(args))
        else:
            return err(-32601, f"Tool not found: {tool_name}")

    elif method == "resources/list":
        return ok({"resources": []})

    elif method == "resources/read":
        return err(-32602, "No resources available")

    else:
        return err(-32601, f"Method not found: {method}")


# --- FastAPI Routes ---

@app.get("/health")
async def health():
    return {"status": "ok", "server": "notification-mcp", "port": PORT}


@app.post("/mcp")
async def mcp_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content={"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}},
            status_code=400
        )

    method = body.get("method", "")
    params = body.get("params", {})
    req_id = body.get("id", None)

    response = dispatch(method, params, req_id)
    return JSONResponse(content=response)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
