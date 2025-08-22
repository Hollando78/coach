.PHONY: dev build up down logs seed test lint typecheck install

# Development
dev:
	pnpm install
	cp .env.example .env
	pnpm dev

# Build
build:
	pnpm install
	pnpm build

# Docker commands
up:
	cd ops && docker-compose up -d --build

down:
	cd ops && docker-compose down

logs:
	cd ops && docker-compose logs -f

# Database
db-migrate:
	cd backend && pnpm db:migrate

seed:
	cd backend && pnpm db:seed

# Testing
test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

# Setup
install:
	pnpm install

# Clean
clean:
	cd ops && docker-compose down -v
	docker system prune -f