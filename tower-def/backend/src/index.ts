import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { config } from './config/index.js'
import { authRoutes } from './routes/auth.js'
import { scoreRoutes } from './routes/score.js'
import { saveRoutes } from './routes/save.js'
import { leaderboardRoutes } from './routes/leaderboard.js'
import { healthRoutes } from './routes/health.js'

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: config.NODE_ENV === 'development' 
      ? { target: 'pino-pretty' }
      : undefined,
  },
})

async function start() {
  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })

  if (config.NODE_ENV === 'development') {
    await fastify.register(cors, {
      origin: true,
      credentials: true,
    })
  }

  await fastify.register(cookie)
  
  await fastify.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  })

  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
  })

  // Register routes
  await fastify.register(authRoutes, { prefix: '/auth' })
  await fastify.register(scoreRoutes, { prefix: '/score' })
  await fastify.register(saveRoutes, { prefix: '/save' })
  await fastify.register(leaderboardRoutes, { prefix: '/leaderboard' })
  await fastify.register(healthRoutes, { prefix: '/healthz' })

  // Start server
  try {
    await fastify.listen({ 
      port: config.PORT, 
      host: config.HOST,
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()