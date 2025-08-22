# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "Secure Dashboard" - a Node.js Express application that serves as both an app gallery and admin dashboard with authentication. The system provides:

- **Public app gallery** - Landing page with various web apps/games accessible to everyone
- **Admin dashboard** - Protected interface for file uploads, system monitoring, and user management
- **Authentication system** - Session-based auth with SQLite database
- **File upload system** - Preview uploads for apps/documents with multi-format support
- **System monitoring** - Real-time server status and resource usage
- **User management** - Role-based permissions (admin/user) with granular permission system
- **LLM proxy** - Local Ollama integration for AI features

## Development Commands

### Local Development
```bash
npm start        # Start production server
npm run dev      # Start with nodemon (auto-reload)
```

### Docker Development
```bash
docker-compose up -d --build    # Start development containers
docker-compose logs -f          # View logs
docker-compose down             # Stop containers
```

## Deployment Commands

```bash
# Run from /root/project/dashboard directory

# Full web deployment with container rebuild
./deploy-web.sh

# Alternative: Manual production deployment
./deploy.sh
docker-compose -f docker-compose.prod.yml up -d --build

# Quick static app deployment (for external apps)
# Copy built app to public directory then restart containers
cp -r ../app-name/dist/* public/app-name/
docker-compose restart
```

## Adding New Applications

To add new applications to the dashboard:

1. **Build the application** in its source directory
2. **Copy built files** to `dashboard/public/app-name/`  
3. **Update landing page** (`public/landing.html`) to include the new app
4. **Deploy changes** using `./deploy-web.sh`

See `DEPLOYMENT.md` for detailed instructions on adding applications.

## Territory Game Integration

The dashboard now includes full integration with the multiplayer territory game:

### Deployment Architecture
- **Frontend**: Territory game React app deployed to `public/territory/`
- **Backend**: Territory game server running as separate Docker container on port 4003
- **Proxy**: Express.js proxy routes `/territory-api/*` to territory backend
- **WebSocket**: Socket.IO proxy at `/territory-ws` for real-time updates
- **Database**: PostgreSQL + Redis for territory game state and caching

### Territory API Proxy Configuration
The dashboard server includes sophisticated proxy middleware:
- Routes `/territory-api/*` requests to `http://territory-backend:4003/api/*`
- Handles authentication headers (JWT Bearer tokens)
- Filters problematic headers (`transfer-encoding`, `connection`) to prevent nginx 502 errors
- Supports WebSocket upgrades for real-time features
- Includes comprehensive error logging and timeout handling (30s)

### Frontend Integration
- React Router configured with `basename="/territory"` for subdirectory deployment
- Environment variables: `VITE_API_BASE=/territory-api`, `VITE_WS_URL=/territory-ws`
- Enhanced debug console showing API calls, authentication status, and system metrics
- Automatic token refresh and error handling

### Nginx Configuration
- Cache headers optimized for territory assets (1h cache) vs HTML (no-cache)
- Proper proxy headers for authentication and WebSocket upgrades
- SSL/HTTPS support with secure cookies in production

### Common Issues & Solutions
- **502 Bad Gateway**: Usually caused by conflicting HTTP headers in proxy
- **Authentication failures**: Check JWT token expiration and cookie settings
- **WebSocket connection issues**: Verify upgrade headers in both nginx and Express
- **Browser cache**: Clear cache if frontend shows old JavaScript after updates

## Architecture

### Core Server (`server.js`)
- Express.js application with security middleware (Helmet, CORS, rate limiting)
- SQLite database for users and file previews
- Session-based authentication with bcrypt password hashing
- Multi-tier authorization (authenticated, admin, granular permissions)
- File upload handling with Multer (50MB limit, filtered file types)
- System information API using `systeminformation` package
- LLM proxy to local Ollama server (localhost:11434)

### Database Schema
- **users**: id, username, password_hash, role, permissions, created_at
- **previews**: id, title, description, filename, filepath, mimetype, size, uploaded_at

### Frontend Structure
- **Public routes**: 
  - `/` - Landing page with app gallery
  - `/god-game/` - Multiplayer 3D world simulation (connects to Colyseus server on port 3001)
  - `/dragon-flight/` - Single-player 3D flying game
  - `/3d-viewer/` - GLB/GLTF model viewer with Babylon.js
  - `/UHT/` - Universal Hex Taxonomy AI classification system
  - Individual app pages (chess, space-invaders, photo-to-pdf, voice-notes, etc.)
- **Admin routes**: 
  - `/admin` - Main dashboard (requires auth)
  - `/setup.html` - Initial admin setup

### Key Frontend Apps
- **God Game** (`public/god-game/`) - Server-authoritative multiplayer 3D world simulation with Colyseus WebSocket server
- **Dragon Flight 3D** (`public/dragon-flight/`) - WebGL game with assets  
- **Dragon Hatchers** (`public/game/`) - HTML5 dragon care game
- **3D Model Viewer** (`public/3d-viewer/`) - Babylon.js GLB/GLTF model viewer with animation controls
- **UHT Taxonomy** (`public/UHT/`) - AI-powered entity classification system using LLMs
- **Various utilities**: HIIT timer, chess, space invaders, photo-to-PDF, voice notes, etc.
- **Admin dashboard** (`public/app.js`, `public/index.html`) - SPA with tabs for uploads, status, user management

### Authentication Flow
1. Check auth status via `/api/check-auth`
2. Login via `/api/login` (rate-limited)
3. Session stored server-side, httpOnly cookies
4. Middleware: `isAuthenticated`, `isAdmin`, `hasPermission()`

### Permission System
- **Roles**: admin, user
- **Granular permissions**: JSON array stored per user
- Admin has all permissions; users checked against specific permission strings

### File Upload System
- Storage: `uploads/` directory
- Allowed types: images, videos, PDFs, ZIP files
- Database tracking with metadata
- Admin-only upload/delete via `/api/upload` and `/api/previews/:id`

### Production Setup
- **Nginx reverse proxy** (port 8888/8443) with SSL support  
- **Health checks** via `/health` endpoint
- **Environment variables**: SESSION_SECRET, NODE_ENV, PORT
- **Volume mounts**: uploads, data, logs directories
- **SSL**: Self-signed script included (`setup-ssl-selfsigned.sh`)

### God Game Server Integration
- **Server**: Colyseus multiplayer server running on port 3001
- **Database**: PostgreSQL with PostGIS for spatial data (port 5432)
- **Cache**: Redis for state management and pub/sub (port 6379)
- **Client**: Babylon.js 3D client connects via WebSocket to Colyseus server
- **Deployment**: Client files deployed to `public/god-game/`, server runs separately
- **Health check**: `http://localhost:3001/api/health`

## Important Files

- `server.js` - Main Express application
- `package.json` - Dependencies and scripts  
- `docker-compose.yml` - Development containers
- `docker-compose.prod.yml` - Production setup with Nginx
- `public/app.js` - Admin dashboard frontend logic
- `public/index.html` - Admin dashboard UI
- `public/landing.html` - Public app gallery
- `deploy.sh` - Production deployment script

## Security Features

- Helmet.js security headers with CSP
- Rate limiting on login attempts  
- Session security (httpOnly, secure in production)
- Password hashing with bcrypt
- File type validation on uploads
- Admin-only sensitive operations
- Trust proxy configuration for reverse proxy setups

## Database Operations

The app uses SQLite with automatic table creation and migrations:
- Database file: `data/dashboard.db`  
- Auto-creates users/previews tables on startup
- Handles schema updates (adding role/permissions columns)
- First user automatically becomes admin

## External Integrations

- **Ollama**: Local LLM server integration via `/api/llm` endpoint
- **System monitoring**: Real-time CPU, memory, disk, network stats
- **File processing**: PDF generation, OCR with Tesseract.js
- **Pushover notifications**: Server health alerts via `/usr/local/bin/pushover` and `/opt/pushover/`

## Territory Game Health Monitoring

Automated health monitoring system for the territory game with Pushover notifications:

### Health Check Script
- **Location**: `/root/project/dashboard/territory-health-check.sh`
- **Schedule**: Every 2 hours from 8am to 8pm (8, 10, 12, 14, 16, 18, 20:00)
- **Logs**: `/root/project/dashboard/logs/territory-health.log` and `territory-health-cron.log`

### Health Checks Performed
- **API Health**: Territory API endpoint (`/territory-api/health`)
- **Container Status**: territory-backend, multiplayer-game-redis-1, multiplayer-game-postgres-1
- **Database Connectivity**: PostgreSQL connection test via `pg_isready`
- **Redis Connectivity**: Redis ping test
- **Game Activity**: Recent moves count from MovesAudit table
- **System Resources**: Disk usage and memory usage monitoring

### Notification Levels
- **HEALTHY**: All systems operational (throttled to every 12 hours to avoid spam)
- **WARNING**: High resource usage (>80% disk, >90% memory)
- **UNHEALTHY**: Service issues, API failures
- **CRITICAL**: Container failures, database/Redis down (priority 1 alerts)

### Pushover Integration
Uses existing Pushover system at `/opt/pushover/` with credentials in `pushover_config.py`:
- **Command**: `python3 /usr/local/bin/pushover "message" -t "title" -p priority`
- **API Token**: Configured for territory game alerts
- **Test command**: `python3 /usr/local/bin/pushover "test message" -t "Test"`

### Recent Fixes Applied (2025-08-21)
1. **Redis connectivity restored**: Fixed hardcoded IP addresses in docker-compose.prod.yml
2. **Container service names**: Changed from `redis://172.20.0.5:6379` to `redis://multiplayer-game-redis-1:6379`
3. **Database connectivity**: Updated PostgreSQL connection from hardcoded IP to container name
4. **Health monitoring**: Comprehensive monitoring system with automatic notifications