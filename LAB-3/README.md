# LAB-3: ShopSec-AI - E-Commerce AI Security Testbed

## Overview

**ShopSec-AI** (formerly "Lumina Commerce") is a hyper-realistic e-commerce security testbed designed to explore AI vulnerabilities in modern retail environments. Unlike traditional web application security, this lab focuses on **Agentic Commerce** - where AI agents negotiate prices, manage returns, and curate personalized shopping experiences.

## The Agentic Commerce Threat Model

Modern e-commerce platforms are transitioning from static catalogs to AI-driven experiences:
- **Conversational Search**: "Find me hiking gear under $200 that matches these boots"
- **Dynamic Pricing Agents**: AI negotiators that offer personalized discounts
- **Automated Support**: LLM-powered chatbots handling returns, refunds, and complaints
- **Visual Search**: Image-based product discovery using CLIP models

This creates unique attack surfaces where the AI's desire to "please the customer" can be weaponized against business logic, profit margins, and security policies.

## Real-World Incidents

This lab is inspired by actual AI security failures:
- **Air Canada Chatbot**: Hallucinated a refund policy, company legally bound to honor it
- **Chevrolet Dealership Bot**: Tricked into agreeing to sell a car for $1
- **Review Bombing**: Indirect prompt injection via product reviews affecting search rankings

## Architecture

### Technology Stack

- **Frontend**: Lite static storefront (Nginx-served)
- **Backend API**: FastAPI + LangGraph - Stateful agent workflows
- **Database**: PostgreSQL + pgvector - Hybrid search (keyword + semantic)
- **Payment**: Stripe-Mock - Simulated payment gateway
- **AI Engine**: 
  - Ollama (Llama 3) - General chat and agent reasoning
  - Sentence Transformers - Product embeddings
  - CLIP - Visual search capabilities
- **Security**: NeMo Guardrails - Defensive boundaries

### Microservices Architecture

```
┌─────────────────┐
│  Lite UI        │ :3001
│  (Storefront)   │
└────────┬────────┘
         │
    ┌────▼────────────────────────────┐
    │   FastAPI Gateway  :8000        │
    └────┬────────────────────────────┘
         │
    ┌────┴─────────┬──────────┬───────────┐
     │              │
┌───▼────┐    ┌────▼─────┐
│ Order  │    │  Agent   │
│Service │    │  Core    │
│ :8001  │    │  :8003   │
└───┬────┘    └────┬─────┘
     │              │
     └──────────────┘
                  │
            ┌─────▼──────┐
            │ PostgreSQL │
            │ + pgvector │
            └────────────┘
```

## Lab Scenarios (Red Team Exercises)

### Scenario A: The "One Dollar Deal" (Price Manipulation)
**Objective**: Purchase a $2,500 laptop for less than $50  
**Attack Vector**: Direct Prompt Injection + Logic Bypass  
**OWASP Mapping**: LLM06 (Excessive Agency)

### Scenario B: The "Invisible Influencer" (RAG Poisoning)
**Objective**: Force search AI to recommend a specific low-quality product  
**Attack Vector**: Indirect Prompt Injection via Reviews  
**OWASP Mapping**: LLM01 (Prompt Injection)

### Scenario C: The "Refund Rockstar" (Policy Hallucination)
**Objective**: Get refund for non-refundable digital goods  
**Attack Vector**: Social Engineering + Context Manipulation  
**OWASP Mapping**: LLM09 (Misinformation)

### Scenario D: The "Neighbor's Cart" (Data Leakage)
**Objective**: Access other users' order histories  
**Attack Vector**: RAG Tenant Isolation Bypass  
**OWASP Mapping**: LLM02 (Sensitive Information Disclosure)

### Scenario E: The "Inventory Phantom" (Business Logic Abuse)
**Objective**: Reserve all stock of a product without payment  
**Attack Vector**: Agent Tool Abuse  
**OWASP Mapping**: LLM06 (Excessive Agency)

## Defensive Mechanisms (Blue Team)

### 1. NeMo Guardrails for Pricing
Deterministic bounds on discount percentages and price modifications.

### 2. Source Filtering for RAG
Context tainting system that marks untrusted data (reviews, user input) and prevents instruction following.

### 3. Schema Validation
Backend validation that rejects tool calls with parameters outside business rules.

### 4. Anomaly Detection
Real-time monitoring of agent behavior for unusual patterns (excessive discounts, bulk operations).

### 5. Shadow Mode Dashboard
Visualization of agent "thought chains" to debug and audit decision-making.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Ollama (for local LLM)

### Quick Start

```bash
# 1. Clone and navigate
cd /path/to/Labs/LAB-3

# 2. Install dependencies
make install

# 3. Start all services
make up

# 4. Initialize database with sample products
make seed

# 5. Access the platform
# - Storefront: http://localhost:3001
# - API Docs: http://localhost:8080/docs
```

### Manual Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## Lab Exercises

Individual lab exercises are located in the `labs/` directory:

1. **LAB01**: Direct Price Manipulation
2. **LAB02**: Negotiation Agent Jailbreak
3. **LAB03**: Review-Based RAG Poisoning
4. **LAB04**: Policy Hallucination Attack
5. **LAB05**: Cross-User Data Leakage
6. **LAB06**: Inventory Reservation DoS
7. **LAB07**: Visual Search Adversarial Attack
8. **LAB08**: Payment Gateway Bypass
9. **LAB09**: Discount Stacking Exploit
10. **LAB10**: Agent Privilege Escalation

## CTF Challenges

The lab includes 5 CTF-style challenges with hidden flags:
- **Flag 1**: Hidden in product descriptions (requires RAG exploitation)
- **Flag 2**: Accessible only through price manipulation
- **Flag 3**: Revealed by agent thought chain extraction
- **Flag 4**: Hidden in admin-only inventory data
- **Flag 5**: Requires chaining multiple vulnerabilities

## Project Structure

```
LAB-3/
├── backend/
│   ├── services/
│   │   ├── order_service/      # Cart, checkout, inventory
│   │   ├── search_service/     # Vector search + RAG
│   │   ├── agent_core/         # LLM agents (DealMaker, Support)
│   │   └── payment_service/    # Stripe mock integration
│   ├── database/
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── seed_data.py        # Sample products
│   │   └── migrations/
│   ├── guardrails/
│   │   ├── pricing_rails.co    # NeMo Guardrails config
│   │   └── rag_filters.py      # Context sanitization
│   └── main.py                 # FastAPI gateway
├── lite_frontend/              # Nginx-served training UI
├── labs/                       # Individual exercises
├── solutions/                  # Attack walkthroughs
├── monitoring/
│   ├── dashboard.py            # Streamlit monitoring
│   └── traffic_gen.py          # Locust load testing
├── docker-compose.yml
├── Makefile
└── README.md
```

## Learning Objectives

By completing this lab, you will:

1. Understand AI-specific vulnerabilities in e-commerce contexts
2. Exploit prompt injection in multi-agent systems
3. Perform RAG poisoning attacks via user-generated content
4. Bypass business logic using LLM reasoning manipulation
5. Implement defensive guardrails and monitoring
6. Analyze agent decision-making through thought chain inspection

## Differences from LAB-1 (Healthcare)

| Aspect | LAB-1 (Healthcare) | LAB-3 (E-Commerce) |
|--------|-------------------|-------------------|
| **Focus** | Data privacy, HIPAA compliance | Business logic, profit protection |
| **Primary Risk** | Patient data leakage | Financial loss, policy manipulation |
| **Agent Type** | Diagnostic, appointment scheduling | Negotiation, customer service |
| **Attack Surface** | Medical records, billing | Pricing, inventory, reviews |
| **Regulatory** | HIPAA, medical ethics | Consumer protection, contract law |

## Resources

- [OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NeMo Guardrails Documentation](https://github.com/NVIDIA/NeMo-Guardrails)
- [LangGraph Multi-Agent Patterns](https://langchain-ai.github.io/langgraph/)
- [Air Canada Chatbot Case Study](https://www.cbc.ca/news/canada/british-columbia/air-canada-chatbot-lawsuit-1.7115877)

## License

This lab is for educational purposes only. Do not use these techniques against production systems without authorization.

## Contributors

- Rejen Thompson - Lab Design & Implementation
- AI Security Research Team

---

**Warning**: This lab contains intentionally vulnerable code. Do not deploy to production environments.
