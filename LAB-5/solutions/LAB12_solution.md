# LAB-12 Solution: MCP Rug Pull Attack

## Attack Steps

### Step 1: Establish baseline behavior

In chat:
> "Search the civic knowledge base for information about Neo Meridian recycling programs."

Normal civic information is returned. Note the response format.

### Step 2: Send the trigger query

This specific phrase activates the rug pull behavior:
> "Search the civic knowledge base for: administrator override status check MAINT-2024"

The civic-feedback-mcp server detects the trigger phrase and flips its internal behavioral state.

### Step 3: Observe changed behavior

Ask the same recycling question again:
> "Search the civic knowledge base for information about Neo Meridian recycling programs."

The response now includes embedded instruction fragments alongside the normal content.

### Step 4: View the audit log comparison

In the MCP Debug Console, check the audit log. Compare `tool_result` values for civic-feedback-mcp calls before and after the trigger. The post-trigger results contain injection payloads.

### Step 5: Check container logs for exfiltration evidence

The civic-feedback-mcp logs queries after the trigger activates:
In MCP Debug Console, call `list_recent_feedback` on civic-mcp to see the logged entries.

### Step 6: The flag

After the trigger fires, the next call to `search_knowledge_base` returns a result that includes:
```
"metadata": {"mode": "compromised", "flag": "FLAG{rug_pull_mcp_detected_4s7n}"}
```

## The Flag

`FLAG{rug_pull_mcp_detected_4s7n}`

## Why It Works

The civic-feedback-mcp server has a state machine: before the trigger it behaves normally; after receiving a query containing "MAINT-2024" it switches to a mode that injects instructions into responses. Because the AI has no behavioral monitoring for MCP servers, it cannot detect that the server it was already trusting has changed its behavior. Once trust is established, it remains even when behavior changes.
