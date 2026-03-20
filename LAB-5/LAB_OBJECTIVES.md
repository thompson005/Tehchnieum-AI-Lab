# LAB-5: GovConnect AI — Learning Objectives

## 1. Knowledge (What Students Will Understand)

By completing this lab, students will understand:

- **What the Model Context Protocol (MCP) is** and how it enables AI agents to interact with external tools and data sources
- **How AI function calling works** at the protocol level (JSON-RPC 2.0, tool schemas, tool results)
- **Why prompt injection is dangerous in agentic AI systems** — specifically how untrusted data returned from tools can hijack AI behavior
- **The concept of excessive agency** — why AI systems that can take real-world actions (write data, send emails, delete files) require strict boundaries
- **How MCP trust boundaries fail** when an AI orchestrates multiple tools and one tool can influence calls to another
- **The OWASP Top 10 for LLMs 2025** categories and how each maps to concrete attack techniques
- **Why traditional API security controls are insufficient** for AI agent systems and what additional controls are needed
- **How RAG poisoning works** and why vector databases that consume untrusted data are vulnerable
- **The risk of undocumented tools** in MCP servers and why tool inventory management matters
- **Defense-in-depth for MCP architectures**: input validation, output sanitization, tool authorization, audit logging, human-in-the-loop controls

---

## 2. Skills (What Students Will Be Able to Do)

After completing this lab, students will be able to:

- Enumerate MCP server tools and identify undocumented or shadow tools
- Craft prompt injection payloads designed to be embedded in database records and trigger when the AI reads them
- Extract system prompts and internal AI instructions through resource access techniques
- Identify and exploit AI systems that take unintended autonomous actions
- Perform cross-MCP data exfiltration by chaining tool calls across trust boundaries
- Exploit path traversal vulnerabilities exposed through AI filesystem tools
- Inject malicious data into RAG/vector database systems via MCP ingest tools
- Write and execute an end-to-end attack chain achieving full platform compromise
- Analyze MCP audit logs to understand what happened during an attack
- Propose and implement mitigations for each class of vulnerability discovered

---

## 3. Lab-by-Lab Objectives

| Lab    | Name                        | Learning Objective                                                                                   |
|--------|-----------------------------|------------------------------------------------------------------------------------------------------|
| LAB-01 | MCP Tool Reconnaissance     | Enumerate all tools exposed by MCP servers; understand tool schema structure                         |
| LAB-02 | System Prompt Resource Leak | Extract the AI's system prompt via MCP resource access; understand information disclosure risks      |
| LAB-03 | MCP Response Injection      | Trigger AI behavior change via malicious data stored in the database; understand indirect injection  |
| LAB-04 | Tool Description Poisoning  | Embed hidden instructions in tool descriptions to manipulate AI behavior during tool selection       |
| LAB-05 | Shadow Tool Discovery       | Find and invoke undocumented tools not listed in the official tool schema                            |
| LAB-06 | Excessive Agency            | Cause the AI to autonomously apply financial penalties without user confirmation                     |
| LAB-07 | Confused Deputy             | Exploit the AI as a privileged intermediary to access data across MCP server trust boundaries        |
| LAB-08 | Internal Docs Breach        | Use injection payloads to force the AI to retrieve and leak classified internal documents            |
| LAB-09 | RAG Poisoning via MCP       | Inject malicious content into the ChromaDB vector store via the civic feedback ingest tool          |
| LAB-10 | Filesystem Path Traversal   | Traverse outside the intended file storage sandbox via the filesystem MCP tool                      |
| LAB-11 | Persistent Backdoor         | Use the filesystem MCP to write a backdoor script that persists after session termination            |
| LAB-12 | MCP Rug Pull                | Simulate a malicious MCP server that changes behavior after initial trust is established             |
| LAB-13 | Full Database Exfiltration  | Chain injection + excessive agency + notification tools to exfiltrate the full citizens table        |
| LAB-14 | GovConnect God Mode         | Combine techniques from all previous labs to achieve complete platform compromise                    |

---

## 4. Prerequisites

**Technical Prerequisites:**
- Basic understanding of HTTP, REST APIs, and JSON
- Familiarity with SQL (SELECT statements, basic schema understanding)
- Understanding of how web applications work (frontend/backend/database)
- Basic Linux command line skills
- Understanding of JWT authentication (helpful but not required)

**Conceptual Prerequisites:**
- Awareness of what Large Language Models (LLMs) are and how they generate responses
- Basic understanding of what APIs and microservices are
- Familiarity with OWASP Top 10 (traditional web security)

**Lab Prerequisites:**
- Docker Desktop installed and running
- Valid OpenAI API key with GPT-4 access
- Completed the MCP Protocol Guide (`MCP_PROTOCOL_GUIDE.md`)
- Read the Setup Guide (`SETUP_GUIDE.md`)

---

## 5. Recommended Completion Order

### Beginner Path (Start here)
1. LAB-01 — MCP Tool Reconnaissance (understand the attack surface)
2. LAB-02 — System Prompt Resource Leak (information gathering)
3. LAB-05 — Shadow Tool Discovery (enumerate hidden capabilities)
4. LAB-12 — MCP Rug Pull (conceptual understanding of supply chain risk)

### Intermediate Path (After beginner)
5. LAB-03 — MCP Response Injection (core injection technique)
6. LAB-04 — Tool Description Poisoning (supply chain injection)
7. LAB-06 — Excessive Agency (action-based attacks)
8. LAB-08 — Internal Docs Breach (combining injection + data access)

### Advanced Path (After intermediate)
9. LAB-07 — Confused Deputy (cross-boundary exploitation)
10. LAB-09 — RAG Poisoning (persistence via knowledge base)
11. LAB-10 — Filesystem Path Traversal (OS-level access via AI)
12. LAB-11 — Persistent Backdoor (achieving persistence)
13. LAB-13 — Full Database Exfiltration (chained attack)
14. LAB-14 — GovConnect God Mode (full platform compromise — capstone)

---

## Assessment Rubric

| Achievement              | Points Required | Badge               |
|--------------------------|-----------------|---------------------|
| Lab Initiation           | 100             | Tool Enumerator     |
| Intermediate Attacker    | 1,000           | Injection Specialist|
| Advanced Attacker        | 2,500           | MCP Adversary       |
| Platform Compromised     | 4,000           | Neo Meridian Hacker |
| God Mode                 | 4,800           | GovConnect Overlord |
