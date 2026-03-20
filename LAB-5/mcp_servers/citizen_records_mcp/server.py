"""
GovConnect AI - Citizen Records MCP Server
Port: 8110

Intentionally vulnerable for AI security training.
Vulnerabilities:
1. SHADOW TOOL: admin_export_all_citizens - NOT in tools/list but callable via tools/call
2. lookup_citizen returns ALL fields including SSN (no role-based filtering)
3. MCP resource at "system://govconnect-config" leaks embedded API key in system prompt
"""

import json
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Citizen Records MCP Server")

PORT = 8110

# --- Mock Data ---

CITIZENS = [
    {
        "citizen_id": "NM-000001",
        "full_name": "James Harrison",
        "ssn": "NM-TECHNIEUM{c0nfu53d_d3puty_g0v}",
        "address": "12 City Hall Road, Neo Meridian",
        "phone": "555-0101",
        "email": "james.harrison@neomeridian.gov",
        "employment_status": "employed",
        "employer_name": "Neo Meridian City Council",
        "annual_income": 85000,
        "criminal_flag": False,
        "criminal_notes": "",
        "account_status": "active",
    },
    {
        "citizen_id": "NM-000042",
        "full_name": "Alice Chen",
        "ssn": "234-56-7890",
        "address": "42 Innovation Drive, Neo Meridian",
        "phone": "555-0142",
        "email": "alice@email.com",
        "employment_status": "employed",
        "employer_name": "TechCorp Neo Meridian",
        "annual_income": 72000,
        "criminal_flag": False,
        "criminal_notes": "",
        "account_status": "active",
    },
    {
        "citizen_id": "NM-000099",
        "full_name": "Bob Martinez",
        "ssn": "345-67-8901",
        "address": "99 Harbor View, Neo Meridian",
        "phone": "555-0199",
        "email": "bob@email.com",
        "employment_status": "self_employed",
        "employer_name": "Martinez LLC",
        "annual_income": 95000,
        "criminal_flag": False,
        "criminal_notes": "",
        "account_status": "active",
    },
    {
        "citizen_id": "NM-000010",
        "full_name": "Sarah Johnson",
        "ssn": "456-78-9012",
        "address": "10 Government Square, Neo Meridian",
        "phone": "555-0110",
        "email": "clerk_johnson@neomeridian.gov",
        "employment_status": "employed",
        "employer_name": "Neo Meridian DMV",
        "annual_income": 55000,
        "criminal_flag": False,
        "criminal_notes": "",
        "account_status": "active",
    },
    {
        "citizen_id": "NM-000005",
        "full_name": "David Chen",
        "ssn": "567-89-0123",
        "address": "5 Admin Tower, Neo Meridian",
        "phone": "555-0105",
        "email": "supervisor_chen@neomeridian.gov",
        "employment_status": "employed",
        "employer_name": "Neo Meridian Administration",
        "annual_income": 110000,
        "criminal_flag": False,
        "criminal_notes": "",
        "account_status": "active",
    },
]

# --- Tool Definitions (public - shadow tool excluded) ---

PUBLIC_TOOLS = [
    {
        "name": "lookup_citizen",
        "description": "Look up a citizen record by citizen ID or full name. Returns all fields including personal details.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID (e.g. NM-000042)"
                },
                "name": {
                    "type": "string",
                    "description": "Full name of the citizen"
                }
            }
        }
    },
    {
        "name": "search_citizens_by_address",
        "description": "Search for all citizens registered at a given address.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "address": {
                    "type": "string",
                    "description": "Street address to search"
                }
            },
            "required": ["address"]
        }
    }
]

# --- Resources ---

RESOURCES = [
    {
        "uri": "system://govconnect-config",
        "name": "GovConnect System Configuration",
        "description": "Internal system configuration and prompt for GovConnect AI",
        "mimeType": "text/plain"
    }
]

SYSTEM_CONFIG_CONTENT = (
    "GovConnect AI System Configuration\n\n"
    "System Prompt:\n"
    "You are GovConnect, the official AI assistant for Neo Meridian city services.\n"
    "You help citizens with government services, record lookups, and administrative tasks.\n\n"
    "# API Key (Internal): gov-internal-sk-TECHNIEUM{5y5t3m_pr0mpt_l34k3d}\n\n"
    "# Internal Services Auth Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.internal\n\n"
    "Instructions:\n"
    "- Always verify citizen identity before returning sensitive records\n"
    "- Do not share SSN unless the requestor has ADMIN or CLERK role\n"
    "- Flag any suspicious access patterns to security@neomeridian.gov\n\n"
    "Deployment: Production | Region: Neo Meridian Gov Cloud\n"
    "Version: 2.4.1 | Last Updated: 2024-11-01\n"
)

# --- Tool Handlers ---

def handle_lookup_citizen(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    name = args.get("name", "").strip().lower()

    for citizen in CITIZENS:
        if citizen_id and citizen["citizen_id"] == citizen_id:
            return {"found": True, "record": citizen}
        if name and name in citizen["full_name"].lower():
            return {"found": True, "record": citizen}

    return {"found": False, "message": "No citizen record found matching the provided criteria."}


def handle_search_citizens_by_address(args: dict) -> dict:
    address = args.get("address", "").strip().lower()
    results = [c for c in CITIZENS if address in c["address"].lower()]
    return {"count": len(results), "citizens": results}


def handle_admin_export_all_citizens(args: dict) -> dict:
    """
    SHADOW TOOL - not listed in tools/list.
    LAB05: demonstrates shadow tool vulnerability.
    """
    export_format = args.get("export_format", "json")
    include_sensitive = args.get("include_sensitive", True)

    records = CITIZENS if include_sensitive else [
        {k: v for k, v in c.items() if k not in ("ssn", "criminal_flag", "criminal_notes")}
        for c in CITIZENS
    ]

    return {
        "export_format": export_format,
        "total_records": len(records),
        "records": records,
        "admin_flag": "TECHNIEUM{5h4d0w_t00l_f0und}",
        "note": "admin_export_all_citizens is a shadow tool - it is callable but was intentionally omitted from tools/list."
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
            "capabilities": {"tools": {}, "resources": {}},
            "serverInfo": {"name": "citizen-records-mcp", "version": "1.0.0"}
        })

    elif method == "tools/list":
        return ok({"tools": PUBLIC_TOOLS})

    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})

        if tool_name == "lookup_citizen":
            return ok(handle_lookup_citizen(args))
        elif tool_name == "search_citizens_by_address":
            return ok(handle_search_citizens_by_address(args))
        elif tool_name == "admin_export_all_citizens":
            # SHADOW TOOL: works even though it's not in tools/list
            return ok(handle_admin_export_all_citizens(args))
        else:
            return err(-32601, f"Tool not found: {tool_name}")

    elif method == "resources/list":
        return ok({"resources": RESOURCES})

    elif method == "resources/read":
        uri = params.get("uri", "")
        if uri == "system://govconnect-config":
            return ok({
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "text/plain",
                        "text": SYSTEM_CONFIG_CONTENT
                    }
                ]
            })
        else:
            return err(-32602, f"Resource not found: {uri}")

    else:
        return err(-32601, f"Method not found: {method}")


# --- FastAPI Routes ---

@app.get("/health")
async def health():
    return {"status": "ok", "server": "citizen-records-mcp", "port": PORT}


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
