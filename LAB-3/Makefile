.PHONY: help install up down restart logs clean seed test

help:
	@echo "ShopSec-AI Lab Commands"
	@echo "======================="
	@echo "make install    - Install all dependencies"
	@echo "make up         - Start all services"
	@echo "make down       - Stop all services"
	@echo "make restart    - Restart all services"
	@echo "make logs       - View logs"
	@echo "make seed       - Seed database with sample data"
	@echo "make reset-db   - Reset database"
	@echo "make test       - Run tests"
	@echo "make clean      - Remove all containers and volumes"
	@echo "make monitor    - Start monitoring dashboard"
	@echo "make traffic    - Start traffic generator"

install:
	@echo "Installing Python dependencies..."
	python3 -m venv venv
	. venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Creating .env file..."
	cp .env.example .env
	@echo "Installation complete!"

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started! Access:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API: http://localhost:8000/docs"
	@echo "  Monitoring: http://localhost:8501"

down:
	@echo "Stopping all services..."
	docker-compose down

restart:
	@echo "Restarting services..."
	docker-compose restart

logs:
	docker-compose logs -f

seed:
	@echo "Seeding database..."
	. venv/bin/activate && python backend/database/seed_data.py
	@echo "Database seeded!"

reset-db:
	@echo "Resetting database..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	. venv/bin/activate && python backend/database/migrate.py
	. venv/bin/activate && python backend/database/seed_data.py
	@echo "Database reset complete!"

test:
	@echo "Running tests..."
	. venv/bin/activate && pytest backend/tests/ -v

clean:
	@echo "Cleaning up..."
	docker-compose down -v
	rm -rf venv
	rm -rf frontend/node_modules
	rm -rf frontend/.next
	rm -rf backend/**/__pycache__
	rm -rf backend/logs/*
	@echo "Cleanup complete!"

monitor:
	@echo "Starting monitoring dashboard..."
	docker-compose --profile monitoring up -d monitoring
	@echo "Monitoring available at http://localhost:8501"

traffic:
	@echo "Starting traffic generator..."
	docker-compose --profile traffic up -d traffic-gen
	@echo "Traffic generator available at http://localhost:8089"
