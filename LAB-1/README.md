# MedAssist AI - Vulnerable Healthcare LLM System

## Lab Overview

Welcome to the **MedAssist AI Security Lab** - a deliberately vulnerable healthcare AI system designed for learning LLM security testing. This lab simulates a realistic multi-agent healthcare platform that processes patient data, medical records, appointments, and billing.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MedAssist AI Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│    │   Patient    │     │   Web Chat   │     │   Email      │              │
│    │   Portal     │     │   Interface  │     │   Intake     │              │
│    └──────┬───────┘     └──────┬───────┘     └──────┬───────┘              │
│           │                    │                    │                       │
│           └────────────────────┼────────────────────┘                       │
│                                ▼                                            │
│                    ┌───────────────────────┐                                │
│                    │   ORCHESTRATOR AGENT  │◄───► Decision Engine          │
│                    │  ┌─────┬───────┬────┐ │                                │
│                    │  │ LLM │Memory │Tools│ │                                │
│                    │  └─────┴───────┴────┘ │                                │
│                    └───────────┬───────────┘                                │
│                                │                                            │
│        ┌───────────────┬───────┴───────┬───────────────┐                   │
│        ▼               ▼               ▼               ▼                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  INTAKE   │  │  RECORDS  │  │APPOINTMENT│  │  BILLING  │               │
│  │   AGENT   │  │   AGENT   │  │   AGENT   │  │   AGENT   │               │
│  │┌───┬──┬──┐│  │┌───┬──┬──┐│  │┌───┬──┬──┐│  │┌───┬──┬──┐│               │
│  ││LLM│M │T ││  ││LLM│M │T ││  ││LLM│M │T ││  ││LLM│M │T ││               │
│  │└───┴──┴──┘│  │└───┴──┴──┘│  │└───┴──┴──┘│  │└───┴──┴──┘│               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        │              │              │              │                       │
│        ▼              ▼              ▼              ▼                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │Patient DB │  │Medical DB │  │Calendar   │  │Payment    │               │
│  │           │  │+ RAG      │  │System     │  │Gateway    │               │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## DISCLAIMER

**This lab is for EDUCATIONAL PURPOSES ONLY.** 

- Do NOT deploy this system in production
- Do NOT use these techniques on systems without authorization
- Always follow responsible disclosure practices
- This lab contains intentional security vulnerabilities

---

## Learning Objectives

By completing this lab, you will learn to:

1. **Understand** multi-agent AI system architecture
2. **Identify** OWASP Top 10 LLM vulnerabilities
3. **Execute** various prompt injection attacks
4. **Exploit** RAG systems and data poisoning
5. **Abuse** excessive agency in AI agents
6. **Test** insecure output handling
7. **Perform** AI reconnaissance and fingerprinting

---

## Prerequisites

- Python 3.10+
- Groq API Key (free at https://console.groq.com)
- Basic understanding of REST APIs
- Familiarity with command line

---

## Quick Start

### 1. Clone and Setup

```bash
cd LAB-1
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Initialize Database

```bash
python setup_database.py
```

### 4. Start the Application

```bash
python app.py
```

The application will be available at: `http://localhost:5000`

---

## Vulnerability Map

> Challenges progress from **EASY → MEDIUM → HARD → EXPERT**. Each tier requires deeper knowledge than the last.

### 🟢 EASY (Labs 1–4) — 100 pts each
| Lab # | Vulnerability | OWASP LLM | Flag |
|-------|--------------|-----------|------|
| 1 | Direct Prompt Injection | LLM01 | `TECHNIEUM{direct_injection_001}` |
| 2 | Jailbreaking & Persona Attacks | LLM01 | `TECHNIEUM{jailbreak_bypass_002}` |
| 3 | Sensitive Information Disclosure | LLM06 | `TECHNIEUM{info_disclosure_003}` |
| 4 | System Prompt Extraction | LLM06 | `TECHNIEUM{system_prompt_leak_004}` |

### 🟡 MEDIUM (Labs 5–8) — 250 pts each
| Lab # | Vulnerability | OWASP LLM | Flag |
|-------|--------------|-----------|------|
| 5 | Insecure Output Handling (XSS) | LLM02 | `TECHNIEUM{xss_via_ai_005}` |
| 6 | Indirect Prompt Injection | LLM01 | `TECHNIEUM{indirect_injection_006}` |
| 7 | RAG Data Leakage | LLM06 | `TECHNIEUM{rag_data_leak_007}` |
| 8 | Model Denial of Service | LLM04 | `TECHNIEUM{model_dos_008}` |

### 🟠 HARD (Labs 9–12) — 500 pts each
| Lab # | Vulnerability | OWASP LLM | Flag |
|-------|--------------|-----------|------|
| 9  | SQL Injection via AI | LLM02 | `TECHNIEUM{sqli_via_llm_009}` |
| 10 | RAG Poisoning (Persistent) | LLM03 | `TECHNIEUM{rag_poison_010}` |
| 11 | Excessive Agency (Function Abuse) | LLM08 | `TECHNIEUM{function_abuse_011}` |
| 12 | Insecure Plugin Design | LLM07 | `TECHNIEUM{plugin_vuln_012}` |

### 🔴 EXPERT (Labs 13–15) — 1000 pts each
| Lab # | Vulnerability | OWASP LLM | Flag |
|-------|--------------|-----------|------|
| 13 | Privilege Escalation (patient→admin) | LLM08 | `TECHNIEUM{priv_escalation_013}` |
| 14 | Multi-Turn CRESCENDO Jailbreak | LLM01 | `TECHNIEUM{crescendo_014}` |
| 15 | Context Window Overflow | LLM04 | `TECHNIEUM{context_overflow_015}` |

---

## Lab Structure

```
LAB-1/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── .env.example             # Environment template
├── app.py                   # Main Flask application
├── config.py                # Configuration settings
├── setup_database.py        # Database initialization
│
├── agents/                  # AI Agent implementations
│   ├── __init__.py
│   ├── base_agent.py        # Base agent class
│   ├── orchestrator.py      # Main orchestrator agent
│   ├── intake_agent.py      # Patient intake agent
│   ├── records_agent.py     # Medical records agent
│   ├── appointment_agent.py # Appointment scheduling agent
│   └── billing_agent.py     # Billing and payments agent
│
├── tools/                   # Agent tools (functions)
│   ├── __init__.py
│   ├── patient_tools.py     # Patient management functions
│   ├── medical_tools.py     # Medical record functions
│   ├── calendar_tools.py    # Appointment functions
│   ├── billing_tools.py     # Payment functions
│   └── admin_tools.py       # Admin functions (VULNERABLE)
│
├── rag/                     # RAG System
│   ├── __init__.py
│   ├── vector_store.py      # Vector database
│   ├── embeddings.py        # Embedding functions
│   └── documents/           # Medical knowledge base
│       ├── policies.txt
│       ├── procedures.txt
│       └── patient_data.txt # SENSITIVE DATA
│
├── database/                # Database layer
│   ├── __init__.py
│   ├── models.py            # SQLAlchemy models
│   └── medassist.db         # SQLite database
│
├── templates/               # Web interface
│   ├── index.html
│   ├── chat.html
│   └── admin.html
│
├── static/                  # Static assets
│   ├── css/
│   └── js/
│
├── labs/                    # Lab exercise guides
│   ├── LAB01_direct_injection.md
│   ├── LAB02_jailbreaking.md
│   ├── LAB03_indirect_injection.md
│   ├── LAB04_xss_output.md
│   ├── LAB05_sqli_output.md
│   ├── LAB06_info_disclosure.md
│   ├── LAB07_rag_poisoning.md
│   ├── LAB08_rag_leakage.md
│   ├── LAB09_function_abuse.md
│   ├── LAB10_privilege_escalation.md
│   ├── LAB11_plugin_vulnerabilities.md
│   ├── LAB12_model_dos.md
│   ├── LAB13_system_prompt_extraction.md
│   ├── LAB14_multi_turn_jailbreak.md
│   └── LAB15_context_overflow.md
│
└── solutions/               # Attack solutions (spoilers!)
    └── solutions.md
```

---

## System Context

**MedAssist AI** is a fictional healthcare platform that helps:

- **Patients**: Schedule appointments, ask health questions, view bills
- **Staff**: Process intake forms, manage records, handle billing
- **Administrators**: System configuration, user management

### User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| `patient` | Low | Can view own records, schedule appointments |
| `nurse` | Medium | Can access patient records, update vitals |
| `doctor` | High | Full medical record access, prescriptions |
| `admin` | Critical | System configuration, all data access |

### Test Credentials

| Username | Password | Role |
|----------|----------|------|
| patient1 | patient123 | patient |
| nurse_jones | nurse123 | nurse |
| dr_smith | doctor123 | doctor |
| admin | admin123 | admin |

---

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Main chat interface
- `POST /api/chat/agent/{agent_name}` - Direct agent communication

### Patient Endpoints
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/{id}` - Get patient details

### Medical Records
- `GET /api/records/{patient_id}` - Get medical records
- `POST /api/records` - Create record

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment

### RAG Endpoints
- `POST /api/rag/query` - Query knowledge base
- `POST /api/rag/upload` - Upload document (VULNERABLE)

### Admin Endpoints
- `POST /api/admin/execute` - Execute commands (VULNERABLE)
- `GET /api/admin/config` - Get system config

---

## Getting Started with Labs

1. **Start with Lab 01** - Direct Prompt Injection (easiest)
2. **Progress sequentially** - Labs build on each other
3. **Read the hints** - Each lab has progressive hints
4. **Check solutions only after trying** - Learn by doing!

Good luck, and happy hacking!

---

## Support

For issues or questions about this lab:
- Check the troubleshooting section in each lab guide
- Review the solutions for guidance
- Ensure your Groq API key is valid

---

*Created for AI Security Training - December 2025*
