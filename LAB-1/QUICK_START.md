# MedAssist AI - Quick Start Card

## 30-Second Setup

```bash
./setup.sh              # Run automated setup
source venv/bin/activate # Activate environment
python app.py            # Start application
```

Visit: **http://localhost:5000**

---

## Or Use Docker (Even Faster)

```bash
docker-compose up --build
```

Visit: **http://localhost:5000**

---

## Common Commands

| Task | Command |
|------|---------|
| Start application | `make run` |
| Run tests | `make test` |
| Reset database | `make reset-db` |
| Clean files | `make clean` |
| Start with Docker | `make docker-up` |
| Stop Docker | `make docker-down` |

---

## Test Credentials

| Username | Password | Role |
|----------|----------|------|
| patient1 | patient123 | patient |
| nurse_jones | nurse123 | nurse |
| dr_smith | doctor123 | doctor |
| admin | admin123 | admin |

---

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `http://localhost:5000/` | Home page |
| `http://localhost:5000/chat` | Chat interface |
| `http://localhost:5000/admin` | Admin panel |
| `http://localhost:5000/api/health` | Health check |

---

## API Testing Examples

### Chat with AI
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need help scheduling an appointment"}'
```

### Query RAG Knowledge Base
```bash
curl -X POST http://localhost:5000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the procedure for patient intake?"}'
```

### Get Patient Info
```bash
curl http://localhost:5000/api/patients/1
```

---

## Need API Key?

1. Visit: https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

---

## Lab Progression

Start here → Lab 01 (easiest) → Progress sequentially → Lab 15 (hardest)

| Difficulty | Labs |
|-----------|------|
| Easy | 1, 6 |
| Medium | 2, 4, 8, 12, 13 |
| Hard | 3, 5, 7, 9, 11, 14, 15 |
| Expert | 10 |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dependencies missing | `pip install -r requirements_FIXED.txt` |
| Port 5000 in use | `lsof -ti:5000 \| xargs kill -9` |
| Database error | `make reset-db` |
| Import errors | `source venv/bin/activate` |

Full guide: **SETUP_GUIDE.md**

---

## Important Reminders

WARNING: This is a VULNERABLE system for training only
WARNING: Do NOT deploy to production
WARNING: Do NOT use real patient data
WARNING: Run in isolated environment only

---

## Resources

- Full Setup Guide: `SETUP_GUIDE.md`
- Lab Exercises: `labs/LAB01_*.md` through `LAB15_*.md`
- Solutions: `solutions/solutions.md` (spoilers!)
- Help: `make help`

---

**Happy Hacking!**
