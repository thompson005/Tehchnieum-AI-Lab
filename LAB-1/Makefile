# MedAssist AI - Development Makefile
# Professional workflow automation

.PHONY: help setup install clean run test docker-build docker-up docker-down reset

# Default target
help:
	@echo "MedAssist AI - Available Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup        - Run automated setup script"
	@echo "  make install      - Install dependencies only"
	@echo ""
	@echo "Running the Application:"
	@echo "  make run          - Start the Flask application"
	@echo "  make docker-up    - Start with Docker Compose"
	@echo "  make docker-down  - Stop Docker containers"
	@echo ""
	@echo "Database:"
	@echo "  make reset-db     - Reinitialize database"
	@echo "  make backup-db    - Backup current database"
	@echo ""
	@echo "Development:"
	@echo "  make test         - Run test suite"
	@echo "  make lint         - Run code linters"
	@echo "  make format       - Format code with black"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - Remove generated files"
	@echo "  make clean-all    - Remove everything including venv"

# Setup
setup:
	@echo "Running automated setup..."
	@chmod +x setup.sh
	@./setup.sh

install:
	@echo "Installing dependencies..."
	@pip install -r requirements_FIXED.txt || pip install -r requirements.txt

# Running
run:
	@echo "Starting MedAssist AI..."
	@python app.py

# Docker
docker-build:
	@echo "Building Docker image..."
	@docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	@docker-compose up -d
	@echo "Application running at http://localhost:5000"

docker-down:
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-logs:
	@docker-compose logs -f

# Database
reset-db:
	@echo "Resetting database..."
	@rm -f database/medassist.db
	@python setup_database.py
	@echo "Database reset complete"

backup-db:
	@echo "Backing up database..."
	@mkdir -p backups
	@cp database/medassist.db backups/medassist_$(shell date +%Y%m%d_%H%M%S).db
	@echo "Backup created in backups/"

# Development
test:
	@echo "Running tests..."
	@pytest -v tests/ || echo "No tests found - create tests/ directory"

lint:
	@echo "Running linters..."
	@flake8 app.py agents/ tools/ rag/ || echo "flake8 not installed"
	@pylint app.py agents/ tools/ rag/ || echo "pylint not installed"

format:
	@echo "Formatting code with black..."
	@black app.py agents/ tools/ rag/ config.py setup_database.py

# Cleanup
clean:
	@echo "Cleaning generated files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name "*.pyo" -delete
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf logs/*.log
	@rm -rf .pytest_cache
	@echo "Cleanup complete"

clean-all: clean
	@echo "Removing virtual environment and vector store..."
	@rm -rf venv
	@rm -rf rag/chroma_db/*
	@echo "Full cleanup complete"

# Utility
check-env:
	@echo "Checking environment..."
	@if [ ! -f .env ]; then echo "❌ .env file not found"; exit 1; fi
	@if grep -q "your_groq_api_key_here" .env; then echo "❌ GROQ_API_KEY not configured"; exit 1; fi
	@echo "✅ Environment configured"

health-check:
	@echo "Checking application health..."
	@curl -s http://localhost:5000/api/health | python -m json.tool || echo "Application not running"

# Lab Management
start-lab:
	@echo "Starting lab environment..."
	@make check-env
	@make run

# Install dev dependencies
install-dev:
	@echo "Installing development dependencies..."
	@pip install pytest pytest-flask black flake8 pylint
