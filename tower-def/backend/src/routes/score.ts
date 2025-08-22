import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { scores } from '../db/schema.js'

const submitScoreSchema = z.object({
  score: z.number().min(0).max(1000000),
  mode: z.enum(['normal', 'hard', 'endless']),
  waveReached: z.number().min(1).max(100),
  durationMs: z.number().min(0),
  seed: z.string().min(1).max(100),
})

export const scoreRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (request, reply) => {
    const body = submitScoreSchema.parse(request.body)
    
    let userId: string | null = null
    try {
      await request.jwtVerify()
      userId = (request.user as { userId: string }).userId
    } catch {
      // Allow anonymous scores
    }

    // Validate score with heuristics
    const minDuration = body.waveReached * 5000 // At least 5 seconds per wave
    if (body.durationMs < minDuration) {
      return reply.status(400).send({ error: 'Invalid score: duration too short' })
    }

    const maxScore = body.waveReached * 10000 // Max 10k per wave
    if (body.score > maxScore) {
      return reply.status(400).send({ error: 'Invalid score: score too high' })
    }

    const [score] = await db
      .insert(scores)
      .values({
        userId,
        score: body.score,
        mode: body.mode,
        waveReached: body.waveReached,
        durationMs: body.durationMs,
        seed: body.seed,
        clientVersion: '1.0.0',
      })
      .returning()

    return { success: true, scoreId: score.id }
  })
}