import { FastifyPluginAsync } from 'fastify'
import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_, reply) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`)
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }
    } catch (error) {
      return reply.status(503).send({
        status: 'unhealthy',
        error: 'Database connection failed',
      })
    }
  })
}