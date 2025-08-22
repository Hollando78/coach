# Dashboard Deployment Guide

This guide covers the complete deployment process for the Secure Dashboard application, including adding new applications to the gallery.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Adding New Applications](#adding-new-applications)
7. [SSL Configuration](#ssl-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

## Overview

The Secure Dashboard is a containerized Node.js application that provides:
- Public app gallery with various web applications and games
- Admin dashboard with authentication and file management
- Nginx reverse proxy with SSL support
- SQLite database for users and file metadata
- System monitoring and LLM proxy capabilities

### Architecture
```
[Internet] → [Nginx:8888/8443] → [Express.js:3000] → [SQLite Database]
                     ↓
            [Static Files & Apps]
```

## Prerequisites

### System Requirements
- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- At least 2GB RAM and 10GB storage
- Open ports: 8888 (HTTP), 8443 (HTTPS), 3000 (development)

### Required Software
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not included)
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installations
docker --version
docker compose version
```

## Initial Setup

### 1. Clone and Configure
```bash
# Clone the repository
git clone <repository-url>
cd dashboard

# Set environment variables
cp .env.example .env  # if exists
export SESSION_SECRET="your-very-secure-session-secret-key"
```

### 2. Initialize Database
```bash
# Create required directories
mkdir -p data uploads logs ssl

# Initialize database (optional - auto-created on first run)
node init-db.js
```

## Development Deployment

### Quick Start
```bash
# Start development containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Access application
# - Dashboard: http://localhost:8888
# - Admin: http://localhost:8888/admin (admin/admin)
# - Direct Node.js: http://localhost:3000
```

### Development Commands
```bash
# Rebuild and restart
docker-compose up -d --build

# Stop containers
docker-compose down

# View container status
docker-compose ps

# Execute commands in container
docker exec -it secure-dashboard bash

# View real-time logs
docker-compose logs -f dashboard
```

## Production Deployment

### 1. Production Build
```bash
# Use production docker-compose file
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. Automated Production Deployment
```bash
# Use the deployment script
chmod +x deploy.sh
./deploy.sh

# Or for web-only deployment
chmod +x deploy-web.sh
./deploy-web.sh
```

### 3. Manual Production Steps
```bash
# Build production containers
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl -I http://localhost:8888/health
```

### Production Environment Variables
```bash
# Set in environment or .env file
export NODE_ENV=production
export SESSION_SECRET="your-production-secret-key"
export PORT=3000
```

## Adding New Applications

This section covers how to add new applications to the dashboard, including the complete deployment process.

### Method 1: External Application Integration

For applications built outside the dashboard:

#### Step 1: Build the Application
```bash
# Navigate to your app directory (e.g., 3d-viewer)
cd /path/to/your-app

# Install dependencies
npm install

# Build for production
npm run build
# This creates a 'dist' or 'build' directory with production files
```

#### Special Case: God Game Integration
For the god-game multiplayer application, the deployment process is different due to its server-client architecture:

```bash
# God Game has a separate server that must be running
# The client files are deployed as JavaScript modules (not a Vite build)

# Step 1: Deploy client files
cp -r /root/project/god-game/client/src /root/project/dashboard/public/god-game/
cp /root/project/god-game/client/index.html /root/project/dashboard/public/god-game/

# Step 2: Update client to use compiled JavaScript
# Edit god-game/index.html to reference ./src/main.js instead of ./src/main.ts

# Step 3: Start god-game server on separate port
cd /root/project/god-game
PORT=3001 NODE_ENV=production pnpm --filter server dev &

# Step 4: Ensure database containers are running
docker ps | grep -E "(postgres|redis)"
```

#### Step 2: Deploy to Dashboard
```bash
# Copy built files to dashboard public directory
cp -r dist /path/to/dashboard/public/your-app-name

# Or create a symbolic link for development
ln -s /path/to/your-app/dist /path/to/dashboard/public/your-app-name
```

#### Step 3: Fix Asset Paths
```bash
# Edit the main HTML file to use relative paths
sed -i 's|/assets/|./assets/|g' /path/to/dashboard/public/your-app-name/index.html
```

#### Step 4: Update Landing Page
Edit `/path/to/dashboard/public/landing.html` and add your app to the `apps` array:

```javascript
{
    id: 13, // Use next available ID
    title: "Your App Name",
    category: "tools", // or "games", "productivity", "entertainment", etc.
    icon: "🎯", // Choose appropriate emoji
    description: "Detailed description of your app's features and capabilities.",
    features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    url: "/your-app-name/index.html",
    isNew: true, // Optional: marks as "NEW"
    isFeatured: true, // Optional: marks as "FEATURED"
    lastUpdated: "2024-08-10"
}
```

#### Step 5: Rebuild and Deploy
```bash
# Rebuild Docker container to include new files
docker-compose up -d --build

# For production
docker-compose -f docker-compose.prod.yml up -d --build

# Verify deployment
curl -I http://localhost:8888/your-app-name/index.html
```

### Method 2: In-Place Development

For developing apps directly in the dashboard:

#### Step 1: Create App Directory
```bash
mkdir -p public/your-app-name
cd public/your-app-name
```

#### Step 2: Develop Your App
Create your app files directly in this directory:
```bash
# Create basic structure
touch index.html style.css script.js

# Develop your application...
```

#### Step 3: Update Landing Page
Follow Step 4 from Method 1 above.

#### Step 4: Test and Deploy
```bash
# No rebuild needed for development - files are volume mounted
# Just refresh the browser

# For production deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

### Application Categories

Available categories for the landing page:
- `productivity` - Task management, document tools, utilities
- `games` - Entertainment, puzzles, arcade games
- `tools` - Development tools, calculators, converters
- `fitness` - Health and exercise applications
- `educational` - Learning and training apps
- `entertainment` - Fun apps, generators, social tools

### Best Practices for New Apps

1. **Mobile Responsive**: Ensure your app works on mobile devices
2. **Performance**: Optimize for fast loading and smooth operation
3. **Security**: Follow security best practices, no sensitive data exposure
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Documentation**: Include a README.md in your app directory
6. **Testing**: Test thoroughly before adding to production

### Assets and Dependencies

- Place large assets in your app's directory structure
- Use CDN links for external libraries when possible
- Ensure CORS compatibility for external resources
- Test asset loading paths in production environment

## SSL Configuration

### Self-Signed Certificates (Development/Testing)
```bash
# Generate self-signed certificates
chmod +x setup-ssl-selfsigned.sh
./setup-ssl-selfsigned.sh

# Start with SSL enabled
docker-compose -f docker-compose.prod.yml up -d
```

### Production SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot

# Generate certificates (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# Update nginx configuration with your domain
sed -i 's/your-domain.com/actual-domain.com/g' nginx-prod.conf

# Deploy with SSL
docker-compose -f docker-compose.prod.yml up -d --build
```

### Certificate Renewal
```bash
# Add to crontab for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Troubleshooting

### Common Issues

#### Application Not Loading (404 Error)
```bash
# Check if files exist in container
docker exec secure-dashboard ls -la /app/public/your-app/

# If missing, rebuild container
docker-compose up -d --build

# Check nginx logs
docker-compose logs nginx
```

#### Asset Loading Issues
```bash
# Check asset paths in HTML
grep -r "assets/" public/your-app/

# Fix absolute paths to relative
sed -i 's|="/assets/|="./assets/|g' public/your-app/index.html
```

#### Database Connection Issues
```bash
# Check database file exists
ls -la data/dashboard.db

# Reset database
rm data/dashboard.db
node init-db.js
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs dashboard

# Check port conflicts
sudo netstat -tlnp | grep :3000

# Free up ports or change configuration
```

### Log Analysis
```bash
# Application logs
docker-compose logs -f dashboard

# Nginx logs
docker-compose logs -f nginx

# System logs
tail -f /var/log/docker.log

# Container resource usage
docker stats
```

### Performance Issues
```bash
# Monitor container resources
docker stats

# Check disk space
df -h

# Database optimization
sqlite3 data/dashboard.db "VACUUM;"
```

## Maintenance

### Regular Tasks

#### Daily
- Monitor application logs for errors
- Check disk space usage
- Verify all services are running

#### Weekly
- Update system packages
- Review security logs
- Backup database and uploads

#### Monthly
- Update Docker images
- Review and clean old log files
- Performance optimization

### Backup Procedures
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_${DATE}.tar.gz" data/ uploads/ ssl/

# Database backup
sqlite3 data/dashboard.db ".backup data/dashboard_backup_${DATE}.db"
```

### Updates and Upgrades
```bash
# Update application code
git pull origin main

# Rebuild containers
docker-compose up -d --build

# Clean up old images
docker image prune -f
```

### Monitoring Setup
```bash
# Health check endpoint
curl http://localhost:8888/health

# Application metrics
curl http://localhost:8888/api/status

# Set up monitoring alerts (external service recommended)
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set secure SESSION_SECRET
- [ ] Enable SSL/TLS in production
- [ ] Configure proper firewall rules
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Backup encryption
- [ ] Rate limiting enabled
- [ ] CSP headers configured
- [ ] No sensitive data in logs

## Server Management & Port Configuration

### Production Port Assignment
The dashboard deployment uses multiple servers with specific port assignments:

```bash
# Dashboard Services
Dashboard (Nginx):          8888 (HTTP), 8443 (HTTPS)
Dashboard (Node.js):        3000 (internal)

# God Game Services  
God Game Server (Colyseus): 3001
PostgreSQL Database:        5432
Redis Cache:               6379

# Check running services
netstat -tlnp | grep -E ':(3000|3001|5432|6379|8888|8443)'
```

### Starting All Services
```bash
# Start dashboard in production
cd /root/project/dashboard
docker-compose -f docker-compose.prod.yml up -d

# Start god-game server
cd /root/project/god-game  
PORT=3001 NODE_ENV=production pnpm --filter server dev &

# Verify all services are healthy
curl http://localhost:8888/health        # Dashboard health
curl http://localhost:3001/api/health    # God game server health
```

### Service Dependencies
The god-game requires its database containers to be running before the server starts:
```bash
# Start god-game dependencies (if not already running)
cd /root/project/god-game
docker-compose up -d

# Verify dependencies
docker ps | grep -E "(postgres|redis)"
```

## Performance Optimization

### Database Optimization
```bash
# Regular maintenance
sqlite3 data/dashboard.db "PRAGMA optimize;"
sqlite3 data/dashboard.db "VACUUM;"
```

### Asset Optimization
- Minify JavaScript and CSS files
- Optimize images (WebP format recommended)
- Enable gzip compression in Nginx
- Use CDN for external libraries

### Container Optimization
```bash
# Remove unused images
docker image prune

# Limit container resources if needed
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1G
#       cpus: '0.5'
```

## Support and Documentation

- Application documentation: `CLAUDE.md`
- API documentation: Check `/api/` endpoints
- Container logs: `docker-compose logs`
- Health status: `http://localhost:8888/health`

For additional support, check the application logs and refer to the specific component documentation in the repository.