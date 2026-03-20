# MedAssist AI Security Labs - Objectives Guide

## Overview

This professional security training program contains **15 hands-on labs** covering the OWASP Top 10 for LLM Applications. Each lab focuses on exploiting specific vulnerabilities in AI-powered healthcare systems.

---

## Lab Learning Objectives

### **LAB 01: Direct Prompt Injection** (Difficulty: Easy)
**OWASP:** LLM01 - Prompt Injection

**What You'll Learn:**
- How to override system instructions through direct user input
- Techniques to extract sensitive information from system prompts
- Methods to manipulate AI behavior and persona
- Identifying embedded credentials and secrets in prompts

**Your Mission:**
Successfully extract:
- The system prompt content
- Admin API keys and credentials
- Emergency override codes
- Database connection information

**Success Criteria:** Extract at least 3 different types of sensitive information from the system using prompt injection techniques.

---

### **LAB 02: Jailbreaking & Persona Attacks** (Difficulty: Medium)
**OWASP:** LLM01 - Prompt Injection (Jailbreak Variant)

**What You'll Learn:**
- Advanced jailbreaking techniques (DAN, Grandma Exploit, etc.)
- How to bypass AI safety measures through roleplay
- Exploiting the AI's creative and instruction-following capabilities
- Social engineering techniques for AI systems

**Your Mission:**
- Make the AI adopt unrestricted personas
- Bypass content filters using creative framing
- Extract sensitive data through emotional manipulation
- Use translation and encoding tricks to evade detection

**Success Criteria:** Successfully jailbreak the AI using at least 3 different techniques and obtain restricted information.

---

### **LAB 03: Indirect Prompt Injection** (Difficulty: Hard)
**OWASP:** LLM01 - Prompt Injection (Indirect)

**What You'll Learn:**
- RAG poisoning attack methodology
- How to plant persistent backdoors in AI systems
- Document injection techniques that affect all users
- Exploiting trusted data sources

**Your Mission:**
- Upload malicious documents to the RAG system
- Create persistent instructions that trigger on specific queries
- Achieve cross-user contamination
- Establish command injection through trusted content

**Success Criteria:** Successfully poison the RAG system so that normal user queries trigger your malicious instructions.

---

### **LAB 04: Insecure Output Handling - XSS** (Difficulty: Medium)
**OWASP:** LLM02 - Insecure Output Handling

**What You'll Learn:**
- How AI-generated content can contain malicious payloads
- XSS injection through LLM responses
- Bypassing output sanitization
- Cookie theft and session hijacking via AI responses

**Your Mission:**
- Get the AI to generate JavaScript payloads
- Achieve XSS through various vectors (script tags, event handlers, SVG, etc.)
- Demonstrate browser-based exploitation
- Create persistent XSS through RAG injection

**Success Criteria:** Successfully execute JavaScript in the browser through AI-generated content.

---

### **LAB 05: SQL Injection via AI** (Difficulty: Hard)
**OWASP:** LLM02 - Insecure Output Handling (SQL Context)

**What You'll Learn:**
- Manipulating AI to generate SQL injection payloads
- UNION-based attacks for data extraction
- Blind SQL injection techniques
- Second-order SQL injection through AI

**Your Mission:**
- Extract data from the database via SQL injection
- Bypass authentication using SQL injection
- Modify database records through malicious queries
- Demonstrate database enumeration

**Success Criteria:** Successfully extract user credentials or sensitive patient data from the database.

---

### **LAB 06: Sensitive Information Disclosure** (Difficulty: Easy)
**OWASP:** LLM06 - Sensitive Information Disclosure

**What You'll Learn:**
- Comprehensive information gathering techniques
- System prompt extraction methods
- PII and credential discovery
- API endpoint enumeration
- RAG knowledge base dumping

**Your Mission:**
Extract ALL types of sensitive data:
- System prompts and configurations
- User credentials (usernames, passwords, API keys)
- Patient PII (SSNs, addresses, medical records)
- Database schemas and table structures
- Internal API endpoints and documentation

**Success Criteria:** Create a comprehensive report documenting at least 5 different categories of sensitive information extracted.

---

### **LAB 07: RAG Poisoning** (Difficulty: Hard)
**OWASP:** LLM03 - Training Data Poisoning (RAG Context)

**What You'll Learn:**
- Advanced RAG poisoning techniques
- Relevance manipulation and keyword stuffing
- Metadata instruction injection
- Creating trigger-based backdoors
- Semantic poisoning for high retrieval rates

**Your Mission:**
- Poison the knowledge base with malicious instructions
- Create cross-query contamination
- Establish persistent backdoors with specific triggers
- Manipulate source citation exploitation
- Achieve maximum retrieval relevance for your poisoned content

**Success Criteria:** Plant a backdoor that activates on specific keywords and affects multiple different user queries.

---

### **LAB 08: RAG Data Exfiltration** (Difficulty: Medium)
**OWASP:** LLM06 - Sensitive Information Disclosure (RAG Context)

**What You'll Learn:**
- RAG knowledge base enumeration
- Keyword-based data extraction
- Structured data extraction (JSON/CSV)
- Chunk-by-chunk extraction techniques
- Metadata exploitation
- Cross-reference attacks

**Your Mission:**
- Map the entire RAG knowledge base
- Extract all sensitive documents
- Recover passwords, API keys, and credentials from RAG
- Use similarity search for data discovery
- Automate extraction with scripts

**Success Criteria:** Extract at least 10 sensitive pieces of information stored in the RAG system.

---

### **LAB 09: Excessive Agency - Function Abuse** (Difficulty: Hard)
**OWASP:** LLM08 - Excessive Agency

**What You'll Learn:**
- AI agent tool enumeration
- Abusing function calling capabilities
- SQL execution through tools
- System command injection (RCE)
- File system access exploitation

**Your Mission:**
- Discover all available AI tools/functions
- Execute arbitrary SQL queries through tools
- Achieve remote code execution
- Read sensitive files (config.py, .env, etc.)
- Write malicious files to the system

**Success Criteria:** Successfully execute system commands and access sensitive files through AI function calling.

---

### **LAB 10: Privilege Escalation via AI Agents** (Difficulty: Expert)
**OWASP:** LLM08 - Excessive Agency (Privilege Context)

**What You'll Learn:**
- Multi-agent architecture exploitation
- Role confusion and impersonation attacks
- Cross-agent command injection
- Orchestrator bypass techniques
- Trust relationship exploitation

**Your Mission:**
- Map the complete agent architecture
- Impersonate higher-privilege agents (admin, orchestrator)
- Execute privileged operations without authorization
- Bypass agent-to-agent authentication
- Achieve lateral movement across agents

**Success Criteria:** Successfully execute admin-level commands by exploiting agent trust relationships.

---

### **LAB 11: Plugin/Tool Vulnerabilities** (Difficulty: Hard)
**OWASP:** LLM07 - Insecure Plugin Design

**What You'll Learn:**
- AI tool enumeration and documentation discovery
- SQL parameter injection in tools
- Command injection via tool parameters
- Path traversal in file tools
- Authentication bypass in tool access

**Your Mission:**
- Enumerate all available AI tools
- Inject malicious parameters into tool calls
- Achieve command injection through tools
- Exploit file operations for path traversal
- Bypass tool-level authentication

**Success Criteria:** Successfully exploit at least 3 different tool vulnerabilities.

---

### **LAB 12: Model Denial of Service** (Difficulty: Medium)
**OWASP:** LLM04 - Model Denial of Service

**What You'll Learn:**
- Context window flooding techniques
- Token generation amplification
- Recursive and expensive computational tasks
- Tool abuse for resource exhaustion
- Rate limiting bypass

**Your Mission:**
- Cause AI performance degradation
- Flood context windows (50,000+ characters)
- Force expensive token generation (10,000+ words)
- Trigger recursive processing loops
- Exhaust API rate limits

**Success Criteria:** Successfully degrade AI performance or trigger resource exhaustion warnings.

---

### **LAB 13: System Prompt Extraction** (Difficulty: Medium)
**OWASP:** LLM01 - Prompt Injection (System Prompt Leakage)

**What You'll Learn:**
- Advanced system prompt extraction techniques
- Instruction framing tricks
- Role manipulation (admin, developer, tester personas)
- Linguistic manipulation (translation, summarization)
- Bypassing regex-based protections

**Your Mission:**
Extract the complete system prompt including:
- Admin API keys
- Database credentials
- Emergency override codes
- Default passwords
- Internal system configurations

**Success Criteria:** Extract the full system prompt with all embedded credentials for at least 3 different agents.

---

### **LAB 14: Multi-Turn Jailbreaking (CRESCENDO)** (Difficulty: Hard)
**OWASP:** LLM01 - Prompt Injection (Multi-turn)

**What You'll Learn:**
- CRESCENDO attack methodology (Microsoft Research)
- Gradual escalation techniques
- Context building over multiple turns
- The "Helpful Assistant" pattern
- Trust establishment before exploitation

**Your Mission:**
- Build a multi-turn conversation that gradually escalates
- Start with benign requests and slowly increase sensitivity
- Establish trust before making malicious requests
- Use conversation history to your advantage
- Achieve restricted actions through gradual persuasion

**Success Criteria:** Successfully extract sensitive information using a multi-turn conversation (minimum 5 turns).

---

### **LAB 15: Context Overflow Attacks** (Difficulty: Hard)
**OWASP:** LLM04 - Model Denial of Service (Context Variant)

**What You'll Learn:**
- Context window limitations (128K tokens for Llama 3.3)
- System prompt displacement/eviction
- Conversation history overflow exploitation
- Context pollution techniques
- Instruction amnesia attacks

**Your Mission:**
- Overflow the context window to displace system instructions
- Cause the AI to "forget" its safety guardrails
- Inject your own instructions after displacement
- Achieve unrestricted behavior through context manipulation

**Success Criteria:** Successfully displace the system prompt and make the AI follow your instructions instead.

---

## General Success Metrics

For each lab, you should be able to:

1. **Understand the Vulnerability:** Clearly explain how the vulnerability works
2. **Successful Exploitation:** Demonstrate at least one working exploit
3. **Document Findings:** Record your successful payloads and observations
4. **Defense Awareness:** Understand how to defend against the attack

---

## Lab Progression

**Beginner Path:** LAB01 → LAB02 → LAB06 → LAB12 → LAB13

**Intermediate Path:** LAB04 → LAB08 → LAB11 → LAB14

**Advanced Path:** LAB03 → LAB05 → LAB07 → LAB09 → LAB10 → LAB15

---

## Professional Tips

- **Document Everything:** Keep detailed notes of successful attacks
- **Think Like an Attacker:** Be creative and try variations
- **Read Error Messages:** They often contain valuable information
- **Use the Browser Console:** Essential for XSS labs (F12 in most browsers)
- **Automate When Possible:** Write scripts for repetitive tasks
- **Study the Hints:** Each exercise has expandable hints if you get stuck

---

## Important Notes

⚠️ **This is a controlled training environment.** All vulnerabilities are intentional for educational purposes.

🎯 **Completion Time:** Most labs take 30-60 minutes depending on experience level.

📝 **Deliverables:** Solutions document available separately for instructors.

---

*Good luck, and happy hacking!* 🔒
