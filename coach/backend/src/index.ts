// Polyfill crypto for Lucia compatibility
import { webcrypto } from 'node:crypto';
globalThis.crypto = webcrypto as Crypto;

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import socketIo from 'fastify-socket.io';
import { Server } from 'socket.io';
import pino from 'pino';

import authRoutes from './routes/auth';
import teamRoutes from './routes/teams';
import matchRoutes from './routes/matches';
import { setupSocketHandlers } from './services/socketService';
import { verifyAuth } from './middleware/auth';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const server = Fastify({
  logger
});

// Register plugins
server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});

server.register(helmet, {
  contentSecurityPolicy: false // Will configure properly for production
});

server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

server.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'your-secret-key-min-32-chars-long!',
  parseOptions: {}
});

server.register(socketIo, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(teamRoutes, { prefix: '/api/teams' });
server.register(matchRoutes, { prefix: '/api' });

// Socket.io setup
server.ready().then(() => {
  const io = server.io as Server;
  setupSocketHandlers(io);
});

// Error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();