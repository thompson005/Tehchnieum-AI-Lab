.PHONY: help start stop restart logs clean setup test

help:
	@echo "SecureBank AI - Available Commands"
	@echo "=================================="
	@echo "make setup    - Initial setup (pull images, install dependencies)"
	@echo "make start    - Start all services"
	@echo "make stop     - Stop all services"
	@echo "make restart  - Restart all services"
	@echo "make logs     - View logs from all services"
	@echo "make clean    - Stop and remove all containers, volumes, and images"
	@echo "make test     - Run tests"
	@echo "make model    - Pull Ollama model"

setup:
	@echo "Setting up SecureBank AI..."
	docker-compose pull
	@echo "Setup complete! Run 'make start' to launch."

start:
	@echo "Starting SecureBank AI..."
	docker-compose up -d
	@echo "Services starting... Check status with 'docker-compose ps'"
	@echo "Frontend: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/docs"

stop:
	@echo "Stopping SecureBank AI..."
	docker-compose down

restart:
	@echo "Restarting SecureBank AI..."
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	@echo "Cleaning up SecureBank AI..."
	docker-compose down -v --rmi all
	@echo "Cleanup complete!"

model:
	@echo "Pulling Ollama model (this may take several minutes)..."
	docker exec securebank-llm ollama pull llama3
	@echo "Model ready!"

test:
	@echo "Running tests..."
	docker-compose exec backend pytest
