# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Football Coach PWA** - a 9-a-side football team management application with tactical planning, real-time match tracking, and offline support. The project is a full-stack TypeScript monorepo with modern web technologies.

## Architecture

### System Design
```
Frontend (PWA) → Backend API → PostgreSQL
                    ↓
              Socket.IO ← Redis
```

**Key Pattern**: The application follows a sophisticated football management domain model with:
- **Time-based Match Management**: Matches are divided into time blocks with player assignments
- **Real-time Collaboration**: WebSocket events for live match updates
- **Offline-first Design**: PWA with IndexedDB and service worker
- **Complex State Management**: Multiple Zustand stores with persistent state

### Backend Architecture (Node.js + Fastify)
- **Route Structure**: Domain-based routes (`auth.ts`, `teams.ts`, `matches.ts`)
- **Authentication**: Lucia Auth with Prisma adapter, session-based auth
- **Database**: Prisma ORM with sophisticated relational schema
- **Real-time**: Socket.IO with room-based match broadcasting
- **Validation**: Zod schemas for all API endpoints

**Key Backend Patterns:**
- All routes use `verifyAuth` middleware for protected endpoints
- Match operations emit Socket.IO events to match rooms
- Complex database queries using Prisma include patterns for related data
- Block/Assignment system for time-based player positioning

### Frontend Architecture (React + TypeScript)
- **State Management**: Zustand stores (`authStore`, `teamStore`, `matchStore`, `seasonStore`, `offlineStore`)
- **Routing**: React Router with nested team/season/match routes
- **UI Framework**: Tailwind CSS with custom components
- **PWA Features**: Vite PWA plugin with Workbox
- **Real-time**: Socket.IO client with automatic reconnection

**Key Frontend Patterns:**
- Service layer abstracts API calls (`apiClient`, `seasonService`)
- Stores follow async action pattern with loading/error states
- Components use custom hooks for store integration
- Drag-and-drop for player assignment using @dnd-kit

## Essential Commands

### Development Workflow
```bash
# Quick setup for new developers
make quick-start

# Standard development
make install                 # Install all dependencies
make env                    # Create .env files from examples
make reserve-ports          # Reserve ports using portman.py
make dev                    # Start dev servers (frontend:5173, backend:3001)

# Alternative development modes
make dev-docker             # Full Docker development
npm run dev                 # Just start frontend + backend
npm --workspace=backend run dev    # Backend only
npm --workspace=frontend run dev   # Frontend only
```

### Database Operations
```bash
make db-migrate             # Run Prisma migrations
make db-seed               # Seed with sample data
make db-push               # Push schema changes
make db-reset              # Full database reset (destructive)

# Direct Prisma commands
npm --workspace=backend run db:generate    # Generate Prisma client
```

### Testing & Quality
```bash
make test                  # Run all tests
make lint                  # ESLint on backend + frontend
make typecheck            # TypeScript checks
make build                # Production build
```

### Port Management Integration
This project integrates with the repository's port management system:
```bash
make ports                 # Show current port usage
make reserve-ports         # Reserve coach app ports
python3 /root/project/portman.py list    # List all ports
```

**Default Ports:**
- Frontend: 5177 (required for SSH tunnel compatibility)
- Backend: 3006 (Docker)  
- Database: 5435 (to avoid conflicts with system PostgreSQL)
- Redis: 6382

### Production Deployment
```bash
make build                 # Build frontend + backend
make docker-build         # Build Docker images  
make deploy               # Full production deployment
make start                # Start production containers
```

## Key Technical Concepts

### Database Schema Understanding
The database uses a sophisticated football management model:

**Core Hierarchy:**
```
User → Team → Season → Match
              ↓
         Player → Assignment → Block
```

**Critical Relationships:**
- `Block`: Time periods within matches (0-45min, 45-90min, etc.)
- `Assignment`: Player-to-position mappings within blocks
- `MatchPlan`: Strategic planning data (formation, notes, objectives)
- `Substitution`/`Goal`: Match events with timestamps
- `Match.venue`: Optional venue field for custom match locations

**Key Pattern**: Player assignments are time-based through the Block system, not direct match-to-player relationships.

### State Management Patterns

**Store Architecture:**
- `authStore`: User authentication and session
- `teamStore`: Team and player management
- `seasonStore`: Season, match, and formation management
- `matchStore`: Live match state and real-time updates
- `offlineStore`: Offline queue and sync management

**Critical Store Pattern:**
```typescript
// All stores follow this async action pattern
someAction: async (params) => {
  set({ isLoading: true, error: null });
  try {
    const result = await service.doSomething(params);
    set({ data: result, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
    throw error; // Re-throw for component handling
  }
}
```

### Real-time Architecture

**Socket.IO Rooms:**
- `match:${matchId}`: Match-specific events
- Events: `match:started`, `match:stopped`, `substitution:made`, `goal:scored`

**Frontend Socket Integration:**
- Auto-reconnection with state restoration
- Room management in match components
- Event broadcasting from backend after database updates

### PWA and Offline Support

**Service Worker Strategy:**
- Static asset caching via Workbox
- API response caching with cache-first strategy
- Background sync for offline actions

**Offline Queue Pattern:**
- Actions queued in `offlineStore` when offline
- Automatic replay when connection restored
- Conflict resolution for concurrent edits

## Environment Configuration

### Required Backend Variables
```env
# Database
DATABASE_URL=postgresql://coach:coach123@localhost:5435/coach

# Authentication (minimum 32 characters each)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long!
REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long!
COOKIE_SECRET=your-super-secret-cookie-key-minimum-32-characters-long!

# Server
PORT=3001
HOST=localhost
FRONTEND_URL=http://localhost:5173

# Optional
REDIS_URL=redis://localhost:6382
NODE_ENV=development
```

### Frontend Variables
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Development Patterns

### API Route Patterns
All routes follow this structure:
```typescript
export default async function routeName(fastify: FastifyInstance) {
  fastify.get('/endpoint', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { param } = request.params as { param: string };
    
    // 1. Parse/validate input with Zod
    const data = schema.parse(request.body);
    
    // 2. Check ownership/permissions
    const resource = await prisma.model.findFirst({
      where: { id: param, owner: request.user!.id }
    });
    
    if (!resource) {
      return reply.status(404).send({ error: 'Not found' });
    }
    
    // 3. Perform operation
    const result = await prisma.model.operation();
    
    // 4. Emit socket events if needed
    fastify.io.to(`room:${id}`).emit('event', { data: result });
    
    return reply.send({ result });
  });
}
```

### Component Patterns
React components typically follow this structure:
```typescript
function ComponentName() {
  const { data, isLoading, error, actions } = useStoreHook();
  const [localState, setLocalState] = useState();
  
  useEffect(() => {
    // Load data on mount
    actions.loadData();
  }, [dependencies]);
  
  const handleAction = async () => {
    try {
      await actions.performAction(data);
      // Success handling
    } catch (error) {
      // Error is handled by store
    }
  };
  
  if (isLoading) return <LoadingComponent />;
  if (error) return <ErrorComponent />;
  
  return <MainComponent />;
}
```

### Database Query Patterns
Complex queries use Prisma's include pattern:
```typescript
const match = await prisma.match.findFirst({
  where: { id: matchId },
  include: {
    season: { include: { team: true } },
    blocks: {
      include: {
        assignments: { include: { player: true } }
      },
      orderBy: { index: 'asc' }
    },
    plan: { include: { formation: true } }
  }
});
```

## Common Development Tasks

### Adding a New Feature
1. **Database**: Add Prisma schema changes, run migration
2. **Backend**: Add routes with Zod validation and auth middleware  
3. **Frontend**: Add service methods, store actions, components
4. **Real-time**: Add Socket.IO events if needed
5. **Testing**: Add tests for critical paths

### Venue Management Feature (Recently Implemented)
The venue field allows custom match locations beyond the default "Home Ground"/"Away Ground":

**Implementation Details:**
- **Database**: Added `venue String?` field to Match model (optional, max 100 chars)
- **Backend API**: Updated createMatch/updateMatch schemas to accept venue field
- **Frontend**: Added venue input to both CreateMatchModal and EditMatchModal
- **Display Logic**: Shows custom venue or falls back to "Home Ground"/"Away Ground"
- **Validation**: Zod schema validation on backend, optional field with length limits

**Key Files Modified:**
- `backend/prisma/schema.prisma` - Added venue field to Match model
- `backend/src/routes/matches.ts` - Updated validation schemas and API endpoints
- `frontend/src/types/index.ts` - Added venue to Match interface
- `frontend/src/services/seasonService.ts` - Updated service methods
- `frontend/src/stores/seasonStore.ts` - Updated store actions
- `frontend/src/pages/MatchesPage.tsx` - Added venue inputs to modals
- `frontend/src/pages/PlanningPage.tsx` - Updated EditMatchModal

**Usage:**
- Edit via pencil icons on match cards in Season view
- Edit from match planning page
- Supports names like "Wembley Stadium", "Old Trafford", etc.
- Displays custom venue in match cards when specified

### Debugging Real-time Issues
1. Check Socket.IO room membership in browser dev tools
2. Verify backend events are emitted after database updates
3. Test offline/online state transitions
4. Monitor store state in Redux DevTools (Zustand integration)

### Working with Match State
The match management system is complex - understand these key concepts:
- **Blocks**: Time-based periods within matches
- **Assignments**: Player positions within time blocks
- **Live State**: Real-time match tracking with WebSocket updates
- **Plans**: Pre-match tactical planning vs. live match state
- **Venue Management**: Optional venue field for matches (e.g., "Wembley Stadium", "Old Trafford")
  - Defaults to "Home Ground" or "Away Ground" if no venue specified
  - Editable via pencil icons on match cards or planning page
  - Supports custom venue names up to 100 characters

## Troubleshooting

### Port Conflicts
```bash
make ports                 # Check current usage
python3 /root/project/portman.py free 3001    # Free conflicting port
make reserve-ports         # Re-reserve ports
```

### Database Issues
```bash
make db-reset              # Nuclear option - full reset
make health               # Check service health
docker-compose logs db    # Check database logs
```

### Build/Dependency Issues
```bash
make clean                # Clean all dependencies
make install              # Reinstall everything
make status              # Check service status
```

### WebSocket Connection Issues
1. Check CORS configuration in backend
2. Verify FRONTEND_URL environment variable
3. Test Socket.IO connection in browser network tab
4. Check Redis connection if using Redis adapter