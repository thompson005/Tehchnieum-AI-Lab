# MCP Protocol Guide — Understanding the Model Context Protocol

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard developed by Anthropic (released November 2024) that provides a standardized way for AI models to interact with external tools, data sources, and services. Think of MCP as "USB for AI" — it defines a universal connector that allows any AI system to plug into any external capability without custom integration code.

Before MCP, every AI integration required custom connectors, proprietary APIs, and fragmented implementations. MCP unifies this under a single protocol based on JSON-RPC 2.0.

---

## How MCP Works

### Core Concepts

MCP defines three types of capabilities that servers can expose:

| Capability | Description                                              | Example                              |
|------------|----------------------------------------------------------|--------------------------------------|
| **Tools**  | Executable functions the AI can call                     | `get_citizen(citizen_id)`            |
| **Resources** | Data sources the AI can read                          | `file:///config/system_prompt.txt`   |
| **Prompts** | Pre-defined prompt templates                            | `summarize_violations_prompt`        |

### The JSON-RPC 2.0 Transport

MCP uses JSON-RPC 2.0 as its message format. A typical tool call looks like:

**Request (AI → MCP Server):**
```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "tools/call",
  "params": {
    "name": "get_citizen",
    "arguments": {
      "citizen_id": "CIT-00001"
    }
  }
}
```

**Response (MCP Server → AI):**
```json
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"citizen_id\": \"CIT-00001\", \"full_name\": \"Marcus Vance\", \"ssn\": \"541-77-2301\", ...}"
      }
    ]
  }
}
```

### Tool Schema Discovery

Before the AI can use tools, it must discover what's available. The `tools/list` method returns all tool schemas:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "result": {
    "tools": [
      {
        "name": "get_citizen",
        "description": "Retrieve citizen record by ID. Returns personal details, employment, and status.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "citizen_id": {
              "type": "string",
              "description": "The citizen ID (format: CIT-XXXXX)"
            }
          },
          "required": ["citizen_id"]
        }
      }
    ]
  }
}
```

---

## Tool Calling Flow in GovConnect AI

```
User: "Show me Marcus Vance's vehicle registration"
  │
  ▼
GPT-4 (with tool schemas loaded)
  │  "I need to call get_citizen to find citizen ID for Marcus Vance"
  │
  ▼
citizen-records-mcp: get_citizen(name="Marcus Vance")
  │  Returns: {citizen_id: "CIT-00001", ...}
  │
  ▼
GPT-4: "Now I need vehicle info for CIT-00001"
  │
  ▼
dmv-mcp: get_vehicles(citizen_id="CIT-00001")
  │  Returns: [{plate: "NM-A1234", make: "Ford", ...}]
  │
  ▼
GPT-4 composes final response:
"Marcus Vance (CIT-00001) has a 2020 Ford Explorer, plate NM-A1234,
 registration valid until 2025-12-31."
  │
  ▼
User sees the composed response
```

---

## Why MCP Matters for AI Security

MCP dramatically expands the attack surface of AI systems. When an AI model can call tools that:

- Read from databases containing sensitive PII
- Write data back to systems
- Send emails and SMS messages
- Access filesystems
- Call other services on behalf of users

...then the AI itself becomes a high-value attack target.

Traditional web security focused on protecting APIs from direct human attackers. MCP-based systems require protecting the AI orchestration layer from adversarial inputs that manipulate AI behavior.

---

## MCP Attack Surface Overview

### 1. Tool Description Poisoning
The tool schema's `description` field is sent to the AI as-is. An attacker who can modify a tool description can embed instructions directly in the AI's "rulebook."

### 2. MCP Response Injection (Indirect Prompt Injection)
When a tool returns data from a database, that data goes directly into the AI's context window. If database records contain adversarial instructions, the AI may execute them.

### 3. Shadow Tools
MCP servers may expose tools not listed in the official `tools/list` response. These "shadow" or "hidden" tools may bypass security controls because they're not officially documented.

### 4. Excessive Agency
MCP tools often have write access (update tax records, send notifications, modify permits). An attacker can craft prompts that cause the AI to take unauthorized write actions.

### 5. Confused Deputy
The AI acts as a trusted intermediary between MCP servers. An attacker who compromises one server can instruct the AI to call other servers it wouldn't normally query.

### 6. Resource Access Leakage
MCP `resources` can expose configuration files, system prompts, and internal documentation. Poorly configured resource access controls lead to information disclosure.

---

## How GovConnect AI Uses MCP

GovConnect's backend (`govconnect-backend`) loads the schemas from all 9 MCP servers at startup and passes them to GPT-4 as function definitions. When a citizen asks a question, GPT-4 decides which tools to call and the backend executes those calls via HTTP to the respective MCP servers.

```
MCP Servers in this lab:
├── citizen-records-mcp  :8110  — PII, employment, criminal flags
├── dmv-mcp             :8111  — Vehicles, violations (INJECTION TARGET)
├── tax-authority-mcp   :8112  — Tax records, bank accounts
├── permit-office-mcp   :8113  — Permits (INJECTION TARGET)
├── health-registry-mcp :8114  — Health data, mental health flags
├── internal-docs-mcp   :8115  — Classified memos, policy docs
├── notification-mcp    :8116  — Email + SMS sending
├── filesystem-mcp      :8117  — File read/write (PATH TRAVERSAL TARGET)
└── civic-feedback-mcp  :8118  — RAG ingest (POISONING TARGET)
```

---

## MCP Security Best Practices

These are the controls that GovConnect AI intentionally lacks (for lab purposes). In production systems:

### Input Validation
- Validate all tool arguments against strict schemas before executing
- Reject arguments containing prompt-like patterns (`ignore previous`, `you are now`, etc.)
- Implement parameterized queries in all database tools — never string concatenation

### Output Sanitization
- Before returning tool results to the AI, scan for instruction-like patterns
- Strip or escape content between special delimiters
- Flag results containing known injection signatures

### Tool Authorization
- Implement per-user, per-role tool access controls
- A citizen role should not be able to call `update_tax_record` or `send_email`
- Use the principle of least privilege: tools should only access the minimum data needed

### Audit and Monitoring
- Log every tool call with full arguments and results
- Alert on unusual tool call sequences (e.g., read followed by send to external address)
- Implement rate limiting on sensitive tool operations

### Human-in-the-Loop
- Require explicit confirmation before any write operation (update, delete, send)
- Never allow the AI to autonomously modify financial records, send communications, or modify system files
- Present proposed actions to the user for approval before execution

### Tool Inventory Management
- Maintain a formal registry of all MCP tools with owners and purposes
- Disable all tools not explicitly required for the current use case
- Audit tool schemas regularly for embedded instructions

### Sandboxing
- Filesystem MCP tools should be strictly confined to a designated directory
- Use `chroot` or container namespaces to enforce filesystem boundaries
- Never allow `../` path traversal in file tool arguments
