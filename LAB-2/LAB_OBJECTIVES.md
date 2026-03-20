# SecureBank AI - Lab Objectives

## Course Information

**Lab**: LAB-2 - Production-Grade AI Security  
**Course**: AI Security & OWASP LLM Top 10  
**Duration**: 4-6 hours  
**Difficulty**: Intermediate to Advanced  
**Prerequisites**: Basic understanding of web applications, APIs, and AI/LLM concepts

---

## Learning Objectives

By completing this lab, students will be able to:

### 1. Understand AI-Specific Vulnerabilities
- Identify prompt injection attack vectors
- Recognize RAG (Retrieval-Augmented Generation) security risks
- Understand LLM hallucination and data poisoning
- Assess excessive agency vulnerabilities in AI agents

### 2. Apply OWASP LLM Top 10 Knowledge
- **LLM01**: Prompt Injection
- **LLM02**: Insecure Output Handling
- **LLM03**: Training Data Poisoning
- **LLM06**: Sensitive Information Disclosure
- **LLM08**: Excessive Agency

### 3. Exploit Production-Like Systems
- Navigate realistic banking application architecture
- Identify subtle architectural flaws
- Chain multiple vulnerabilities for maximum impact
- Think like an attacker in production environments

### 4. Develop Secure AI Systems
- Implement proper input validation for AI systems
- Design secure output handling mechanisms
- Apply defense-in-depth strategies
- Create monitoring and detection systems

### 5. Conduct Professional Security Assessments
- Perform systematic vulnerability discovery
- Document findings professionally
- Assess business impact and risk
- Provide actionable remediation guidance

---

## Lab Structure

### Phase 1: Reconnaissance (30 minutes)
**Objective**: Understand the application architecture and identify AI components

**Tasks**:
- [ ] Deploy the SecureBank AI environment
- [ ] Explore the user interface and features
- [ ] Identify all AI-powered components
- [ ] Review API documentation
- [ ] Map the attack surface

**Deliverables**:
- Architecture diagram
- List of AI features
- Initial threat model

### Phase 2: Vulnerability Discovery (2 hours)
**Objective**: Systematically test each vulnerability scenario

**Tasks**:
- [ ] Test Scenario A: Prompt Injection on Eva Support Bot
- [ ] Test Scenario B: XSS via Transaction Analyzer
- [ ] Test Scenario C: Unauthorized Transfers via Smart Transfer
- [ ] Test Scenario D: Loan Application Manipulation
- [ ] Document each vulnerability with evidence

**Deliverables**:
- Vulnerability report for each scenario
- Screenshots and proof-of-concept code
- Risk assessment for each finding

### Phase 3: Exploitation (1.5 hours)
**Objective**: Develop working exploits and assess real-world impact

**Tasks**:
- [ ] Create exploit scripts/payloads
- [ ] Chain vulnerabilities for maximum impact
- [ ] Demonstrate business impact
- [ ] Test detection evasion techniques

**Deliverables**:
- Working exploit code
- Attack chain documentation
- Impact analysis

### Phase 4: Remediation (1.5 hours)
**Objective**: Design and implement security controls

**Tasks**:
- [ ] Review mitigation strategies
- [ ] Implement fixes for each vulnerability
- [ ] Test that fixes work without breaking functionality
- [ ] Verify exploits no longer work

**Deliverables**:
- Secure code implementations
- Testing documentation
- Before/after comparison

### Phase 5: Reporting (30 minutes)
**Objective**: Create professional security assessment report

**Tasks**:
- [ ] Compile all findings
- [ ] Prioritize by risk and impact
- [ ] Provide executive summary
- [ ] Include technical details and remediation steps

**Deliverables**:
- Professional security assessment report

---

## Detailed Scenario Objectives

### Scenario A: Eva Support Bot (Prompt Injection)

**Learning Objectives**:
- Understand how RAG systems work
- Identify weak system prompts
- Exploit context injection vulnerabilities
- Extract sensitive information from knowledge bases

**Success Criteria**:
- [ ] Bypass system prompt restrictions
- [ ] Extract confidential merger information
- [ ] Retrieve API keys from documents
- [ ] Understand why the attack worked
- [ ] Propose effective mitigations

**Skills Developed**:
- Prompt engineering
- RAG security analysis
- Information disclosure assessment
- Content filtering design

---

### Scenario B: Transaction Analyzer (XSS via AI)

**Learning Objectives**:
- Understand AI as an XSS vector
- Recognize insecure output handling
- Exploit `dangerouslySetInnerHTML`
- Chain XSS with other vulnerabilities

**Success Criteria**:
- [ ] Execute JavaScript via AI-generated content
- [ ] Steal session tokens
- [ ] Perform actions as victim user
- [ ] Understand the attack chain
- [ ] Implement proper sanitization

**Skills Developed**:
- XSS exploitation
- Output sanitization
- Content Security Policy
- Secure rendering practices

---

### Scenario C: Smart Transfer (Excessive Agency)

**Learning Objectives**:
- Understand AI agent security risks
- Identify missing confirmation steps
- Exploit parameter manipulation
- Recognize business rule gaps

**Success Criteria**:
- [ ] Execute unauthorized transfers
- [ ] Manipulate transfer amounts
- [ ] Bypass intended restrictions
- [ ] Understand agent security model
- [ ] Design secure agent workflows

**Skills Developed**:
- AI agent security
- Parameter validation
- Business logic testing
- Confirmation workflow design

---

### Scenario D: Loan Application (Data Poisoning)

**Learning Objectives**:
- Understand document processing risks
- Exploit hidden text in PDFs
- Recognize hallucination vulnerabilities
- Assess data validation gaps

**Success Criteria**:
- [ ] Manipulate loan approval with fake data
- [ ] Inject instructions via hidden text
- [ ] Achieve favorable terms
- [ ] Understand verification importance
- [ ] Design secure document processing

**Skills Developed**:
- Document security
- Data validation
- Hallucination mitigation
- Verification workflows

---

## Assessment Criteria

### Technical Skills (40%)
- Successful exploitation of all scenarios
- Quality of exploit code
- Understanding of underlying vulnerabilities
- Ability to implement fixes

### Analysis & Documentation (30%)
- Thoroughness of vulnerability analysis
- Quality of risk assessment
- Clarity of technical documentation
- Professional reporting

### Security Thinking (20%)
- Ability to chain vulnerabilities
- Creative attack approaches
- Understanding of business impact
- Defense-in-depth mindset

### Remediation (10%)
- Effectiveness of proposed mitigations
- Implementation quality
- Testing thoroughness
- Consideration of usability

---

## Grading Rubric

### Excellent (90-100%)
- All scenarios exploited successfully
- Creative attack chains demonstrated
- Comprehensive documentation
- Effective mitigations implemented
- Professional-quality report

### Good (80-89%)
- Most scenarios exploited
- Good understanding of vulnerabilities
- Clear documentation
- Reasonable mitigations proposed
- Solid technical report

### Satisfactory (70-79%)
- Basic exploitation successful
- Adequate understanding
- Acceptable documentation
- Basic mitigations identified
- Complete report

### Needs Improvement (<70%)
- Limited exploitation success
- Gaps in understanding
- Incomplete documentation
- Weak mitigation proposals
- Insufficient reporting

---

## Bonus Challenges

### Challenge 1: Zero-Day Discovery (10 bonus points)
Discover a vulnerability not documented in the lab materials.

### Challenge 2: Advanced Exploitation (10 bonus points)
Chain all four vulnerabilities into a single attack achieving:
- Information disclosure
- Session hijacking
- Financial fraud
- Persistence

### Challenge 3: Automated Testing (10 bonus points)
Create automated tests that detect all four vulnerability types.

### Challenge 4: Secure Implementation (10 bonus points)
Implement a fully secure version of one AI agent with comprehensive tests.

### Challenge 5: Research Paper (15 bonus points)
Write a 5-page research paper on AI security in financial services.

---

## Resources Provided

### Documentation
- Complete setup guide
- Vulnerability scenarios
- Attack guide with step-by-step instructions
- Mitigation strategies
- Project structure documentation

### Code
- Full-stack application (Frontend + Backend)
- Vulnerable AI agents
- Database with test data
- Docker environment

### Tools
- Pre-configured development environment
- API documentation (Swagger/OpenAPI)
- Database access
- Log viewing capabilities

---

## Expected Outcomes

After completing this lab, students should:

1. **Understand** the unique security challenges of AI-powered applications
2. **Identify** AI-specific vulnerabilities in production systems
3. **Exploit** these vulnerabilities ethically and systematically
4. **Remediate** vulnerabilities with effective security controls
5. **Communicate** findings professionally to technical and non-technical audiences

---

## Real-World Applications

This lab prepares students for:

- **AI Security Auditing**: Assessing AI-powered applications
- **Secure AI Development**: Building secure AI systems
- **Penetration Testing**: Testing AI components in engagements
- **Security Architecture**: Designing secure AI architectures
- **Incident Response**: Responding to AI-related security incidents

---

## Time Allocation

| Phase | Duration | Percentage |
|-------|----------|------------|
| Reconnaissance | 30 min | 10% |
| Vulnerability Discovery | 2 hours | 40% |
| Exploitation | 1.5 hours | 30% |
| Remediation | 1.5 hours | 30% |
| Reporting | 30 min | 10% |
| **Total** | **6 hours** | **100%** |

---

## Submission Requirements

### Required Deliverables
1. **Vulnerability Report** (PDF)
   - Executive summary
   - Technical findings
   - Risk assessment
   - Remediation recommendations

2. **Exploit Code** (GitHub repository)
   - Working exploits for all scenarios
   - Documentation
   - Test cases

3. **Secure Implementation** (Code)
   - Fixed versions of vulnerable components
   - Unit tests
   - Security tests

4. **Presentation** (Slides)
   - 10-minute presentation
   - Key findings
   - Demonstrations
   - Recommendations

### Optional Deliverables
- Video demonstration of exploits
- Automated testing suite
- Research paper
- Additional vulnerability discoveries

---

## Support and Resources

### Getting Help
- Review documentation in `docs/` folder
- Check `SETUP_GUIDE.md` for troubleshooting
- Consult `ATTACK_GUIDE.md` for hints
- Review `MITIGATIONS.md` for remediation ideas

### External Resources
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Prompt Injection Primer](https://simonwillison.net/2023/Apr/14/worst-that-can-happen/)

---

## Academic Integrity

This lab is designed for educational purposes. Students must:
- Work independently (unless group work is specified)
- Only test the provided lab environment
- Not use these techniques on production systems
- Cite any external resources used
- Follow responsible disclosure practices

---

**Good luck, and happy hacking! 🚀🔒**
