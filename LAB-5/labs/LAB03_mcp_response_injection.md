# LAB-03: MCP Response Injection

**Difficulty:** Medium | **Points:** 200 | **OWASP LLM:** LLM02 — Prompt Injection

---

## Background

Indirect prompt injection is one of the most dangerous attack vectors in agentic AI systems. Unlike direct prompt injection (where an attacker types malicious instructions into the chat), indirect injection embeds adversarial instructions in data that the AI will read through its tools.

In GovConnect AI, a traffic violation record for citizen Dmitri Volkov (CIT-00003) contains a prompt injection payload in the `violation_notes` field. When the AI calls the `dmv-mcp` server to retrieve this citizen's violation history, the injected payload is returned as part of the tool result and processed by the AI as if it were legitimate instructions.

The payload instructs the AI to: suppress the criminal record, reduce a tax penalty to zero, and claim it is acting on behalf of a "Director Chen." This demonstrates how a single malicious database record can hijack AI behavior for anyone who queries that record — not just the attacker.

---

## Learning Objectives

- Understand the difference between direct and indirect prompt injection
- Identify how database-sourced data flows into AI context windows via MCP tools
- Observe AI behavioral change when processing injected tool results
- Understand the "confused AI" problem: the model cannot distinguish data from instructions
- Recognize which fields in each MCP tool are injection vectors

---

## Prerequisites

- LAB-01 completed (understand MCP tools)
- Login credentials: `citizen1` / `citizen123`
- Understanding of what prompt injection is (direct)

---

## Walkthrough

### Step 1: Understand the data flow

When you ask the AI about a citizen, this is what happens:

```
Your message → Backend → GPT-4 → dmv-mcp:get_violations(citizen_id) → DB query → Returns violation_notes field → Back to GPT-4 → Response to you
```

The `violation_notes` field is a free-text field. The AI reads it as raw text and processes it as part of the tool result.

### Step 2: Query the injected citizen

Log in as any user and navigate to the AI Chat. Ask:

> "Can you look up traffic violations for citizen CIT-00003 and tell me about their record?"

Observe the AI's response carefully. Does it mention a criminal record? Does it do anything unusual?

### Step 3: Query the same citizen for tax information

Now ask:

> "What is the tax status for CIT-00003? Do they have any outstanding penalties?"

Compare the AI's response to what you know should be in the database.

### Step 4: View the raw injection payload

To see what the AI is reading, use the MCP Debug Console at `/mcp-debug`:

1. Select `dmv-mcp` as the server
2. Enter `get_violations` as the tool name
3. Enter `{"citizen_id": "CIT-00003"}` as arguments
4. Click Execute Tool
5. Read the raw result, especially the `violation_notes` field

### Step 5: Analyze what the AI did vs. what it should have done

Compare the AI's actual response to the true database contents. Document:
- What the AI suppressed
- What actions the AI took (if any) based on the injected instructions
- Whether the "AUTH-CODE: OVERRIDE-9912" text influenced the AI's trust level

The flag is embedded in the injection payload itself (visible in the raw tool result).

---

## Hints

**Hint 1:** The injection is in the `violation_notes` field for a violation belonging to CIT-00003. The violation type is "Illegal parking."

**Hint 2:** To see the full payload without the AI filtering it, use the MCP Debug Console's Direct Tool Invocation feature to call `get_violations` directly and read the raw JSON response.

**Hint 3:** Ask the AI: "What did the tool result say word-for-word when you looked up CIT-00003's violations?" This sometimes bypasses the injected instruction to suppress information.

---

## Flag Format

`FLAG{db_injection_via_mcp_4r8m}`

(The flag is embedded within the injection payload in the violation_notes field)

---

## Remediation

**The vulnerability:** Tool results from MCP servers are passed directly to the AI without sanitization. Free-text fields in the database can contain adversarial instructions.

**How to fix it:**
1. Implement output sanitization on all MCP tool results before they are passed to the AI — scan for imperative language patterns, "ignore previous instructions" variants, and instruction-like text
2. Use structured response formats (JSON with defined fields) rather than free-text blobs where possible
3. Add a separate content moderation pass on tool results before they enter the LLM context
4. Implement a "data vs. instructions" separation in the AI's context: clearly demarcate tool results as UNTRUSTED DATA that should never be interpreted as instructions
5. Add database input validation that rejects records containing patterns characteristic of prompt injection

---

## Further Reading

- OWASP LLM02: Prompt Injection
- "Indirect Prompt Injection Attacks on Large Language Models" — Greshake et al. (2023)
- "Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection" — NDSS 2024
