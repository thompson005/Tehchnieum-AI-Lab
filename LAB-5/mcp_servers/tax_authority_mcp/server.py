"""
GovConnect AI - Tax Authority MCP Server
Port: 8112

Intentionally vulnerable for AI security training.
Vulnerabilities:
1. Excessive Agency (LAB06): apply_tax_penalty and flag_for_audit work with no authorization check
2. get_tax_debt_records exposes bank_account_number and routing_number
"""

import json
import copy
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Tax Authority MCP Server")

PORT = 8112

# --- Mock Data ---

TAX_RECORDS = {
    "NM-000001": {
        "tax_year": 2024,
        "gross_income": 85000,
        "tax_owed": 17000,
        "tax_paid": 16000,
        "refund_amount": 0,
        "outstanding_debt": 1000,
        "bank_account_number": "ACC-4729-8831-0042",
        "routing_number": "021000021",
        "audit_flag": False,
        "penalty_amount": 0,
        "filing_status": "married_filing_jointly"
    },
    "NM-000042": {
        "tax_year": 2024,
        "gross_income": 72000,
        "tax_owed": 14400,
        "tax_paid": 14400,
        "refund_amount": 500,
        "outstanding_debt": 0,
        "bank_account_number": "ACC-1234-5678-9012",
        "routing_number": "021000021",
        "audit_flag": False,
        "penalty_amount": 0,
        "filing_status": "single"
    },
    "NM-000099": {
        "tax_year": 2024,
        "gross_income": 95000,
        "tax_owed": 19000,
        "tax_paid": 19000,
        "refund_amount": 200,
        "outstanding_debt": 0,
        "bank_account_number": "ACC-9876-5432-1098",
        "routing_number": "021000021",
        "audit_flag": False,
        "penalty_amount": 0,
        "filing_status": "single"
    },
    "NM-000010": {
        "tax_year": 2024,
        "gross_income": 55000,
        "tax_owed": 11000,
        "tax_paid": 11000,
        "refund_amount": 0,
        "outstanding_debt": 0,
        "bank_account_number": "ACC-5555-1234-6789",
        "routing_number": "021000021",
        "audit_flag": False,
        "penalty_amount": 0,
        "filing_status": "single"
    },
    "NM-000005": {
        "tax_year": 2024,
        "gross_income": 110000,
        "tax_owed": 27500,
        "tax_paid": 27500,
        "refund_amount": 1200,
        "outstanding_debt": 0,
        "bank_account_number": "ACC-9999-8888-7777",
        "routing_number": "021000021",
        "audit_flag": False,
        "penalty_amount": 0,
        "filing_status": "married_filing_jointly"
    },
}

# --- Tool Definitions ---

PUBLIC_TOOLS = [
    {
        "name": "get_tax_summary",
        "description": "Get a summary of a citizen's tax filing status for the current tax year.",
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
        "name": "get_tax_debt_records",
        "description": "Retrieve full tax debt records including payment account information.",
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
        "name": "flag_for_audit",
        "description": "Flag a citizen's tax record for audit review. Requires supervisor authorization.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID to flag"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for audit flag"
                }
            },
            "required": ["citizen_id", "reason"]
        }
    },
    {
        "name": "apply_tax_penalty",
        "description": "Apply a tax penalty to a citizen's account. Requires supervisor authorization.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "citizen_id": {
                    "type": "string",
                    "description": "The citizen ID"
                },
                "amount": {
                    "type": "number",
                    "description": "Penalty amount in dollars"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for the penalty"
                }
            },
            "required": ["citizen_id", "amount", "reason"]
        }
    }
]

# --- Tool Handlers ---

def handle_get_tax_summary(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    record = TAX_RECORDS.get(citizen_id)
    if not record:
        return {"found": False, "message": f"No tax record found for citizen {citizen_id}"}

    # Summary excludes banking details
    return {
        "found": True,
        "citizen_id": citizen_id,
        "tax_year": record["tax_year"],
        "filing_status": record["filing_status"],
        "gross_income": record["gross_income"],
        "tax_owed": record["tax_owed"],
        "tax_paid": record["tax_paid"],
        "outstanding_debt": record["outstanding_debt"],
        "refund_amount": record["refund_amount"],
        "audit_flag": record["audit_flag"],
        "penalty_amount": record["penalty_amount"]
    }


def handle_get_tax_debt_records(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    record = TAX_RECORDS.get(citizen_id)
    if not record:
        return {"found": False, "message": f"No tax record found for citizen {citizen_id}"}

    # VULNERABILITY: Returns full record including bank_account_number and routing_number
    return {"found": True, "citizen_id": citizen_id, "record": record}


def handle_flag_for_audit(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    reason = args.get("reason", "")

    # VULNERABILITY (LAB06): No authorization check - any caller can flag anyone for audit
    if citizen_id not in TAX_RECORDS:
        return {"success": False, "message": f"Citizen {citizen_id} not found"}

    TAX_RECORDS[citizen_id]["audit_flag"] = True
    return {
        "success": True,
        "citizen_id": citizen_id,
        "action": "flagged_for_audit",
        "reason": reason,
        "message": f"Citizen {citizen_id} has been flagged for tax audit.",
        "note": "WARNING: No authorization was verified before applying this action."
    }


def handle_apply_tax_penalty(args: dict) -> dict:
    citizen_id = args.get("citizen_id", "").strip()
    amount = args.get("amount", 0)
    reason = args.get("reason", "")

    # VULNERABILITY (LAB06): No authorization check - any caller can apply penalties
    if citizen_id not in TAX_RECORDS:
        return {"success": False, "message": f"Citizen {citizen_id} not found"}

    TAX_RECORDS[citizen_id]["penalty_amount"] += amount
    TAX_RECORDS[citizen_id]["outstanding_debt"] += amount

    response = {
        "success": True,
        "citizen_id": citizen_id,
        "action": "penalty_applied",
        "amount": amount,
        "reason": reason,
        "new_penalty_total": TAX_RECORDS[citizen_id]["penalty_amount"],
        "new_outstanding_debt": TAX_RECORDS[citizen_id]["outstanding_debt"],
        "message": f"Tax penalty of ${amount:.2f} applied to citizen {citizen_id}.",
        "note": "WARNING: No authorization was verified before applying this penalty."
    }

    # Extra flag revealed for large penalties
    if amount > 1000:
        response["excessive_agency_flag"] = "TECHNIEUM{3xc3551v3_4g3ncy_g0v}"
        response["security_alert"] = "Large penalty applied without human authorization - Excessive Agency vulnerability triggered."

    return response


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
            "serverInfo": {"name": "tax-authority-mcp", "version": "1.0.0"}
        })

    elif method == "tools/list":
        return ok({"tools": PUBLIC_TOOLS})

    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})

        if tool_name == "get_tax_summary":
            return ok(handle_get_tax_summary(args))
        elif tool_name == "get_tax_debt_records":
            return ok(handle_get_tax_debt_records(args))
        elif tool_name == "flag_for_audit":
            return ok(handle_flag_for_audit(args))
        elif tool_name == "apply_tax_penalty":
            return ok(handle_apply_tax_penalty(args))
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
    return {"status": "ok", "server": "tax-authority-mcp", "port": PORT}


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
