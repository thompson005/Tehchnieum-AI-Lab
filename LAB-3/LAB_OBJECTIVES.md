# LAB-3: ShopSec-AI Learning Objectives

## Overview

This lab provides hands-on experience with AI security vulnerabilities in e-commerce contexts. Unlike traditional web application security, these attacks exploit the unique characteristics of Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG) systems.

## Core Learning Objectives

### 1. Understanding Agentic AI Vulnerabilities

**What You'll Learn:**
- How AI agents with tool-calling capabilities can be manipulated
- The difference between prompt-based and code-based security controls
- Why "helpful" AI behavior creates security risks
- The concept of "excessive agency" in LLM applications

**Practical Skills:**
- Identify vulnerable agent architectures
- Exploit prompt injection in multi-agent systems
- Bypass business logic through LLM reasoning manipulation
- Recognize when AI agents have too much authority

### 2. Prompt Injection Techniques

**What You'll Learn:**
- Direct vs. indirect prompt injection
- Jailbreaking techniques specific to e-commerce
- Social engineering of AI agents
- Context manipulation and confusion attacks

**Practical Skills:**
- Craft effective prompt injection payloads
- Override system prompts and safety guidelines
- Exploit role-playing and authority claims
- Chain multiple injection techniques

### 3. RAG System Exploitation

**What You'll Learn:**
- How RAG systems retrieve and use context
- The risks of including user-generated content in retrieval
- Semantic search manipulation
- Vector database poisoning

**Practical Skills:**
- Inject malicious content into RAG corpora
- Manipulate search rankings through semantic poisoning
- Hide instructions in user-generated content
- Exploit trust boundaries in retrieval systems

### 4. Business Logic Bypass

**What You'll Learn:**
- How AI agents interpret and enforce business rules
- The gap between natural language policies and code enforcement
- Price manipulation techniques
- Policy hallucination attacks

**Practical Skills:**
- Bypass discount limits and pricing controls
- Manipulate refund and return policies
- Exploit inventory management systems
- Abuse payment processing logic

### 5. Data Leakage and Privacy

**What You'll Learn:**
- How RAG systems can leak sensitive information
- Tenant isolation failures in multi-user systems
- Cross-user data access through semantic search
- Information disclosure through agent responses

**Practical Skills:**
- Extract other users' data through crafted queries
- Exploit fuzzy matching in search systems
- Access admin-only information
- Retrieve hidden data through context manipulation

### 6. Defensive Security Measures

**What You'll Learn:**
- NeMo Guardrails and deterministic safety boundaries
- Input sanitization for LLM applications
- Output validation and anomaly detection
- Secure agent architecture patterns

**Practical Skills:**
- Implement code-based validation for agent tools
- Design context tainting systems for RAG
- Create effective system prompts with security in mind
- Build monitoring and alerting for AI systems

## Lab-Specific Objectives

### LAB 01: Price Manipulation
- Exploit prompt injection to bypass discount limits
- Understand excessive agency vulnerabilities
- Purchase high-value items for minimal cost
- **Flag**: `SHOPSEC{pr1c3_m4n1pul4t10n_m4st3r}`

### LAB 02: Negotiation Agent Jailbreaking
- Advanced prompt injection techniques
- Multi-turn conversation exploitation
- Persistent jailbreak maintenance
- **Flag**: `SHOPSEC{n3g0t14t10n_j41lbr34k_pr0}`

### LAB 03: RAG Poisoning
- Inject malicious content into product reviews
- Manipulate search rankings
- Exploit indirect prompt injection
- **Flag**: `SHOPSEC{r4g_p01s0n1ng_3xp3rt}`

### LAB 04: Policy Hallucination
- Social engineer support agents
- Bypass refund policies
- Exploit context confusion
- **Flag**: `SHOPSEC{p0l1cy_h4lluc1n4t10n_h4ck3r}`

### LAB 05: Data Leakage
- Access other users' order histories
- Exploit RAG tenant isolation failures
- Extract sensitive information
- **Flag**: `SHOPSEC{d4t4_l34k4g3_n1nj4}`

### LAB 06: Inventory DoS
- Abuse reservation systems
- Exploit agent tool calls
- Create business disruption
- **Flag**: `SHOPSEC{1nv3nt0ry_d0s_m4st3r}`

### LAB 07: Visual Search Attack
- Adversarial image attacks on CLIP
- Manipulate image-based search
- Exploit multimodal AI systems
- **Flag**: `SHOPSEC{v1su4l_s34rch_h4ck3r}`

### LAB 08: Payment Gateway Bypass
- Exploit payment processing logic
- Manipulate transaction amounts
- Bypass payment verification
- **Flag**: `SHOPSEC{p4ym3nt_byp4ss_pr0}`

### LAB 09: Discount Stacking
- Chain multiple discount mechanisms
- Exploit race conditions
- Abuse promotional logic
- **Flag**: `SHOPSEC{d1sc0unt_st4ck1ng_k1ng}`

### LAB 10: Privilege Escalation
- Escalate from customer to admin
- Exploit agent authorization flaws
- Access admin-only functions
- **Flag**: `SHOPSEC{pr1v_3sc4l4t10n_g0d}`

## CTF Challenge: The Ultimate Exploit

**Objective**: Chain multiple vulnerabilities to achieve maximum impact

**Requirements**:
1. Use RAG poisoning to inject malicious content
2. Exploit price manipulation to get extreme discounts
3. Escalate privileges to admin level
4. Extract all CTF flags
5. Access hidden admin data

**Final Flag**: `SHOPSEC{ch41n_4tt4ck_m4st3rm1nd}`

## Skills Assessment Matrix

| Skill | Beginner | Intermediate | Advanced | Expert |
|-------|----------|--------------|----------|--------|
| **Prompt Injection** | Complete LAB 01 | Complete LAB 02 | Complete LAB 04 | Chain 3+ techniques |
| **RAG Exploitation** | Understand RAG | Complete LAB 03 | Bypass sanitization | Multi-vector poisoning |
| **Business Logic** | Identify flaws | Complete LAB 06 | Exploit race conditions | Design secure systems |
| **Defense** | Understand concepts | Implement guardrails | Design secure architecture | Red team + Blue team |

## Real-World Applications

### For Security Professionals
- Assess AI-powered applications for vulnerabilities
- Conduct red team exercises on LLM systems
- Design secure AI agent architectures
- Implement defensive measures

### For Developers
- Understand AI security risks in your applications
- Implement proper validation and guardrails
- Design secure RAG systems
- Build monitoring and detection systems

### For Researchers
- Explore novel attack vectors
- Develop new defensive techniques
- Contribute to AI security knowledge
- Publish findings responsibly

## Success Criteria

You've successfully completed this lab when you can:

1. ✅ Explain the difference between traditional web security and AI security
2. ✅ Identify vulnerable AI agent architectures
3. ✅ Craft effective prompt injection attacks
4. ✅ Exploit RAG systems through indirect injection
5. ✅ Bypass business logic using LLM manipulation
6. ✅ Implement defensive measures (guardrails, validation, monitoring)
7. ✅ Capture all 10 CTF flags
8. ✅ Complete the ultimate chain attack challenge

## Time Estimates

- **Quick Start**: 30 minutes (setup + LAB 01)
- **Core Labs (1-5)**: 4-6 hours
- **Advanced Labs (6-10)**: 6-8 hours
- **CTF Challenge**: 2-4 hours
- **Total**: 12-18 hours for complete mastery

## Prerequisites

### Required Knowledge
- Basic understanding of LLMs and how they work
- Familiarity with REST APIs
- Basic Python programming
- Understanding of web application security concepts

### Recommended Background
- Experience with prompt engineering
- Knowledge of RAG systems
- Familiarity with Docker
- Understanding of e-commerce business logic

### Optional But Helpful
- Experience with LangChain or similar frameworks
- Knowledge of vector databases
- Understanding of NLP and embeddings
- Red team or penetration testing experience

## Resources for Further Learning

### AI Security
- [OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [AI Security Research Papers](https://arxiv.org/list/cs.CR/recent)
- [LLM Security Blog Posts](https://simonwillison.net/tags/security/)

### Defensive Techniques
- [NeMo Guardrails Documentation](https://github.com/NVIDIA/NeMo-Guardrails)
- [LangChain Security Best Practices](https://python.langchain.com/docs/security)
- [Prompt Injection Defense Strategies](https://learnprompting.org/docs/prompt_hacking/defensive_measures)

### Real-World Incidents
- [Air Canada Chatbot Case](https://www.cbc.ca/news/canada/british-columbia/air-canada-chatbot-lawsuit-1.7115877)
- [Chevrolet Dealership Bot](https://www.businessinsider.com/chatgpt-chevrolet-dealership-chatbot-customer-buy-car-for-dollar-2023-12)
- [Bing Chat Manipulation](https://greshake.github.io/)

## Certification Path

Upon completion, you'll have demonstrated:

1. **AI Security Fundamentals** ⭐
   - Understanding of LLM vulnerabilities
   - Basic prompt injection skills
   - Awareness of AI-specific risks

2. **AI Red Team Skills** ⭐⭐
   - Advanced exploitation techniques
   - RAG system manipulation
   - Business logic bypass

3. **AI Security Architecture** ⭐⭐⭐
   - Defensive implementation
   - Secure system design
   - Monitoring and detection

## Next Steps After Completion

1. **Apply to Real Systems**: Conduct authorized security assessments
2. **Contribute**: Share findings with the security community
3. **Specialize**: Focus on specific areas (RAG security, agent safety, etc.)
4. **Teach**: Help others learn AI security
5. **Research**: Explore novel attack vectors and defenses

---

**Remember**: These skills are powerful. Use them responsibly and only in authorized environments.
