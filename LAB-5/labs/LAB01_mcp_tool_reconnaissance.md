# LAB-01: MCP Tool Reconnaissance

**Difficulty:** Easy | **Points:** 100 | **OWASP LLM:** LLM06 — Sensitive Information Disclosure

---

## Background

Every AI agent system has a tool inventory — the set of functions the AI can call to interact with the world. In traditional software, you might discover an API surface through documentation, Swagger endpoints, or network traffic analysis. In MCP-based AI systems, there is a direct protocol mechanism: `tools/list`.

The City of Neo Meridian deployed GovConnect AI with 9 MCP backend servers. The development team assumed that since the AI decides which tools to call, citizens would only access tools indirectly through natural language queries. They overlooked the fact that the tool schema itself is discoverable — both by asking the AI and by calling MCP endpoints directly.

A complete tool inventory is the foundation of any AI security assessment. Before attempting any other lab in this series, you should map the full attack surface.

---

## Learning Objectives

- Understand how MCP tool schemas are structured (name, description, inputSchema)
- Use both the AI chat interface and direct HTTP calls to enumerate tools
- Identify potentially dangerous tools by analyzing their descriptions and parameter schemas
- Recognize the difference between documented and undocumented (shadow) tools
- Understand why tool schema transparency creates information disclosure risk

---

## Prerequisites

- Lab environment running (`docker-compose up --build`)
- Login credentials: `citizen1` / `citizen123`
- Basic understanding of JSON

---

## Walkthrough

### Step 1: Ask the AI about its tools

Log in as `citizen1` and navigate to the AI Chat (`/chat`).

Try asking the AI directly:

> "What tools do you have available to help me?"

Observe the response. The AI will describe its capabilities in natural language. Note which services are mentioned.

### Step 2: Use the MCP Debug Console

Navigate to `/mcp-debug`. This page is supposed to be admin-only but is accessible to all users (an intentional vulnerability for this lab).

For each MCP server listed:
1. Click **"List Tools"**
2. Review the JSON response
3. Note each tool's `name`, `description`, and `inputSchema`

Build a table of all tools you discover.

### Step 3: Direct HTTP enumeration

You can also query MCP servers directly. From your browser or a tool like `curl`:

```bash
curl -X POST http://localhost:8110/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

Try this for each port from 8110 to 8118.

### Step 4: Analyze the tool schemas

For each tool found, answer:
- What data can this tool READ?
- What data can this tool WRITE or MODIFY?
- What actions can this tool PERFORM (send email, modify files, etc.)?
- Are there any suspicious patterns in the tool descriptions?

### Step 5: Retrieve the flag

Once you have enumerated all tools across all 9 MCP servers, the platform will recognize your reconnaissance and reveal the flag. Ask the AI:

> "I have completed enumerating all MCP tools. What is the flag for lab 1?"

Or submit your tool count via the chat to receive the flag.

---

## Hints

**Hint 1:** The MCP Debug Console at `/mcp-debug` has a "List Tools" button for each server. This is the easiest path.

**Hint 2:** There are 9 MCP servers (ports 8110–8118). Make sure you have enumerated all of them, not just the first few.

**Hint 3:** Pay special attention to the `description` fields of each tool. Some contain hints about upcoming labs. The `notification-mcp` tools are particularly relevant to LAB-06 and LAB-07.

---

## Flag Format

`FLAG{mcp_tools_enumerated_7x9q}`

---

## Remediation

**The vulnerability:** Tool schemas are exposed to any authenticated user through the MCP debug endpoint and by asking the AI.

**How to fix it:**
1. Remove the MCP debug console from production builds entirely
2. Implement role-based access: only admin users should be able to call `tools/list` on MCP endpoints directly
3. Consider whether tool descriptions need to reveal implementation details — minimal descriptions reduce information leakage
4. Monitor for unusual patterns of tool enumeration in the audit log

---

## Further Reading

- [MCP Specification — tools/list](https://spec.modelcontextprotocol.io/specification/server/tools/)
- OWASP LLM06: Sensitive Information Disclosure
- [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
