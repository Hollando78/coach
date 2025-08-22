import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { scores, users } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

const leaderboardQuerySchema = z.object({
  limit: z.string().transform(Number).default('50'),
  mode: z.enum(['normal', 'hard', 'endless']).optional(),
})

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request) => {
    const query = leaderboardQuerySchema.parse(request.query)
    
    const baseQuery = db
      .select({
        id: scores.id,
        score: scores.score,
        mode: scores.mode,
        waveReached: scores.waveReached,
        durationMs: scores.durationMs,
        createdAt: scores.createdAt,
        displayName: users.displayName,
      })
      .from(scores)
      .leftJoin(users, eq(scores.userId, users.id))
      .orderBy(desc(scores.score))
      .limit(Math.min(query.limit, 100))

    const results = query.mode
      ? await baseQuery.where(eq(scores.mode, query.mode))
      : await baseQuery

    return {
      leaderboard: results.map((r, index) => ({
        rank: index + 1,
        ...r,
        displayName: r.displayName || 'Anonymous',
      })),
    }
  })
}