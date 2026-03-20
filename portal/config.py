"""
Technieum AI Security Labs - Portal Configuration
"""
import os
from dotenv import load_dotenv, find_dotenv

# Load from local .env first; if not found, search parent directories.
# This allows a single root-level .env to serve all labs globally.
load_dotenv(find_dotenv(usecwd=True) or find_dotenv())

class Config:
    SECRET_KEY = os.getenv('PORTAL_SECRET_KEY', 'technieum-portal-secret-change-in-production')
    DATABASE_PATH = os.getenv('PORTAL_DB_PATH', 'portal.db')
    DEBUG = os.getenv('PORTAL_DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('PORTAL_HOST', '0.0.0.0')
    PORT = int(os.getenv('PORTAL_PORT', 5555))

    # Lab URLs
    LAB1_URL = os.getenv('LAB1_URL', 'http://localhost:5000')
    LAB2_URL = os.getenv('LAB2_URL', 'http://localhost:3000')
    LAB3_URL = os.getenv('LAB3_URL', 'http://localhost:8080')
    LAB4_URL = os.getenv('LAB4_URL', 'http://localhost:3100')
    LAB5_URL = os.getenv('LAB5_URL', 'http://localhost:3200')

    # All valid flags with metadata
    FLAGS = {
        # LAB-1 MedAssist (Healthcare)
        "TECHNIEUM{direct_injection_001}":       {"lab": "lab1", "points": 100,  "name": "Direct Injection",        "tier": "EASY"},
        "TECHNIEUM{jailbreak_bypass_002}":       {"lab": "lab1", "points": 100,  "name": "Jailbreak Bypass",        "tier": "EASY"},
        "TECHNIEUM{info_disclosure_003}":        {"lab": "lab1", "points": 100,  "name": "Info Disclosure",         "tier": "EASY"},
        "TECHNIEUM{system_prompt_leak_004}":     {"lab": "lab1", "points": 100,  "name": "System Prompt Leak",      "tier": "EASY"},
        "TECHNIEUM{xss_via_ai_005}":             {"lab": "lab1", "points": 250,  "name": "XSS via AI Output",       "tier": "MEDIUM"},
        "TECHNIEUM{indirect_injection_006}":     {"lab": "lab1", "points": 250,  "name": "Indirect Injection",      "tier": "MEDIUM"},
        "TECHNIEUM{rag_data_leak_007}":          {"lab": "lab1", "points": 250,  "name": "RAG Data Leakage",        "tier": "MEDIUM"},
        "TECHNIEUM{model_dos_008}":              {"lab": "lab1", "points": 250,  "name": "Model DoS",               "tier": "MEDIUM"},
        "TECHNIEUM{sqli_via_llm_009}":           {"lab": "lab1", "points": 500,  "name": "SQLi via LLM",            "tier": "HARD"},
        "TECHNIEUM{rag_poison_010}":             {"lab": "lab1", "points": 500,  "name": "RAG Poisoning",           "tier": "HARD"},
        "TECHNIEUM{function_abuse_011}":         {"lab": "lab1", "points": 500,  "name": "Function Abuse",          "tier": "HARD"},
        "TECHNIEUM{plugin_vuln_012}":            {"lab": "lab1", "points": 500,  "name": "Plugin Vulnerabilities",  "tier": "HARD"},
        "TECHNIEUM{priv_escalation_013}":        {"lab": "lab1", "points": 1000, "name": "Privilege Escalation",    "tier": "EXPERT"},
        "TECHNIEUM{crescendo_014}":              {"lab": "lab1", "points": 1000, "name": "CRESCENDO Jailbreak",     "tier": "EXPERT"},
        "TECHNIEUM{context_overflow_015}":       {"lab": "lab1", "points": 1000, "name": "Context Window Overflow", "tier": "EXPERT"},

        # LAB-2 SecureBank (Banking)
        "TECHNIEUM{eva_prompt_bypass_101}":      {"lab": "lab2", "points": 100,  "name": "Eva Prompt Bypass",       "tier": "EASY"},
        "TECHNIEUM{xss_transaction_102}":        {"lab": "lab2", "points": 250,  "name": "XSS via Transaction",     "tier": "MEDIUM"},
        "TECHNIEUM{smart_transfer_103}":         {"lab": "lab2", "points": 500,  "name": "Smart Transfer Abuse",    "tier": "HARD"},
        "TECHNIEUM{loan_pdf_inject_104}":        {"lab": "lab2", "points": 1000, "name": "Loan PDF Injection",      "tier": "EXPERT"},

        # LAB-3 ShopSec (E-Commerce)
        "TECHNIEUM{pr1c3_m4n1pul4t10n}":         {"lab": "lab3", "points": 100,  "name": "Price Manipulation",      "tier": "EASY"},
        "TECHNIEUM{r4g_p01s0n1ng}":              {"lab": "lab3", "points": 100,  "name": "RAG Poisoning",           "tier": "EASY"},
        "TECHNIEUM{p0l1cy_h4lluc1n4t10n}":       {"lab": "lab3", "points": 100,  "name": "Policy Hallucination",    "tier": "EASY"},
        "TECHNIEUM{st0r3d_xss_r4g}":             {"lab": "lab3", "points": 250,  "name": "Stored XSS via RAG",      "tier": "MEDIUM"},
        "TECHNIEUM{g0d_m0d3_t00l}":              {"lab": "lab3", "points": 250,  "name": "God Mode Tool",           "tier": "MEDIUM"},
        "TECHNIEUM{mult1m0d4l_1nj3ct}":          {"lab": "lab3", "points": 250,  "name": "Multimodal Injection",    "tier": "MEDIUM"},
        "TECHNIEUM{pr0mpt_3xtr4ct10n}":          {"lab": "lab3", "points": 500,  "name": "Prompt Extraction",       "tier": "HARD"},
        "TECHNIEUM{supp1y_ch41n_p01s0n}":        {"lab": "lab3", "points": 500,  "name": "Supply Chain Poisoning",  "tier": "HARD"},
        "TECHNIEUM{d3n14l_0f_w4ll3t}":           {"lab": "lab3", "points": 500,  "name": "Denial of Wallet",        "tier": "HARD"},
        "TECHNIEUM{r4g_3xf1ltr4t10n}":           {"lab": "lab3", "points": 1000, "name": "RAG Exfiltration",        "tier": "EXPERT"},
        "TECHNIEUM{g04l_h1j4ck1ng}":             {"lab": "lab3", "points": 1000, "name": "Goal Hijacking",          "tier": "EXPERT"},
        "TECHNIEUM{ch41n_4tt4ck_m4st3r}":        {"lab": "lab3", "points": 1000, "name": "Chain Attack Master",     "tier": "EXPERT"},

        # LAB-4: TravelNest AI
        "TECHNIEUM{tr4v3l_pr0mpt_1nj3ct10n}":   {"lab": "lab4", "points": 100,  "name": "Travel Prompt Injection", "tier": "EASY"},
        "TECHNIEUM{fl1ght_d4t4_3xf1l}":         {"lab": "lab4", "points": 100,  "name": "Flight Data Exfiltration","tier": "EASY"},
        "TECHNIEUM{1t1n3r4ry_sy5t3m_l34k}":     {"lab": "lab4", "points": 100,  "name": "Itinerary System Leak",   "tier": "EASY"},
        "TECHNIEUM{r4g_p01s0n_tr4v3l}":         {"lab": "lab4", "points": 250,  "name": "Travel RAG Poisoning",    "tier": "MEDIUM"},
        "TECHNIEUM{b00k1ng_t00l_4bu53}":         {"lab": "lab4", "points": 250,  "name": "Booking Tool Abuse",      "tier": "MEDIUM"},
        "TECHNIEUM{4g3nt_m3m0ry_1nj3ct}":       {"lab": "lab4", "points": 250,  "name": "Agent Memory Injection",  "tier": "MEDIUM"},
        "TECHNIEUM{p4ym3nt_l0g1c_fl4w}":        {"lab": "lab4", "points": 500,  "name": "Payment Logic Flaw",      "tier": "HARD"},
        "TECHNIEUM{cr055_4g3nt_c0nt4m}":        {"lab": "lab4", "points": 500,  "name": "Cross-Agent Contamination","tier": "HARD"},
        "TECHNIEUM{v3ct0r_db_p01s0n}":          {"lab": "lab4", "points": 500,  "name": "Vector DB Poisoning",     "tier": "HARD"},
        "TECHNIEUM{tr4v3l_g0d_m0d3}":           {"lab": "lab4", "points": 1000, "name": "TravelNest God Mode",     "tier": "EXPERT"},

        # LAB-5: GovConnect AI (MCP Protocol Security)
        "TECHNIEUM{mcp_t00l5_3num3r4t3d}":      {"lab": "lab5", "points": 100,  "name": "MCP Tool Reconnaissance", "tier": "EASY"},
        "TECHNIEUM{5y5t3m_pr0mpt_l34k3d}":      {"lab": "lab5", "points": 100,  "name": "System Prompt via MCP Resource", "tier": "EASY"},
        "TECHNIEUM{r35p0n53_1nj3ct10n}":        {"lab": "lab5", "points": 100,  "name": "MCP Response Injection",  "tier": "EASY"},
        "TECHNIEUM{t00l_d35c_p01s0n3d}":        {"lab": "lab5", "points": 250,  "name": "Tool Description Poisoning","tier": "MEDIUM"},
        "TECHNIEUM{5h4d0w_t00l_f0und}":         {"lab": "lab5", "points": 250,  "name": "Shadow Tool Discovery",   "tier": "MEDIUM"},
        "TECHNIEUM{3xc3551v3_4g3ncy_g0v}":      {"lab": "lab5", "points": 250,  "name": "Excessive Agency",        "tier": "MEDIUM"},
        "TECHNIEUM{c0nfu53d_d3puty_g0v}":       {"lab": "lab5", "points": 500,  "name": "Confused Deputy",         "tier": "HARD"},
        "TECHNIEUM{1nt3rn4l_d0c5_mcp_br34ch}":  {"lab": "lab5", "points": 500,  "name": "Internal Docs Breach",    "tier": "HARD"},
        "TECHNIEUM{r4g_p01s0n_mcp_1ng35t}":     {"lab": "lab5", "points": 500,  "name": "RAG Poisoning via MCP",   "tier": "HARD"},
        "TECHNIEUM{f1l35y5t3m_mcp_tr4v3r54l}":  {"lab": "lab5", "points": 500,  "name": "Filesystem Path Traversal","tier": "HARD"},
        "TECHNIEUM{p3r515t3nt_b4ckd00r_mcp}":   {"lab": "lab5", "points": 500,  "name": "Persistent Backdoor",     "tier": "HARD"},
        "TECHNIEUM{mcp_rug_pull_3xpl01t3d}":    {"lab": "lab5", "points": 1000, "name": "MCP Tool Poisoning Rug Pull","tier": "EXPERT"},
        "TECHNIEUM{full_c1t1z3n_db_3xf1l}":     {"lab": "lab5", "points": 1000, "name": "Full Database Exfiltration","tier": "EXPERT"},
        "TECHNIEUM{g0vc0nn3ct_g0d_m0d3}":       {"lab": "lab5", "points": 950,  "name": "GovConnect God Mode",     "tier": "EXPERT"},
    }

    LAB_META = {
        "lab1": {
            "name": "LAB-1: MedAssist AI",
            "subtitle": "Healthcare LLM Security",
            "description": "A multi-agent healthcare platform. Exploit patient data agents, RAG medical knowledge base, and billing systems.",
            "icon": "🏥",
            "color": "#EF4444",
            "difficulty": "Beginner → Expert",
            "total_flags": 15,
            "port": 5000
        },
        "lab2": {
            "name": "LAB-2: SecureBank AI",
            "subtitle": "Banking AI Security",
            "description": "A production-grade banking simulation. Exploit AI support bots, smart transfer agents, and loan underwriting systems.",
            "icon": "🏦",
            "color": "#3B82F6",
            "difficulty": "Easy → Expert",
            "total_flags": 4,
            "port": 3000
        },
        "lab3": {
            "name": "LAB-3: ShopSec-AI",
            "subtitle": "E-Commerce AI Security",
            "description": "An agentic e-commerce platform. Exploit price negotiation agents, RAG search, multimodal systems, and payment flows.",
            "icon": "🛒",
            "color": "#8B5CF6",
            "difficulty": "Easy → Expert",
            "total_flags": 12,
            "port": 8080
        },
        "lab4": {
            "name": "LAB-4: TravelNest AI",
            "subtitle": "Travel Booking AI Security",
            "description": "Autonomous travel booking platform with vulnerable AI agents, RAG poisoning, microservice exploits, and payment logic flaws.",
            "icon": "✈️",
            "color": "#0ea5e9",
            "difficulty": "Easy → Expert",
            "total_flags": 10,
            "port": 3100
        },
        "lab5": {
            "name": "LAB-5: GovConnect AI",
            "subtitle": "MCP Protocol Security",
            "description": "A smart city government platform using Model Context Protocol. Exploit MCP tool poisoning, confused deputy attacks, RAG injection, and cross-service data exfiltration.",
            "icon": "🏛️",
            "color": "#10b981",
            "difficulty": "Easy → Expert",
            "total_flags": 14,
            "port": 3200
        },
    }
