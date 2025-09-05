import { FastifyRequest, FastifyReply } from 'fastify';
import { lucia } from '../auth/lucia';
import { User, Session } from 'lucia';

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
    session: Session | null;
  }
}

export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = lucia.readSessionCookie(request.headers.cookie ?? '');
  
  if (!sessionId) {
    request.user = null;
    request.session = null;
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const { session, user } = await lucia.validateSession(sessionId);
  
  if (!session) {
    request.user = null;
    request.session = null;
    return reply.status(401).send({ error: 'Invalid session' });
  }

  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    reply.header('Set-Cookie', sessionCookie.serialize());
  }
  
  request.user = user;
  request.session = session;
}

export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = lucia.readSessionCookie(request.headers.cookie ?? '');
  
  if (!sessionId) {
    request.user = null;
    request.session = null;
    return;
  }

  const { session, user } = await lucia.validateSession(sessionId);
  
  if (session && session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    reply.header('Set-Cookie', sessionCookie.serialize());
  }
  
  request.user = user;
  request.session = session;
}