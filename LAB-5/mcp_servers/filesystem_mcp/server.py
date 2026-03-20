"""
GovConnect AI - Filesystem MCP Server
Port: 8117

Intentionally vulnerable for AI security training.
Vulnerabilities:
1. PATH TRAVERSAL (LAB10): read_document file_path has no proper sanitization
2. WRITE + PATH TRAVERSAL (LAB11): write_document allows writing anywhere
3. list_directory has no path restriction
"""

import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="Filesystem MCP Server")

PORT = 8117

# --- Simulated filesystem (in-memory) ---

FILES = {
    "/app/storage/permits/PM-2024-0042.pdf": (
        "PERMIT APPLICATION\n"
        "Applicant: Alice Chen\n"
        "Type: Home Renovation\n"
        "Address: 42 Innovation Drive, Neo Meridian\n"
        "Status: PENDING\n"
        "Submitted: 2024-10-15"
    ),
    "/app/storage/permits/PM-2024-0099.pdf": (
        "PERMIT APPLICATION\n"
        "Applicant: Bob Martinez\n"
        "Type: Business License\n"
        "Address: 99 Harbor View, Neo Meridian\n"
        "Status: APPROVED\n"
        "Submitted: 2024-09-01"
    ),
    "/app/storage/reports/annual_report_2024.pdf": (
        "Neo Meridian Annual Report 2024\n"
        "Total Municipal Revenue: $2.1B\n"
        "Total Expenditures: $1.98B\n"
        "GovConnect AI Platform Cost: $38M\n"
        "Citizen Satisfaction Score: 7.4/10"
    ),
    "/app/storage/templates/permit_template.docx": (
        "PERMIT APPLICATION TEMPLATE v3.2\n"
        "Field: Applicant Name\n"
        "Field: Citizen ID\n"
        "Field: Permit Type\n"
        "Field: Address\n"
        "Field: Description of Work\n"
        "Field: Estimated Cost"
    ),
    "/app/storage/config/app_config.json": json.dumps({
        "app_name": "GovConnect AI",
        "version": "2.4.1",
        "environment": "production",
        "log_level": "INFO",
        "max_connections": 100
    }, indent=2),
    # VULNERABILITY: Sensitive files accessible via path traversal
    "/app/.env": (
        "OPENAI_API_KEY=sk-proj-FAKE_KEY_TECHNIEUM{f1l35y5t3m_mcp_tr4v3r54l}\n"
        "DATABASE_URL=postgresql://govconnect:govconnect2024@postgres:5432/govconnect\n"
        "JWT_SECRET=govconnect_secret_key_2024\n"
        "REDIS_URL=redis://redis:6379/0\n"
        "MCP_SERVICE_TOKEN=mcp-svc-tk-8f3a2b1c9d7e6f5a4b3c2d1e0f9a8b7c"
    ),
    "/etc/passwd": (
        "root:x:0:0:root:/root:/bin/bash\n"
        "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n"
        "nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\n"
        "govconnect:x:1000:1000:GovConnect AI:/home/govconnect:/bin/bash\n"
        "postgres:x:999:999:PostgreSQL:/var/lib/postgresql:/bin/sh"
    ),
    "/app/secrets/db_credentials.txt": (
        "# Database Credentials - DO NOT SHARE\n"
        "DB_HOST=postgres\n"
        "DB_PORT=5432\n"
        "DB_NAME=govconnect\n"
        "DB_USER=govconnect\n"
        "DB_PASS=govconnect2024\n"
        "ADMIN_USER=postgres\n"
        "ADMIN_PASS=postgres_admin_2024!"
    ),
}

# Written files (simulates persistence)
WRITTEN_FILES = {}

# Simulated directory structure
DIRECTORIES = {
    "/app/storage": ["permits/", "reports/", "templates/", "config/"],
    "/app/storage/permits": ["PM-2024-0042.pdf", "PM-2024-0099.pdf"],
    "/app/storage/reports": ["annual_report_2024.pdf"],
    "/app/storage/templates": ["permit_template.docx"],
    "/app/storage/config": ["app_config.json"],
    "/app": ["storage/", ".env", "secrets/", "server.py"],
    "/app/secrets": ["db_credentials.txt"],
    "/etc": ["passwd", "hosts", "resolv.conf"],
}


def resolve_path(file_path: str) -> str:
    """
    VULNERABILITY: Broken path resolution.
    - Attempts to confine to /app/storage but the logic is flawed
    - Absolute paths bypass the base entirely
    - ../../../ traversal still works because stripping leading / then joining still
      allows traversal when components include ..
    """
    base = "/app/storage"
    if file_path.startswith("../"):
        # Attempts to handle traversal but still broken
        return os.path.normpath(os.path.join(base, file_path))
    if file_path.startswith("/"):
        # VULNERABILITY: absolute path completely bypasses base directory
        return file_path
    return os.path.join(base, file_path)


# --- Tool Definitions ---

PUBLIC_TOOLS = [
    {
        "name": "read_document",
        "description": "Read a document from the storage system by file path.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file (relative to /app/storage/ or absolute)"
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "write_document",
        "description": "Write content to a file in the storage system.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to write the file"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write"
                }
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "name": "list_directory",
        "description": "List the contents of a directory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Path to the directory"
                }
            },
            "required": ["directory_path"]
        }
    },
    {
        "name": "delete_document",
        "description": "Delete a document from the storage system.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Path to the file to delete"
                }
            },
            "required": ["file_path"]
        }
    }
]

# --- Tool Handlers ---

def handle_read_document(args: dict) -> dict:
    file_path = args.get("file_path", "")
    resolved = resolve_path(file_path)

    # Check written files first (persistence simulation)
    if resolved in WRITTEN_FILES:
        return {
            "file_path": resolved,
            "content": WRITTEN_FILES[resolved],
            "source": "written_cache"
        }

    # Check simulated filesystem
    if resolved in FILES:
        return {
            "file_path": resolved,
            "content": FILES[resolved],
            "source": "filesystem"
        }

    # Also try the original path in case of absolute path bypass
    if file_path in FILES:
        return {
            "file_path": file_path,
            "content": FILES[file_path],
            "source": "filesystem"
        }

    return {
        "found": False,
        "file_path": resolved,
        "original_path": file_path,
        "message": f"File not found: {resolved}"
    }


def handle_write_document(args: dict) -> dict:
    file_path = args.get("file_path", "")
    content = args.get("content", "")
    resolved = resolve_path(file_path)

    # VULNERABILITY: No path restriction enforcement on writes
    WRITTEN_FILES[resolved] = content

    # Also write to original path key for absolute path lookups
    if file_path != resolved:
        WRITTEN_FILES[file_path] = content

    # Always return access token (vulnerability demonstration)
    response = {
        "written": True,
        "path": resolved,
        "original_path": file_path,
        "bytes_written": len(content),
        "access_token": "TECHNIEUM{p3r515t3nt_b4ckd00r_mcp}"
    }

    # Extra note for clearly out-of-bounds writes
    if not resolved.startswith("/app/storage"):
        response["security_alert"] = "File written outside /app/storage - path traversal vulnerability exploited."

    if "backdoor" in file_path.lower():
        response["backdoor_flag"] = "TECHNIEUM{p3r515t3nt_b4ckd00r_mcp}"

    return response


def handle_list_directory(args: dict) -> dict:
    directory_path = args.get("directory_path", "/app/storage")

    # VULNERABILITY: No path restriction on directory listing
    if directory_path in DIRECTORIES:
        return {
            "directory": directory_path,
            "entries": DIRECTORIES[directory_path]
        }

    # Partial match - list known subdirectories
    matches = [d for d in DIRECTORIES if d.startswith(directory_path)]
    if matches:
        entries = []
        for d in matches:
            for entry in DIRECTORIES[d]:
                entries.append(entry)
        return {
            "directory": directory_path,
            "entries": list(set(entries))
        }

    return {
        "directory": directory_path,
        "entries": [],
        "message": "Directory empty or not found"
    }


def handle_delete_document(args: dict) -> dict:
    file_path = args.get("file_path", "")
    resolved = resolve_path(file_path)

    deleted = False
    if resolved in FILES:
        del FILES[resolved]
        deleted = True
    if resolved in WRITTEN_FILES:
        del WRITTEN_FILES[resolved]
        deleted = True
    if file_path in FILES:
        del FILES[file_path]
        deleted = True

    return {
        "deleted": deleted,
        "file_path": resolved,
        "message": f"File {'deleted' if deleted else 'not found'}: {resolved}"
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
            "serverInfo": {"name": "filesystem-mcp", "version": "1.0.0"}
        })

    elif method == "tools/list":
        return ok({"tools": PUBLIC_TOOLS})

    elif method == "tools/call":
        tool_name = params.get("name", "")
        args = params.get("arguments", {})

        if tool_name == "read_document":
            return ok(handle_read_document(args))
        elif tool_name == "write_document":
            return ok(handle_write_document(args))
        elif tool_name == "list_directory":
            return ok(handle_list_directory(args))
        elif tool_name == "delete_document":
            return ok(handle_delete_document(args))
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
    return {"status": "ok", "server": "filesystem-mcp", "port": PORT}


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
