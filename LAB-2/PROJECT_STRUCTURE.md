# SecureBank AI - Project Structure

```
LAB-2/
├── README.md                          # Main documentation
├── QUICK_START.md                     # 5-minute setup guide
├── SETUP_GUIDE.md                     # Detailed setup instructions
├── PROJECT_STRUCTURE.md               # This file
├── Makefile                           # Convenience commands
├── docker-compose.yml                 # Full stack orchestration
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
│
├── docs/                              # Documentation
│   ├── SCENARIOS.md                   # Vulnerability scenarios
│   ├── ATTACK_GUIDE.md                # Step-by-step exploits
│   └── MITIGATIONS.md                 # Security fixes
│
├── database/                          # Database setup
│   ├── init.sql                       # Schema and seed data
│   └── policies/                      # RAG knowledge base
│       ├── customer_support_policy.md
│       └── confidential_merger_plans.pdf.md
│
├── backend/                           # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py                    # FastAPI app entry
│       ├── core/                      # Core utilities
│       │   ├── __init__.py
│       │   ├── config.py              # Settings
│       │   ├── database.py            # DB connection
│       │   ├── redis_client.py        # Redis client
│       │   └── security.py            # Auth utilities
│       ├── api/                       # API routes
│       │   ├── __init__.py
│       │   ├── auth.py                # Authentication
│       │   ├── accounts.py            # Account endpoints
│       │   ├── transactions.py        # Transaction endpoints
│       │   ├── chat.py                # Chat endpoints
│       │   └── loans.py               # Loan endpoints
│       └── agents/                    # AI Agents (VULNERABLE)
│           ├── __init__.py
│           ├── support_bot.py         # Scenario A: Prompt Injection
│           ├── transaction_agent.py   # Scenario B: XSS
│           ├── transfer_agent.py      # Scenario C: Excessive Agency
│           └── loan_agent.py          # Scenario D: Data Poisoning
│
└── frontend/                          # React application
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js                   # React entry
        ├── index.css                  # Tailwind styles
        ├── App.js                     # Main app component
        ├── services/
        │   └── api.js                 # API client
        ├── pages/
        │   ├── Login.js               # Login page
        │   └── Dashboard.js           # Main dashboard
        └── components/
            ├── ChatWidget.js          # Eva chat (Scenario A)
            ├── TransactionAnalyzer.js # XSS vector (Scenario B)
            ├── SmartTransfer.js       # Agent transfer (Scenario C)
            ├── AccountCard.js         # Account display
            └── TransactionList.js     # Transaction table
```

## Key Files by Scenario

### Scenario A: Prompt Injection & RAG Poisoning
- **Backend**: `backend/app/agents/support_bot.py`
- **Frontend**: `frontend/src/components/ChatWidget.js`
- **Data**: `database/policies/confidential_merger_plans.pdf.md`
- **Vulnerability**: Weak system prompt, unfiltered RAG context

### Scenario B: Insecure Output Handling (XSS)
- **Backend**: `backend/app/agents/transaction_agent.py`
- **Frontend**: `frontend/src/components/TransactionAnalyzer.js`
- **Data**: `database/init.sql` (malicious transaction)
- **Vulnerability**: `dangerouslySetInnerHTML` without sanitization

### Scenario C: Excessive Agency
- **Backend**: `backend/app/agents/transfer_agent.py`
- **API**: `backend/app/api/transactions.py`
- **Frontend**: `frontend/src/components/SmartTransfer.js`
- **Vulnerability**: No confirmation, blind trust in LLM parameters

### Scenario D: Data Poisoning & Hallucination
- **Backend**: `backend/app/agents/loan_agent.py`
- **API**: `backend/app/api/loans.py`
- **Vulnerability**: Hidden text extraction, no validation

## Technology Stack

### Backend
- **Framework**: FastAPI 0.109.0
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **LLM**: Ollama (Llama 3)
- **Vector DB**: ChromaDB
- **Embeddings**: sentence-transformers

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Charts**: Recharts

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (via API Gateway pattern)
- **Orchestration**: Docker Compose

## Security Features (Intentionally Vulnerable)

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Session management with Redis

### Vulnerabilities (By Design)
1. ✅ Weak system prompts
2. ✅ Unfiltered RAG context
3. ✅ No HTML sanitization
4. ✅ No confirmation steps
5. ✅ Blind trust in LLM outputs
6. ✅ Hidden text extraction
7. ✅ No business rule validation
8. ✅ Missing rate limiting

## Corporate Realism Features

### UI/UX
- Professional fintech design
- Navy blue and gold color scheme
- Loading states and animations
- Session timeout warnings
- Legal disclaimers
- Privacy policy footers

### Banking Features
- Multiple account types
- Transaction history
- Balance display
- Transfer functionality
- Loan applications
- AI-powered insights

### AI Features
- Natural language chat
- Smart transfers
- Transaction analysis
- Document processing
- Beta/Labs section

## Development Workflow

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Rebuild service
docker-compose build backend
docker-compose up -d backend
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - List accounts
- `GET /api/accounts/{account_number}/balance` - Get balance

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions/transfer` - Smart transfer (VULNERABLE)
- `POST /api/transactions/analyze` - AI analysis (VULNERABLE)

### Chat
- `POST /api/chat/support` - Chat with Eva (VULNERABLE)
- `GET /api/chat/history/{session_id}` - Get chat history

### Loans
- `POST /api/loans/apply` - Apply for loan (VULNERABLE)

## Database Schema

### Tables
- `users` - User accounts
- `accounts` - Bank accounts
- `transactions` - Transaction history
- `loan_applications` - Loan applications
- `chat_history` - Chat logs
- `audit_log` - Security audit trail

### Functions
- `transfer_money()` - Execute transfers (VULNERABLE)

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `OLLAMA_URL` - Ollama API endpoint
- `SECRET_KEY` - JWT secret
- `ENABLE_VULNERABLE_MODE` - Enable vulnerabilities

### Frontend
- `REACT_APP_API_URL` - Backend API URL

## Monitoring and Logging

### Logs
- Application logs via uvicorn
- Database query logs
- Redis operation logs
- Ollama inference logs

### Audit Trail
- All API requests logged
- Authentication attempts tracked
- Suspicious queries flagged
- Transfer attempts recorded

## Next Steps

1. Review [QUICK_START.md](./QUICK_START.md) for setup
2. Read [SCENARIOS.md](./docs/SCENARIOS.md) for vulnerabilities
3. Follow [ATTACK_GUIDE.md](./docs/ATTACK_GUIDE.md) for exploits
4. Study [MITIGATIONS.md](./docs/MITIGATIONS.md) for fixes
5. Implement secure versions of vulnerable components
