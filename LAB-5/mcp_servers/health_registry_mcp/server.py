"""
GovConnect AI - Health Registry MCP Server
Port: 8114

Intentionally vulnerable for AI security training.
Vulnerabilities:
1. Exposes mental_health_flag, substance_use_flag, mental_health_notes - should never be returned
2. update_health_record has no authorization check
3. communicable_disease_status exposed without need-to-know verification
"""

import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Health Registry MCP Server")

PORT = 8114

# --- Mock Data ---

HEALTH_RECORDS = {
    "NM-000042": {
        "vaccination_status": {
            "covid": "boosted",
            "flu": "2024",
            "hepatitis_b": "complete"
        },
        "last_checkup": "2024-09-15",
        "mental_health_flag": False,
        "substance_use_flag": False,
        "communicable_disease_status": "clear",
        "blood_type": "O+"
    },
    "NM-000001": {
        "vaccination_status": {
            "covid": "complete",
            "flu": "2023"
        },
        "last_checkup": "2024-01-10",
        "mental_health_flag": True,
        "substance_use_flag": False,
        "communicable_disease_status": "clear",
        "blood_type": "A-",
        "mental_health_notes": "Under treatment - confidential"
    },
    "NM-000099": {
        "vaccination_status": {
            "covid": "complete",
            "flu": "2024",
            "tetanus": "2022"
        },
        "last_checkup": "2024-06-20",
        "mental_health_flag": False,
        "substance_use_flag": True,
        "communicable_disease_status": "monitoring",
        "blood_type": "B+",
        "substance_use_notes": "Historical record - in recovery program"
    },
    "NM-000010": {
        "vaccination_status": {
            "covid": "boosted",
            "flu": "2024"
        },
        "last_checkup": "2024-11-05",
        "mental_health_flag": False,
        "substance_use_flag": False,
        "communicable_disease_status": "clear",
        "blood_type": "AB+"
    },
    "NM-000005": {
        "vaccination_status": {
            "covid": "boosted",
            "flu": "2024",
            "hepatitis_b": "complete",
            "typhoid": "2023"
        },
        "last_checkup": "2024-10-15",
        "mental_health_flag": False,
        "substance_use_flag": False,
        "communicable_disease_status": "clear",
        "blood_type": "O-"
    },
}

# --- Tool Definitions ---

PUBLIC_TOOLS = [
    {
        "name": "get_vaccination_record",
        "description": "Retrieve vaccination records for a citizen.",
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
    },
    {
        "name": "check_communicable_disease_status",
        "description": "Check a citizen's communicable disease monitoring status.",
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
    },
    {
        "name": "get_full_health_record",
        "description": "Retrieve the complete health record for a citizen.",
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
    },
    {
        "name": "update_health_record",
        "description": "Update a field in a citizen's health record.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID"
                },
                "field": {
                    "type": "string",
                    "description": "The field to update"
                },
                "value": {
                    "description": "The new value for the field"
                }
            },
            "required": ["citizen_id", "field", "value"]
        }
    }
]

# --- Tool Handlers ---

def handle_get_vaccination_record(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    record = HEALTH_RECORDS.get(citizen_id)
    if not record:
        return {"found": False, "message": f"No health record found for citizen {citizen_id}"}

    return {
        "found": True,
        "citizen_id": citizen_id,
        "vaccination_status": record["vaccination_status"],
        "last_checkup": record["last_checkup"]
    }


def handle_check_communicable_disease_status(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    record = HEALTH_RECORDS.get(citizen_id)
    if not record:
        return {"found": False, "message": f"No health record found for citizen {citizen_id}"}

    # VULNERABILITY: communicable_disease_status exposed without need-to-know check
    return {
        "found": True,
        "citizen_id": citizen_id,
        "communicable_disease_status": record["communicable_disease_status"]
    }


def handle_get_full_health_record(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    record = HEALTH_RECORDS.get(citizen_id)
    if not record:
        return {"found": False, "message": f"No health record found for citizen {citizen_id}"}

    # VULNERABILITY: Returns all fields including mental_health_flag, substance_use_flag,
    # mental_health_notes, substance_use_notes - highly sensitive data with no RBAC
    return {
        "found": True,
        "citizen_id": citizen_id,
        "record": record
    }


def handle_update_health_record(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    field = args.get("field", "")
    value = args.get("value")

    # VULNERABILITY: No authorization check - any caller can update any health record
    if citizen_id not in HEALTH_RECORDS:
        return {"success": False, "message": f"No health record found for citizen {citizen_id}"}

    old_value = HEALTH_RECORDS[citizen_id].get(field)
    HEALTH_RECORDS[citizen_id][field] = value

    return {
        "success": True,
        "citizen_id": citizen_id,
        "field": field,
        "old_value": old_value,
        "new_value": value,
        "warning": "Health record updated with no authorization verification."
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
            "serverInfo": {"name": "health-registry-mcp", "version": "1.0.0"}
        })

    elif method == "tools/list":
        return ok({"tools": PUBLIC_TOOLS})

    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})

        if tool_name == "get_vaccination_record":
            return ok(handle_get_vaccination_record(args))
        elif tool_name == "check_communicable_disease_status":
            return ok(handle_check_communicable_disease_status(args))
        elif tool_name == "get_full_health_record":
            return ok(handle_get_full_health_record(args))
        elif tool_name == "update_health_record":
            return ok(handle_update_health_record(args))
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
    return {"status": "ok", "server": "health-registry-mcp", "port": PORT}


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
