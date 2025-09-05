import { Server, Socket } from 'socket.io';
import { lucia } from '../auth/lucia';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const sessionId = lucia.readSessionCookie(socket.request.headers.cookie || '');
      
      if (!sessionId) {
        return next(new Error('Authentication error'));
      }

      const { session, user } = await lucia.validateSession(sessionId);
      
      if (!session || !user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join match room
    socket.on('match:join', (data: { matchId: string }) => {
      const { matchId } = data;
      socket.join(`match:${matchId}`);
      console.log(`User ${socket.userId} joined match ${matchId}`);
      
      // Notify others in the room
      socket.to(`match:${matchId}`).emit('user:joined', {
        userId: socket.userId
      });
    });

    // Leave match room
    socket.on('match:leave', (data: { matchId: string }) => {
      const { matchId } = data;
      socket.leave(`match:${matchId}`);
      console.log(`User ${socket.userId} left match ${matchId}`);
      
      // Notify others in the room
      socket.to(`match:${matchId}`).emit('user:left', {
        userId: socket.userId
      });
    });

    // Real-time match updates
    socket.on('match:update', (data: { matchId: string; currentMinute: number }) => {
      const { matchId, currentMinute } = data;
      
      // Broadcast to all users in the match room
      socket.to(`match:${matchId}`).emit('match:updated', {
        currentMinute,
        updatedBy: socket.userId
      });
    });

    // Handle timer ticks for live matches
    socket.on('timer:tick', (data: { matchId: string; minute: number }) => {
      const { matchId, minute } = data;
      
      // Broadcast timer update to match room
      io.to(`match:${matchId}`).emit('timer:tick', {
        minute,
        timestamp: new Date().toISOString()
      });
    });

    // Handle formation changes
    socket.on('formation:update', (data: { matchId: string; formation: any }) => {
      const { matchId, formation } = data;
      
      socket.to(`match:${matchId}`).emit('formation:updated', {
        formation,
        updatedBy: socket.userId
      });
    });

    // Handle assignment changes
    socket.on('assignments:update', (data: { matchId: string; assignments: any[] }) => {
      const { matchId, assignments } = data;
      
      socket.to(`match:${matchId}`).emit('assignments:updated', {
        assignments,
        updatedBy: socket.userId
      });
    });

    // Handle tactical notes
    socket.on('notes:update', (data: { matchId: string; notes: string }) => {
      const { matchId, notes } = data;
      
      socket.to(`match:${matchId}`).emit('notes:updated', {
        notes,
        updatedBy: socket.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Leave all rooms and notify
      socket.rooms.forEach(room => {
        if (room.startsWith('match:')) {
          socket.to(room).emit('user:left', {
            userId: socket.userId
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Periodic timer for live matches
  setInterval(() => {
    // This would typically query the database for live matches
    // and emit timer updates. For now, we'll rely on client-side timers
    // with periodic sync checks
  }, 1000);
}