#!/bin/bash

echo "Starting deployment of Secure Dashboard..."

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

SESSION_SECRET=$(openssl rand -hex 32)
echo "SESSION_SECRET=$SESSION_SECRET" > .env

echo "Building and starting the dashboard..."
docker-compose up -d --build

echo "Waiting for the service to start..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    echo "✓ Dashboard deployed successfully!"
    echo ""
    echo "Access your dashboard at: http://localhost:3000"
    echo "First time setup: http://localhost:3000/setup.html"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    echo "To restart: docker-compose restart"
else
    echo "✗ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi