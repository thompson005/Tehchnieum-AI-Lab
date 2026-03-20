#!/bin/bash
#
# MedAssist AI - Professional Setup Script
# Automated environment setup for security training lab
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           MedAssist AI Security Training Lab              ║
║                  Professional Setup                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check Python version
echo -e "${BLUE}[1/7]${NC} Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.10"

if [[ $(echo -e "$PYTHON_VERSION\n$REQUIRED_VERSION" | sort -V | head -n1) == "$REQUIRED_VERSION" ]]; then
    echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION detected"
else
    echo -e "${RED}✗${NC} Python 3.10+ required. Current: $PYTHON_VERSION"
    exit 1
fi

# Check if virtual environment exists
echo -e "${BLUE}[2/7]${NC} Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${YELLOW}!${NC} Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo -e "${BLUE}[3/7]${NC} Upgrading pip..."
pip install --upgrade pip --quiet
echo -e "${GREEN}✓${NC} Pip upgraded"

# Install dependencies
echo -e "${BLUE}[4/7]${NC} Installing dependencies (this may take a few minutes)..."
if [ -f "requirements_FIXED.txt" ]; then
    pip install -r requirements_FIXED.txt --quiet
    echo -e "${GREEN}✓${NC} Dependencies installed from requirements_FIXED.txt"
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
    echo -e "${YELLOW}!${NC} Using requirements.txt (may be incomplete)"
else
    echo -e "${RED}✗${NC} No requirements file found!"
    exit 1
fi

# Setup .env file
echo -e "${BLUE}[5/7]${NC} Configuring environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created from template"
        echo -e "${YELLOW}!${NC} ${RED}IMPORTANT:${NC} Edit .env and add your GROQ_API_KEY"
    else
        echo -e "${RED}✗${NC} .env.example not found!"
        exit 1
    fi
else
    echo -e "${YELLOW}!${NC} .env already exists"
fi

# Check if API key is configured
if grep -q "your_groq_api_key_here" .env 2>/dev/null; then
    echo -e "${RED}⚠${NC}  GROQ_API_KEY not configured in .env"
    echo -e "    Get your free API key at: ${BLUE}https://console.groq.com${NC}"
fi

# Initialize database
echo -e "${BLUE}[6/7]${NC} Initializing database..."
if [ -f "database/medassist.db" ]; then
    echo -e "${YELLOW}!${NC} Database already exists. Skipping initialization."
    read -p "   Reinitialize database? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python setup_database.py
        echo -e "${GREEN}✓${NC} Database reinitialized"
    fi
else
    python setup_database.py
    echo -e "${GREEN}✓${NC} Database initialized"
fi

# Create necessary directories
echo -e "${BLUE}[7/7]${NC} Creating directories..."
mkdir -p logs rag/chroma_db database
echo -e "${GREEN}✓${NC} Directories created"

# Final summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${YELLOW}Edit .env and add your GROQ_API_KEY${NC}"
echo -e "  2. ${BLUE}source venv/bin/activate${NC}"
echo -e "  3. ${BLUE}python app.py${NC}"
echo -e "  4. Open ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "Or use Docker:"
echo -e "  ${BLUE}docker-compose up --build${NC}"
echo ""
echo -e "${YELLOW}⚠  REMINDER: This is a VULNERABLE system for training only!${NC}"
echo ""
