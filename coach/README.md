# Football Coach - 9-a-side Team Management PWA

⚽ A Progressive Web App for 9-a-side football team management: tactical planning, real-time match tracking, offline support, and reporting.

## Features

### 🏃‍♂️ Core Functionality
- **Team Management**: Create teams, manage player rosters with skill ratings
- **Match Planning**: Tactical formations, player positions, substitution planning
- **Live Match Tracking**: Real-time score tracking, substitutions, events
- **Season Management**: Organize matches across seasons with statistics
- **Offline Support**: Works without internet, syncs when connection restored

### 🔧 Technical Features
- **Progressive Web App**: Install on mobile/desktop, works offline
- **Real-time Updates**: WebSocket for live match collaboration
- **Responsive Design**: Mobile-first, works on all devices
- **Modern Stack**: React 18, TypeScript, Node.js 20, PostgreSQL

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Python 3 (for port management)

### Development Setup

```bash
# Clone and navigate
cd coach

# Quick setup for new developers
make quick-start

# OR manual setup:
make install
make env  # Edit .env files with your values
make reserve-ports
make db-migrate
make db-seed
make dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Database: localhost:5432

### Production Deployment

```bash
make build
make docker-build
make deploy
```

## Architecture

### System Overview
```
Client (PWA) → Nginx → Fastify API → PostgreSQL
                 ↓
              Socket.IO ← Redis
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Router
- Dexie (IndexedDB)
- Socket.IO client
- DnD Kit (drag & drop)
- Recharts (analytics)

**Backend:**
- Node.js 20
- Fastify (web framework)
- Prisma (ORM)
- Socket.IO (real-time)
- Lucia Auth (authentication)
- Zod (validation)
- Pino (logging)

**Infrastructure:**
- PostgreSQL (database)
- Redis (caching/sessions)
- Docker (containerization)
- Nginx (reverse proxy)

## Development

### Available Commands

```bash
# Development
make dev              # Start development servers
make dev-docker       # Start with Docker Compose
make dev-refresh      # Complete refresh cycle

# Database
make db-migrate       # Run Prisma migrations
make db-seed          # Seed with sample data
make db-reset         # Reset database (destructive)

# Testing & Quality
make test             # Run all tests
make lint             # Run linting
make typecheck        # TypeScript checks

# Production
make build            # Build for production
make deploy           # Deploy to production

# Utilities
make logs             # View application logs
make health           # Check service health
make status           # Show development status
make clean            # Clean dependencies
```

### Port Management

This project uses the repository's port management system:

```bash
# Check available ports
python3 /root/project/portman.py list

# Reserve ports for this project
make reserve-ports

# Find available ports
python3 /root/project/portman.py find --start 3000
```

**Default Ports:**
- Frontend: 5173
- Backend: 3001
- PostgreSQL: 5432
- Redis: 6379

### Environment Variables

Copy and customize the example files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend variables:
```env
DATABASE_URL=postgresql://coach:coach123@localhost:5432/coach
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long!
REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long!
COOKIE_SECRET=your-super-secret-cookie-key-minimum-32-characters-long!
```

## Database Schema

### Core Entities
- **Users & Auth**: User, Session
- **Teams & Players**: Team, Player
- **Seasons & Matches**: Season, Match
- **Planning & Events**: Formation, MatchPlan, Block, Assignment, Substitution, Goal

### Key Relationships
- Users own Teams
- Teams have Players and Seasons
- Seasons contain Matches
- Matches have Plans, Assignments, and Events

## API Documentation

### Authentication
```
POST /api/auth/signup     # Create account
POST /api/auth/login      # Sign in
POST /api/auth/logout     # Sign out
GET  /api/auth/me         # Current user
```

### Teams & Players
```
GET    /api/teams                    # List teams
POST   /api/teams                    # Create team
GET    /api/teams/:id                # Get team details
PUT    /api/teams/:id                # Update team
DELETE /api/teams/:id                # Delete team
GET    /api/teams/:id/players        # List players
POST   /api/teams/:id/players        # Create player
PUT    /api/teams/players/:id        # Update player
DELETE /api/teams/players/:id        # Delete player
```

### Matches & Seasons
```
GET  /api/teams/:id/seasons          # List seasons
POST /api/teams/:id/seasons          # Create season
GET  /api/seasons/:id/matches        # List matches
POST /api/seasons/:id/matches        # Create match
GET  /api/matches/:id                # Get match
POST /api/matches/:id/start          # Start match
POST /api/matches/:id/stop           # Stop match
POST /api/matches/:id/substitutions  # Make substitution
POST /api/matches/:id/goals          # Score goal
```

### WebSocket Events
```
# Client to Server
match:join              # Join match room
match:leave             # Leave match room
match:update            # Update match state
substitution:make       # Record substitution
goal:score             # Record goal

# Server to Client
match:started          # Match started
match:stopped          # Match stopped
match:updated          # State updated
substitution:made      # Substitution confirmed
goal:scored           # Goal confirmed
timer:tick            # Match timer update
```

## Offline Support

The app works offline using:
- **Service Worker**: Caches static assets and API responses
- **IndexedDB**: Stores matches, teams, and offline events
- **Event Queue**: Queues actions when offline, syncs when online
- **Background Sync**: Automatic sync when connection restored

## Performance Targets

- API response time: < 200ms
- Page load time: < 3s on 3G
- Real-time latency: < 100ms
- Database queries: < 50ms
- Concurrent users: 100+ per match
- Uptime target: 99.9%

## Security

- **Authentication**: Lucia Auth with secure sessions
- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: HTTP-only cookies
- **Rate Limiting**: API endpoints protected
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection**: Parameterized queries via Prisma
- **CORS**: Strict origin policies

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
make ports
# Free up conflicting ports
python3 /root/project/portman.py free 3001
```

**Database connection:**
```bash
# Reset database
make db-reset
# Check database health
docker-compose exec db pg_isready -U coach
```

**Build issues:**
```bash
# Clean and rebuild
make clean
make install
make build
```

**Docker issues:**
```bash
# Clean Docker resources
make docker-clean
# Rebuild images
make docker-build
```

### Development Tips

1. **Use the port manager** - Always check port availability before starting services
2. **Monitor logs** - Use `make logs` to see real-time application logs
3. **Health checks** - Run `make health` to verify all services are running
4. **Clean state** - Use `make dev-refresh` for a complete reset

## Contributing

1. Check port availability with `make ports`
2. Create feature branch
3. Run tests: `make test`
4. Check types: `make typecheck`
5. Lint code: `make lint`
6. Submit PR

## License

MIT License - See LICENSE file for details.

---

**Built with ⚽ for football coaches who love tactical planning**