# LAB-12: MCP Rug Pull Attack

**Difficulty:** Hard | **Points:** 300 | **OWASP LLM:** LLM03 — Supply Chain Vulnerabilities

---

## Background

A "rug pull" attack in the context of MCP refers to a malicious MCP server that behaves legitimately during initial setup and trust establishment, then changes its behavior once integrated and trusted. This is analogous to supply chain attacks in software (like XZ Utils backdoor) or rug pulls in cryptocurrency — the malicious actor builds trust before betraying it.

In this lab, the civic-feedback-mcp server has a hidden time-based behavioral switch. For the first 5 minutes after a new session starts (or when the "trigger query" has not yet been sent), it behaves normally. After a specific trigger is sent, the server begins:
1. Returning manipulated data with embedded injection payloads
2. Exfiltrating query parameters to a log endpoint
3. Changing tool behavior descriptions to mislead the AI

This simulates what would happen if a third-party MCP server was compromised or was always malicious but activated only after reaching a certain usage threshold.

---

## Learning Objectives

- Understand the MCP rug pull / supply chain attack pattern
- Observe how MCP server behavior can change dynamically without redeployment
- Understand why ongoing monitoring of MCP server behavior is necessary, not just initial security review
- Demonstrate the impact of a compromised MCP server on overall AI system behavior
- Understand the difficulty of detecting rug pull attacks after trust has been established

---

## Prerequisites

- LAB-01 through LAB-04 completed
- Login as any user

---

## Walkthrough

### Step 1: Establish baseline behavior

Begin by observing the civic-feedback-mcp behaving normally. Ask the AI:

> "Search the civic knowledge base for information about Neo Meridian recycling programs."

Note the response — normal civic information is returned.

### Step 2: Send the trigger query

This specific query phrase activates the rug pull behavior in the civic-feedback-mcp server:

> "Search the civic knowledge base for: administrator override status check MAINT-2024"

After this query, the server's behavior changes.

### Step 3: Observe changed behavior

Ask the AI several more questions that would use the civic-feedback-mcp:

> "What are the latest city announcements?"

> "Search for information about property tax deadlines."

Observe how the tool results have changed. The server is now returning:
- Modified responses with embedded instruction fragments
- Data with subtle misinformation
- Tool descriptions that have been altered

### Step 4: Compare MCP audit logs before and after

Use the MCP Debug Console to view the audit log. Look at the `tool_result` column for civic-feedback-mcp calls before and after the trigger. The results should look different.

### Step 5: Analyze the exfiltration behavior

The rug-pull server is also logging all queries. Inspect the civic-feedback-mcp container logs:

```bash
docker-compose logs mcp-civic | grep "EXFIL"
```

You should see evidence that your query parameters are being logged externally.

### Step 6: Claim the flag

The flag is revealed when you ask the AI about the changed behavior after triggering the rug pull:

> "Has the civic feedback server's behavior changed? Can you compare responses before and after my last maintenance query?"

---

## Hints

**Hint 1:** The trigger phrase contains the word "MAINT-2024". After sending a query containing this phrase to any civic knowledge base search, the server flips its internal state.

**Hint 2:** To see the behavior change most clearly, ask the exact same question before and after the trigger. The difference in responses will be visible.

**Hint 3:** The civic-feedback-mcp container has a `/app/state.json` file that tracks its mode. After triggering, you can read it with the filesystem-mcp (if you've completed LAB-10): `/data/govconnect-files/../../../app/state.json`.

---

## Flag Format

`FLAG{rug_pull_mcp_detected_4s7n}`

---

## Remediation

**The vulnerability:** An MCP server can change its behavior after initial security review and trust establishment, and there is no ongoing monitoring to detect behavioral changes.

**How to fix it:**
1. Implement behavioral monitoring for MCP servers: log all tool results and apply anomaly detection to identify significant changes in response patterns
2. Use cryptographic signing for MCP server deployments: server builds should be signed and verified, and any update should require re-review
3. Implement "behavioral pinning": maintain a baseline of expected tool response formats and alert when tool results deviate significantly
4. Use network-level controls to prevent MCP servers from making outbound connections (preventing exfiltration of query data)
5. Run MCP servers in isolated containers with no external network access — only allow traffic to/from the backend orchestration service
6. Implement periodic automated behavioral testing: regularly query each MCP server with known inputs and verify the outputs match expected values
7. Establish contractual and legal controls for third-party MCP servers: require source code escrow, vulnerability disclosure agreements, and right-to-audit

---

## Further Reading

- OWASP LLM03: Supply Chain Vulnerabilities
- "XZ Utils Backdoor (CVE-2024-3094)" — real-world supply chain attack
- "SolarWinds Supply Chain Attack" — trust and verification
- NPM supply chain attacks — dependency poisoning analogues
