# MedAssist AI - Professional Setup Guide

## Quick Start (Recommended)

### Option 1: Automated Setup Script

```bash
# Clone or navigate to the lab directory
cd LAB-1

# Run the automated setup script
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start the application
python app.py
```

### Option 2: Docker (Isolated Environment)

```bash
# Ensure Docker is installed
docker --version

# Build and start the container
docker-compose up --build

# Access the application at http://localhost:5000
```

### Option 3: Manual Setup

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies (use the FIXED version)
pip install -r requirements_FIXED.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 4. Initialize database
python setup_database.py

# 5. Start application
python app.py
```

---

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|----------------|----------|
| Python | 3.10+ | https://python.org |
| pip | 23.0+ | Included with Python |
| Git | Any | https://git-scm.com |

### Optional (Recommended)

| Software | Purpose |
|----------|---------|
| Docker Desktop | Isolated environment |
| VS Code | IDE with Python extensions |
| Postman | API testing |
| curl | Command-line API testing |

---

## Getting Your Groq API Key

1. Visit https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (format: `gsk_...`)
6. Add to `.env` file:
   ```
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

**Free Tier Limits:**
- 14,400 requests/day
- 30 requests/minute
- Sufficient for this training lab

---

## Environment Configuration

### .env File Explained

```bash
# ============================================
# REQUIRED - Application will not work without this
# ============================================
GROQ_API_KEY=gsk_your_actual_key_here

# ============================================
# Model Selection (Groq models)
# ============================================
# Fast & Good Quality (Recommended for lab)
LLM_MODEL=llama-3.1-70b-versatile

# Alternatives:
# LLM_MODEL=llama-3.1-8b-instant     # Faster, less capable
# LLM_MODEL=mixtral-8x7b-32768       # Good for complex tasks
# LLM_MODEL=gemma2-9b-it             # Experimental

# ============================================
# Security Settings (KEEP AS-IS FOR LAB)
# ============================================
DISABLE_AUTH=False           # Don't change - needed for some labs
ALLOW_RAG_UPLOADS=True       # Enables RAG poisoning labs
ENABLE_DEBUG_MODE=True       # Exposes debug endpoints for labs

# ============================================
# Performance Tuning (Optional)
# ============================================
MAX_TOKENS=4096              # Max response length
TEMPERATURE=0.7              # Creativity (0.0-1.0)
```

---

## Verification Steps

### 1. Check Python Environment

```bash
python3 --version
# Should show: Python 3.10.x or higher
```

### 2. Verify Dependencies

```bash
pip list | grep -E "(flask|groq|sqlalchemy|chroma)"
# Should show all packages installed
```

### 3. Test Database

```bash
sqlite3 database/medassist.db "SELECT COUNT(*) FROM users;"
# Should return: 4 (default users)
```

### 4. Test Application Startup

```bash
python app.py
# Should show: Starting server on http://0.0.0.0:5000
```

### 5. Test API Endpoint

```bash
curl http://localhost:5000/api/health
# Should return: {"status":"healthy",...}
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'flask'"

**Cause:** Dependencies not installed

**Solution:**
```bash
pip install -r requirements_FIXED.txt
```

---

### Issue: "groq.APIError: Invalid API key"

**Cause:** GROQ_API_KEY not configured or invalid

**Solution:**
1. Check `.env` file has correct key (starts with `gsk_`)
2. Verify key is active at https://console.groq.com
3. Ensure no extra spaces in `.env` file

---

### Issue: "sqlite3.OperationalError: no such table: users"

**Cause:** Database not initialized

**Solution:**
```bash
python setup_database.py
```

---

### Issue: "Address already in use" (Port 5000)

**Cause:** Another service using port 5000

**Solution:**
```bash
# Option 1: Find and kill the process
lsof -ti:5000 | xargs kill -9

# Option 2: Change port in .env
PORT=5001
```

---

### Issue: ChromaDB warnings or errors

**Cause:** ChromaDB not installed or incompatible version

**Solution:**
```bash
pip install --upgrade chromadb sentence-transformers
```

The application will fall back to simple embeddings if ChromaDB is unavailable, but RAG quality will be reduced.

---

### Issue: Slow response times

**Causes & Solutions:**

1. **First request after startup** - Normal; LLM cold start
2. **Using large model** - Switch to `llama-3.1-8b-instant`
3. **Network latency** - Check internet connection
4. **Rate limiting** - Wait 60 seconds between requests

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client (Browser/Postman)                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP
                 │
┌────────────────▼────────────────────────────────────────┐
│  Flask Application (app.py)                             │
│  ├─ Routes (/api/chat, /api/rag, /api/admin)           │
│  └─ Session Management (Vulnerable)                     │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        │        │        │
┌───────▼──┐ ┌───▼────┐ ┌▼─────────┐
│Orchestr- │ │  RAG   │ │ SQLite   │
│ator      │ │ Vector │ │ Database │
│Agent     │ │ Store  │ │          │
└───────┬──┘ └────────┘ └──────────┘
        │
   ┌────┼─────┬─────┬─────┐
   │    │     │     │     │
┌──▼─┐ ┌▼──┐ ┌▼──┐ ┌▼──┐
│Int-│ │Rec│ │App│ │Bil│
│ake │ │ord│ │oin│ │li-│
│    │ │s  │ │tme│ │ng │
└────┘ └───┘ └───┘ └───┘
```

---

## Security Notes

### Intentional Vulnerabilities (For Educational Purposes)

This system contains the following OWASP LLM Top 10 vulnerabilities:

1. **LLM01** - Prompt Injection (Direct & Indirect)
2. **LLM02** - Insecure Output Handling (XSS, SQLi)
3. **LLM03** - Training Data Poisoning (RAG Poisoning)
4. **LLM04** - Model Denial of Service
5. **LLM06** - Sensitive Information Disclosure
6. **LLM07** - Insecure Plugin Design
7. **LLM08** - Excessive Agency

### DO NOT:
- Deploy this in production
- Use on public networks
- Store real patient data
- Use without proper authorization

### DO:
- Run in isolated environment (VM, container, or local)
- Use only for educational purposes
- Follow responsible disclosure practices
- Reset after completing labs

---

## Next Steps

1. Complete initial setup verification
2. Start with Lab 01 (easiest)
3. Progress sequentially through labs
4. Reference solutions only after attempting
5. Document your findings

**Happy Hacking!**

---

## Support & Resources

- Lab Issues: Check troubleshooting section above
- OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- Groq Documentation: https://console.groq.com/docs
- Flask Documentation: https://flask.palletsprojects.com/
