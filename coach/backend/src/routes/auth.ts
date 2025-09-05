import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { lucia, prisma } from '../auth/lucia';
import { verifyAuth, optionalAuth } from '../middleware/auth';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export default async function authRoutes(fastify: FastifyInstance) {
  // Sign up
  fastify.post('/signup', async (request, reply) => {
    try {
      const { email, password } = signupSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.status(400).send({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash
        }
      });

      // Create session
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      reply.header('Set-Cookie', sessionCookie.serialize());
      return reply.send({ 
        user: { id: user.id, email: user.email },
        message: 'User created successfully' 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash);

      if (!validPassword) {
        return reply.status(400).send({ error: 'Invalid credentials' });
      }

      // Create session
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      reply.header('Set-Cookie', sessionCookie.serialize());
      return reply.send({ 
        user: { id: user.id, email: user.email },
        message: 'Logged in successfully' 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Logout
  fastify.post('/logout', { preHandler: [verifyAuth] }, async (request, reply) => {
    if (!request.session) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    await lucia.invalidateSession(request.session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    
    reply.header('Set-Cookie', sessionCookie.serialize());
    return reply.send({ message: 'Logged out successfully' });
  });

  // Get current user
  fastify.get('/me', { preHandler: [optionalAuth] }, async (request, reply) => {
    if (!request.user) {
      return reply.send({ user: null });
    }

    return reply.send({ 
      user: { 
        id: request.user.id, 
        email: request.user.email 
      } 
    });
  });
}