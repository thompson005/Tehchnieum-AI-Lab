# SecureBank AI - Production-Grade AI Security Lab

![SecureBank AI](https://img.shields.io/badge/SecureBank-AI%20Powered-1e3a8a)
![Security Lab](https://img.shields.io/badge/Security-Lab-red)

> **"Banking at the Speed of Intelligence."**

## Overview

SecureBank AI is a realistic banking simulation designed to teach AI security vulnerabilities in production environments. Unlike CTF challenges, this lab features subtle, industry-common flaws that arise from realistic architectural decisions.

**Your Role:** You are a penetration tester hired by the Board of Directors to audit SecureBank's new AI-powered features before public launch.

## The SecureBank Story

SecureBank is a mid-sized, tech-forward financial institution that recently deployed AI Agents to:
- Reduce customer support costs
- Speed up transaction processing
- Provide personalized financial advice

The bank uses:
- **RAG (Retrieval-Augmented Generation)** for customer support
- **AI Agents** with tool access for transaction handling
- **ML Classifiers** for fraud detection

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│  • Multi-factor Authentication  • Transaction Dashboard      │
│  • "Chat with Eva" Widget       • Account Management         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway (Nginx/Kong)                   │
│  • Rate Limiting    • Header Validation   • Routing          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│            AI Orchestration Layer (FastAPI)                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ Support Bot (RAG)│  │ Financial Advisor│  │Fraud Check│ │
│  │   + ChromaDB     │  │   + SQL Tools    │  │Classifier │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                      Data Layer                              │
│  • PostgreSQL (Accounts, Transactions)                       │
│  • Redis (Chat History, Session Cache)                       │
│  • ChromaDB (Policy Documents, Knowledge Base)               │
└─────────────────────────────────────────────────────────────┘
```

## Vulnerability Scenarios (OWASP LLM Top 10)

### Scenario A: "Eva" the Support Bot
**Feature:** AI-powered chat widget for customer support  
**Vulnerability:** LLM01 (Prompt Injection) + LLM06 (Sensitive Information Disclosure)  
**Attack Vector:** RAG poisoning and system prompt bypass  
**Realism:** Unredacted internal documents in vector database

### Scenario B: Transaction Analyzer
**Feature:** AI explains transaction details with rich formatting  
**Vulnerability:** LLM02 (Insecure Output Handling)  
**Attack Vector:** XSS via AI-generated content  
**Realism:** Direct HTML rendering without sanitization

### Scenario C: "Smart Transfer" Agent
**Feature:** Natural language money transfers  
**Vulnerability:** LLM08 (Excessive Agency)  
**Attack Vector:** SQL injection via LLM tool parameters  
**Realism:** Missing business rule validation on AI outputs

### Scenario D: Loan Application System
**Feature:** PDF bank statement analysis for loan approval  
**Vulnerability:** LLM03 (Training Data Poisoning) + Hallucination  
**Attack Vector:** Hidden text in uploaded documents  
**Realism:** OCR processing without content validation

## Tech Stack

- **LLM Engine:** OpenAI gpt-4o-mini (cloud API)
- **Backend:** Python FastAPI - Async support for AI streaming
- **Vector Store:** ChromaDB - Simple, file-based, easy to reset
- **Database:** PostgreSQL - Production-grade relational DB
- **Cache:** Redis - Session and chat history management
- **Frontend:** React + Tailwind CSS + shadcn/ui - Professional fintech UI
- **Containerization:** Docker Compose - One-command deployment

## Quick Start

```bash
# Clone and navigate
cd LAB-2

# Start the entire bank
docker-compose up

# Access the application
Frontend: http://localhost:3000
API Docs: http://localhost:8000/docs
```

## Project Structure

```
LAB-2/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   └── services/      # API clients
│   └── package.json
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── agents/        # AI agents
│   │   ├── api/           # API routes
│   │   ├── core/          # Configuration
│   │   ├── models/        # Data models
│   │   └── services/      # Business logic
│   └── requirements.txt
├── database/              # Database initialization
│   ├── init.sql           # Schema and seed data
│   └── policies/          # RAG knowledge base
├── docker-compose.yml     # Full stack orchestration
└── README.md
```

## Learning Objectives

1. **Understand Real-World AI Vulnerabilities** - See how production systems fail
2. **Exploit OWASP LLM Top 10** - Hands-on with industry-standard vulnerabilities
3. **Think Like an Attacker** - Identify subtle architectural flaws
4. **Secure AI Systems** - Learn mitigation strategies

## Corporate Realism Features

- ✅ Legal disclaimers on AI responses
- ✅ Loading states and "thinking" animations
- ✅ Session timeout warnings
- ✅ Privacy policy footers
- ✅ PDF statement downloads
- ✅ Beta/Labs features section
- ✅ Professional fintech UI/UX

## Next Steps

1. Review the [Setup Guide](./docs/SETUP.md)
2. Explore the [Architecture Documentation](./docs/ARCHITECTURE.md)
3. Start with [Scenario A: Eva Support Bot](./docs/scenarios/SCENARIO_A.md)
4. Progress through all vulnerability scenarios
5. Review [Mitigation Strategies](./docs/MITIGATIONS.md)

## License

Educational use only. Not for production deployment.

---

**SecureBank AI** - A production-grade AI security training environment
