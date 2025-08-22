import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import {
  hashPassword,
  verifyPassword,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../services/auth.js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(50),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    
    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)
    
    if (existing.length > 0) {
      return reply.status(409).send({ error: 'User already exists' })
    }

    // Create user
    const passwordHash = await hashPassword(body.password)
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        displayName: body.displayName,
      })
      .returning()

    // Create tokens
    const accessToken = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    )
    const refreshToken = await createRefreshToken(user.id)

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    })

    return { accessToken, user: { id: user.id, email: user.email, displayName: user.displayName } }
  })

  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)
    
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    // Create tokens
    const accessToken = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    )
    const refreshToken = await createRefreshToken(user.id)

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    return { accessToken, user: { id: user.id, email: user.email, displayName: user.displayName } }
  })

  // Refresh
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken
    
    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' })
    }

    const userId = await verifyRefreshToken(refreshToken)
    if (!userId) {
      return reply.status(401).send({ error: 'Invalid refresh token' })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    
    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    const accessToken = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '15m' }
    )

    return { accessToken }
  })

  // Logout
  fastify.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken
    
    if (refreshToken) {
      await revokeRefreshToken(refreshToken)
      reply.clearCookie('refreshToken')
    }

    return { success: true }
  })

  // Get current user
  fastify.get('/me', async (request, reply) => {
    try {
      await request.jwtVerify()
      const { userId } = request.user as { userId: string }
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      return { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName,
        createdAt: user.createdAt,
      }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })
}