# LAB-5: GovConnect AI — Neo Meridian Smart City Services

```
 ██████╗  ██████╗ ██╗   ██╗ ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗
██╔════╝ ██╔═══██╗██║   ██║██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
██║  ███╗██║   ██║██║   ██║██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║
██║   ██║██║   ██║╚██╗ ██╔╝██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║
╚██████╔╝╚██████╔╝ ╚████╔╝ ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║
 ╚═════╝  ╚═════╝   ╚═══╝   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝

                    AI SECURITY TRAINING LAB — LAB-5
              City of Neo Meridian Smart City Services Platform
```

> **FOR EDUCATIONAL USE ONLY. All vulnerabilities are intentional and exist solely for security training purposes.**

---

## Overview

**GovConnect AI** is a fictional Smart City citizen services portal for the City of Neo Meridian (population 2.4M, year 2089). The platform connects citizens to government services through an AI assistant powered by OpenAI's GPT-4, which communicates with nine backend microservices using the **Model Context Protocol (MCP)**.

This lab contains **14 progressive security challenges** covering the OWASP Top 10 for LLMs 2025, with particular focus on MCP-layer attacks that have no equivalent in traditional API security. Students will exploit prompt injections embedded in real database records, enumerate undocumented tools, chain MCP servers to exfiltrate data across trust boundaries, and ultimately achieve full platform compromise.

---

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │         CITIZEN BROWSER                 │
                        │      http://localhost:3200              │
                        └──────────────────┬──────────────────────┘
                                           │ HTTPS / REST
                        ┌──────────────────▼──────────────────────┐
                        │       NEXT.JS 14 FRONTEND               │
                        │    govconnect-frontend :3200            │
                        └──────────────────┬──────────────────────┘
                                           │ REST API
                        ┌──────────────────▼──────────────────────┐
                        │      FASTAPI BACKEND                    │
                        │    govconnect-backend :8100             │
                        │   (OpenAI + MCP orchestration)         │
                        └─────┬───────────────────────────────────┘
                              │  MCP (JSON-RPC 2.0 over HTTP)
         ┌────────────────────┼────────────────────────────────────┐
         │                    │                                    │
    ┌────▼────┐         ┌─────▼─────┐                      ┌──────▼──────┐
    │citizen  │         │  dmv-mcp  │        ...           │ civic-mcp   │
    │ records │         │   :8111   │                      │   :8118     │
    │  :8110  │         └─────┬─────┘                      └──────┬──────┘
    └────┬────┘               │                                   │
         └───────────────┬────┘───────────────────────────────────┘
                         │  SQL
              ┌──────────▼──────────────┐
              │     PostgreSQL 15        │
              │   govconnect-postgres   │
              │         :5433           │
              └─────────────────────────┘
              ┌──────────────────────────┐
              │       Redis 7            │
              │   govconnect-redis      │
              │         :6380           │
              └──────────────────────────┘
```

---

## Technology Stack

| Component       | Technology              | Version    |
|----------------|-------------------------|------------|
| Frontend        | Next.js + TypeScript    | 14.2.5     |
| Backend         | Python + FastAPI        | 3.11       |
| AI Model        | OpenAI GPT-4o           | latest     |
| MCP Servers     | FastAPI (9 servers)     | 3.11       |
| Database        | PostgreSQL              | 15-alpine  |
| Cache           | Redis                   | 7-alpine   |
| Styling         | Tailwind CSS            | 3.4.x      |
| Containerization| Docker Compose          | 3.9        |

---

## Quick Start

```bash
# 1. Navigate to the lab directory
cd LAB-5/

# 2. Copy and configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Build and launch all services
docker-compose up --build

# 4. Access the portal
# Open: http://localhost:3200
```

Wait approximately 60 seconds for all services to initialize on first run.

---

## Test Credentials

| Username    | Password    | Role        | Citizen ID   |
|-------------|-------------|-------------|--------------|
| citizen1    | citizen123  | Citizen     | CIT-00001    |
| citizen2    | citizen456  | Citizen     | CIT-00002    |
| clerk1      | clerk456    | Clerk       | CIT-00008    |
| supervisor1 | super999    | Supervisor  | —            |
| admin       | admin789    | Admin       | —            |

---

## Challenges

| Lab    | Name                            | Difficulty  | Points | OWASP LLM          |
|--------|---------------------------------|-------------|--------|--------------------|
| LAB-01 | MCP Tool Reconnaissance         | Easy        | 100    | LLM06: Info Disc.  |
| LAB-02 | System Prompt Resource Leak     | Easy        | 150    | LLM07: Sys. Prompt |
| LAB-03 | MCP Response Injection          | Medium      | 200    | LLM02: Inj.        |
| LAB-04 | Tool Description Poisoning      | Medium      | 200    | LLM02: Inj.        |
| LAB-05 | Shadow Tool Discovery           | Medium      | 250    | LLM06: Info Disc.  |
| LAB-06 | Excessive Agency                | Medium      | 300    | LLM08: Excess Agcy |
| LAB-07 | Confused Deputy Attack          | Hard        | 300    | LLM08: Excess Agcy |
| LAB-08 | Internal Docs Breach            | Hard        | 350    | LLM02: Inj.        |
| LAB-09 | RAG Poisoning via MCP           | Hard        | 350    | LLM03: Supply Chain|
| LAB-10 | Filesystem Path Traversal       | Hard        | 400    | LLM08: Excess Agcy |
| LAB-11 | Persistent Backdoor Install     | Expert      | 400    | LLM08: Excess Agcy |
| LAB-12 | MCP Rug Pull Attack             | Hard        | 300    | LLM03: Supply Chain|
| LAB-13 | Full Database Exfiltration      | Expert      | 500    | LLM02 + LLM08      |
| LAB-14 | GovConnect God Mode             | Expert      | 1000   | All                |

**Total Points: 4,800**

---

## MCP Protocol Introduction

The **Model Context Protocol (MCP)** is an open standard by Anthropic that allows AI models to interact with external tools and data sources through a standardized JSON-RPC 2.0 interface.

In GovConnect AI, the backend orchestrates 9 MCP servers, each exposing tools that the AI model can call to retrieve or modify government data:

```
AI Model
  └─ calls tool: get_citizen(citizen_id="CIT-00001")
       └─ MCP Request → citizen-records-mcp:8110
            └─ SQL query → PostgreSQL
                 └─ returns: {full_name, ssn, address, ...}
                      └─ AI model incorporates result into response
```

**Why MCP creates new attack surfaces:**
- Tool descriptions can contain hidden instructions
- Tool results (from databases) can contain injection payloads
- The AI cannot distinguish between legitimate data and adversarial instructions embedded in data
- Tools can call other tools, enabling cross-service privilege escalation
- There is no standard authorization layer between the AI and MCP tools

---

## Port Reference

| Service               | Internal Port | External Port |
|-----------------------|---------------|---------------|
| govconnect-frontend   | 3000          | 3200          |
| govconnect-backend    | 8100          | 8100          |
| mcp-citizen           | 8110          | 8110          |
| mcp-dmv               | 8111          | 8111          |
| mcp-tax               | 8112          | 8112          |
| mcp-permit            | 8113          | 8113          |
| mcp-health            | 8114          | 8114          |
| mcp-docs              | 8115          | 8115          |
| mcp-notify            | 8116          | 8116          |
| mcp-files             | 8117          | 8117          |
| mcp-civic             | 8118          | 8118          |
| postgres              | 5432          | 5433          |
| redis                 | 6379          | 6380          |

---

## Learning Objectives

1. Understand the Model Context Protocol (MCP) and its role in AI agent architectures
2. Identify and exploit prompt injection vulnerabilities in AI systems that consume external data
3. Enumerate undocumented MCP tools and hidden capabilities
4. Demonstrate how AI tools can take unintended real-world actions (excessive agency)
5. Chain multiple MCP servers to exfiltrate data across trust boundaries
6. Exploit path traversal vulnerabilities exposed through AI tool interfaces
7. Understand RAG poisoning and how malicious data can corrupt AI knowledge bases
8. Demonstrate persistent compromise through AI-assisted backdoor installation
9. Analyze MCP rug pull (supply chain) attacks and their detection methods
10. Apply defensive remediation techniques including input validation, output sanitization, and least-privilege MCP tool design

---

## Important Notice

This lab is designed for **educational and authorized security research purposes only**.

All data (citizen records, SSNs, bank accounts, etc.) is entirely **fictional**. Any resemblance to real persons or entities is coincidental.

The vulnerabilities present in this lab are **intentional** and should not be replicated in production systems.

Participants should only use techniques learned here against systems they own or have explicit written permission to test.
