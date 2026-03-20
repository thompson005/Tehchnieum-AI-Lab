# SecureBank AI - Instructor Notes

## Lab Overview

**Lab Name**: SecureBank AI - Production-Grade AI Security Lab  
**Target Audience**: Intermediate to Advanced Security Students  
**Estimated Time**: 4-6 hours  
**Difficulty**: Intermediate to Advanced

---

## Teaching Objectives

This lab teaches students about AI-specific security vulnerabilities through a realistic banking simulation. Unlike traditional CTF challenges, this lab emphasizes:

1. **Realistic Architecture**: Production-like microservices setup
2. **Subtle Vulnerabilities**: Flaws that arise from architectural decisions
3. **Business Context**: Understanding real-world impact
4. **Professional Skills**: Documentation and reporting

---

## Pre-Lab Preparation

### System Requirements
- Docker Desktop with 8GB+ RAM allocation
- 10GB free disk space per student
- Stable internet connection (for initial setup)

### Student Prerequisites
- Basic understanding of:
  - Web applications and APIs
  - SQL and databases
  - JavaScript/Python
  - AI/LLM concepts
  - Docker basics

### Instructor Setup (1 hour before class)
```bash
# Test the full deployment
cd LAB-2
docker-compose up -d
docker exec securebank-llm ollama pull llama3

# Verify all services
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:3000

# Test each vulnerability scenario
# (Follow ATTACK_GUIDE.md)
```

---

## Lab Walkthrough

### Introduction (15 minutes)

**Topics to Cover**:
- AI security landscape
- OWASP LLM Top 10 overview
- SecureBank AI scenario
- Lab objectives and structure

**Demo**:
- Show the application interface
- Demonstrate normal functionality
- Highlight AI-powered features
- Explain the penetration tester role

### Scenario A: Prompt Injection (45 minutes)

**Teaching Points**:
- How RAG systems work
- System prompt limitations
- Context injection techniques
- Information disclosure risks

**Guided Exercise**:
1. Show normal chat interaction
2. Demonstrate basic prompt injection
3. Guide students to extract confidential info
4. Discuss why it worked

**Discussion Questions**:
- Why can't system prompts be fully trusted?
- What are the risks of unfiltered RAG context?
- How would you detect this attack?
- What mitigations would you implement?

**Common Student Issues**:
- Ollama not responding → Check service health
- No confidential info returned → Model may be too cautious, try different prompts
- Chat widget not opening → Check frontend logs

### Scenario B: XSS via AI (30 minutes)

**Teaching Points**:
- AI as an XSS vector
- Insecure output handling
- `dangerouslySetInnerHTML` risks
- Content Security Policy

**Guided Exercise**:
1. Show transaction analyzer feature
2. Explain how AI generates HTML
3. Demonstrate XSS execution
4. Show session token theft

**Discussion Questions**:
- Why is AI-generated content risky?
- What makes this different from traditional XSS?
- How would you sanitize AI output?
- What defense-in-depth measures apply?

**Common Student Issues**:
- XSS not executing → Check browser console for CSP errors
- Transaction not found → Verify database seeded correctly
- Analysis not working → Check Ollama service

### Scenario C: Excessive Agency (45 minutes)

**Teaching Points**:
- AI agent security model
- Parameter validation importance
- Confirmation workflows
- Business rule enforcement

**Guided Exercise**:
1. Show normal transfer functionality
2. Demonstrate parameter manipulation
3. Execute unauthorized transfer
4. Check account balances

**Discussion Questions**:
- What makes AI agents risky?
- Why is confirmation important?
- How would you validate LLM outputs?
- What business rules should apply?

**Common Student Issues**:
- Transfer fails → Check account has sufficient balance
- AI doesn't understand → Try different phrasing
- No manipulation → Model may be resistant, try instruction injection

### Scenario D: Data Poisoning (30 minutes)

**Teaching Points**:
- Document processing risks
- Hidden text extraction
- Hallucination vulnerabilities
- Verification importance

**Guided Exercise**:
1. Explain loan application process
2. Show how to create malicious PDF
3. Demonstrate hidden text attack
4. Review AI analysis

**Discussion Questions**:
- Why is document processing risky?
- How can you validate extracted data?
- What verification steps are needed?
- How do you prevent hallucination?

**Common Student Issues**:
- PDF creation difficulties → Provide sample malicious PDF
- Loan endpoint not found → May need to use API directly
- AI doesn't use hidden text → Try different PDF formats

---

## Assessment Guidelines

### Vulnerability Reports (40%)

**Excellent (36-40 points)**:
- All vulnerabilities documented
- Clear reproduction steps
- Accurate risk assessment
- Professional formatting
- Business impact analysis

**Good (32-35 points)**:
- Most vulnerabilities documented
- Adequate reproduction steps
- Reasonable risk assessment
- Good formatting
- Some business context

**Satisfactory (28-31 points)**:
- Basic vulnerabilities documented
- Simple reproduction steps
- Basic risk assessment
- Acceptable formatting
- Limited business context

### Exploitation (30%)

**Excellent (27-30 points)**:
- All scenarios exploited
- Creative attack chains
- Working exploit code
- Evidence captured
- Impact demonstrated

**Good (24-26 points)**:
- Most scenarios exploited
- Some chaining attempted
- Functional exploits
- Good evidence
- Impact shown

**Satisfactory (21-23 points)**:
- Basic exploitation
- Individual attacks
- Simple exploits
- Basic evidence
- Some impact

### Remediation (20%)

**Excellent (18-20 points)**:
- Comprehensive mitigations
- Working implementations
- Thorough testing
- Defense-in-depth
- Usability considered

**Good (16-17 points)**:
- Good mitigations
- Mostly working
- Adequate testing
- Multiple layers
- Reasonable usability

**Satisfactory (14-15 points)**:
- Basic mitigations
- Partially working
- Some testing
- Single layer
- Usability issues

### Reporting (10%)

**Excellent (9-10 points)**:
- Professional quality
- Executive summary
- Technical details
- Clear recommendations
- Well-organized

**Good (8 points)**:
- Good quality
- Summary included
- Technical content
- Recommendations
- Organized

**Satisfactory (7 points)**:
- Acceptable quality
- Basic summary
- Some technical detail
- Some recommendations
- Somewhat organized

---

## Common Questions and Answers

**Q: Why isn't Ollama responding?**
A: Check if the model is pulled: `docker exec securebank-llm ollama list`

**Q: Can I use a different LLM?**
A: Yes, modify `OLLAMA_MODEL` in docker-compose.yml (e.g., mistral, llama2)

**Q: The frontend won't load**
A: Wait 2-3 minutes for webpack compilation. Check logs: `docker-compose logs frontend`

**Q: How do I reset the database?**
A: `docker-compose down -v && docker-compose up -d`

**Q: Can students work in groups?**
A: Yes, but each student should submit individual reports

**Q: What if a student finds a new vulnerability?**
A: Excellent! Award bonus points and document it

**Q: How do I grade the remediation?**
A: Check if exploits no longer work and functionality is preserved

---

## Extension Activities

### For Advanced Students

1. **Automated Testing**: Create pytest/jest tests for vulnerabilities
2. **Monitoring System**: Implement detection for all attack types
3. **Secure Redesign**: Rebuild one component with full security
4. **Research Paper**: Write about AI security in fintech
5. **Additional Vulnerabilities**: Find and document new issues

### For Struggling Students

1. **Guided Walkthrough**: Provide step-by-step instructions
2. **Simplified Scenarios**: Focus on 2-3 main vulnerabilities
3. **Code Review**: Review provided exploit code
4. **Group Discussion**: Facilitate peer learning
5. **Extended Time**: Allow additional lab time

---

## Troubleshooting Guide

### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Clean restart
docker-compose down -v
docker-compose up -d
```

### Ollama Issues
```bash
# Check if running
docker exec securebank-llm ollama list

# Pull model manually
docker exec securebank-llm ollama pull llama3

# Use smaller model
docker exec securebank-llm ollama pull mistral
```

### Database Issues
```bash
# Check connection
docker exec securebank-db psql -U bankadmin -d securebank -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Frontend Issues
```bash
# Check build status
docker-compose logs frontend

# Rebuild
docker-compose build frontend
docker-compose up -d frontend
```

---

## Lab Variations

### Shorter Version (2-3 hours)
- Focus on Scenarios A and B only
- Provide exploit code
- Skip remediation phase
- Simplified reporting

### Longer Version (8-10 hours)
- Add Scenario E: Model Inversion
- Require full secure implementation
- Include automated testing
- Comprehensive research paper

### Group Project Version
- Teams of 3-4 students
- Assign roles (attacker, defender, reporter)
- Competitive element (red team vs blue team)
- Presentation to class

---

## Learning Outcomes Verification

### Knowledge Check Questions

1. **Prompt Injection**:
   - What makes system prompts unreliable?
   - How does RAG introduce security risks?
   - What are effective mitigations?

2. **Output Handling**:
   - Why is AI-generated content risky?
   - What is `dangerouslySetInnerHTML`?
   - How do you sanitize HTML?

3. **Excessive Agency**:
   - What is the principle of least privilege?
   - Why are confirmation steps important?
   - How do you validate LLM outputs?

4. **Data Poisoning**:
   - What is hallucination?
   - How can documents be malicious?
   - What verification is needed?

### Practical Skills Check

- [ ] Can deploy and configure the lab
- [ ] Can identify AI components
- [ ] Can exploit all scenarios
- [ ] Can implement mitigations
- [ ] Can write professional reports

---

## Additional Resources for Instructors

### Research Papers
- "Prompt Injection Attacks and Defenses in LLM-Integrated Applications"
- "Security Risks of Large Language Models"
- "Adversarial Attacks on Neural Networks"

### Industry Reports
- OWASP LLM Top 10
- NIST AI Risk Management Framework
- Microsoft AI Security Guidelines

### Training Materials
- Prompt engineering courses
- AI security certifications
- Secure coding for AI

---

## Feedback and Improvement

### Collect Student Feedback On:
- Lab difficulty and pacing
- Documentation clarity
- Technical issues encountered
- Learning effectiveness
- Suggested improvements

### Continuous Improvement:
- Update scenarios based on new vulnerabilities
- Improve documentation based on common questions
- Add new challenges for advanced students
- Simplify setup process
- Enhance realism

---

## Contact and Support

For questions or issues with this lab:
- Review documentation in `docs/` folder
- Check troubleshooting section
- Consult OWASP LLM resources
- Reach out to lab maintainers

---

**Good luck teaching! This lab provides hands-on experience with cutting-edge AI security concepts. 🎓🔒**
