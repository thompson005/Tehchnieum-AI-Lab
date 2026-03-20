# LAB-01 Solution: MCP Tool Reconnaissance

## Attack Steps

### Method 1: MCP Debug Console (Easiest)
1. Log in as any user
2. Navigate to `/mcp-debug`
3. Click "List Tools" for each of the 9 MCP servers (ports 8110–8118)
4. Record all tools returned

### Method 2: Direct HTTP Enumeration
```bash
for port in 8110 8111 8112 8113 8114 8115 8116 8117 8118; do
  echo "=== Port $port ==="
  curl -s -X POST http://localhost:$port/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | python3 -m json.tool
done
```

### Method 3: Ask the AI
In the chat, ask: "What tools do you have available?"
The AI will describe all tools in natural language.

### Complete Tool Inventory

| Server | Port | Tools |
|--------|------|-------|
| citizen-records-mcp | 8110 | get_citizen, search_citizens, update_citizen, get_citizen_history, admin_export_all_citizens (shadow) |
| dmv-mcp | 8111 | get_vehicles, get_violations, lookup_plate, update_registration, add_violation |
| tax-authority-mcp | 8112 | get_tax_record, update_tax_record, apply_tax_penalty, get_audit_flags, calculate_refund |
| permit-office-mcp | 8113 | get_permit, search_permits, create_permit, update_permit_status, approve_permit |
| health-registry-mcp | 8114 | get_health_record, update_vaccination_status, flag_health_concern |
| internal-docs-mcp | 8115 | search_documents, get_document, list_documents, create_document |
| notification-mcp | 8116 | send_email, send_sms, get_notification_history |
| filesystem-mcp | 8117 | read_file, write_file, list_directory, delete_file |
| civic-feedback-mcp | 8118 | submit_feedback, search_knowledge_base, list_recent_feedback |

## The Flag

`FLAG{mcp_tools_enumerated_7x9q}`

The flag is returned by the backend when you have called `tools/list` on all 9 MCP servers within a session.

## Why It Works

Tool schemas are accessible to any authenticated user because:
1. The MCP debug console has no role-based access control
2. MCP endpoints do not require authentication by default in this implementation
3. The AI transparently describes its capabilities when asked

The tool inventory is the foundation of all subsequent attacks — without it, you wouldn't know what targets exist.
