.PHONY: help install dev build start stop clean logs test lint typecheck db-migrate db-seed docker-build docker-up docker-down

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
install: ## Install all dependencies
	npm install
	npm --workspace=backend run db:generate

dev: ## Start development servers
	docker-compose up -d db redis
	sleep 5
	npm run dev

dev-docker: ## Start development with Docker Compose
	docker-compose up --build

dev-refresh: ## Complete development refresh
	make stop
	make clean
	make install
	make db-migrate
	make db-seed
	make dev

# Building
build: ## Build for production
	npm run build

docker-build: ## Build Docker images
	docker-compose build

# Running
start: ## Start production servers
	docker-compose --profile production up -d

stop: ## Stop all services
	docker-compose down
	stop-dev-servers || true

# Database
db-migrate: ## Run database migrations
	npm --workspace=backend run db:migrate

db-seed: ## Seed database with sample data
	npm --workspace=backend run db:seed

db-push: ## Push schema changes to database
	npm --workspace=backend run db:push

db-reset: ## Reset database (destructive)
	docker-compose down -v
	docker-compose up -d db redis
	sleep 10
	make db-migrate
	make db-seed

# Testing and Quality
test: ## Run all tests
	npm run test

lint: ## Run linting
	npm run lint

typecheck: ## Run TypeScript type checking
	npm --workspace=backend run typecheck
	npm --workspace=frontend run typecheck

# Docker operations
docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Clean Docker resources
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Utility
logs: ## View application logs
	docker-compose logs -f backend frontend

clean: ## Clean dependencies and build artifacts
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf backend/dist
	rm -rf frontend/dist

# Production deployment
deploy: ## Deploy to production
	make build
	make docker-build
	docker-compose --profile production up -d

# Health checks
health: ## Check service health
	@echo "Checking service health..."
	@curl -f http://localhost:3006/health && echo " ✅ Backend healthy" || echo " ❌ Backend unhealthy"
	@curl -f http://localhost:5177 > /dev/null 2>&1 && echo " ✅ Frontend healthy" || echo " ❌ Frontend unhealthy"

# Port management integration
ports: ## Show port usage
	python3 /root/project/portman.py list

reserve-ports: ## Reserve ports for this project
	python3 /root/project/portman.py reserve coach-backend 3006
	python3 /root/project/portman.py reserve coach-frontend 5177

# Development helpers
stop-dev-servers: ## Stop development servers
	@pkill -f "npm run dev" || true
	@pkill -f "vite" || true
	@pkill -f "tsx watch" || true

# Environment setup
env: ## Create environment files
	@echo "Creating .env files..."
	@test -f backend/.env || cp backend/.env.example backend/.env
	@test -f frontend/.env || cp frontend/.env.example frontend/.env
	@echo "Environment files created. Please update with your values."

# Quick development setup
quick-start: ## Quick setup for new developers
	make install
	make env
	make reserve-ports
	make db-migrate
	make db-seed
	make dev

# Show current status
status: ## Show development status
	@echo "=== Coach App Status ==="
	@echo "Dependencies:"
	@test -d node_modules && echo " ✅ Root dependencies" || echo " ❌ Root dependencies missing"
	@test -d backend/node_modules && echo " ✅ Backend dependencies" || echo " ❌ Backend dependencies missing"
	@test -d frontend/node_modules && echo " ✅ Frontend dependencies" || echo " ❌ Frontend dependencies missing"
	@echo ""
	@echo "Services:"
	@docker-compose ps
	@echo ""
	@make health