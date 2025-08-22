import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '../db/index.js'
import { saves } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

const saveGameSchema = z.object({
  blob: z.object({
    gameState: z.object({
      wave: z.number(),
      lives: z.number(),
      cash: z.number(),
      towers: z.array(z.any()),
      creeps: z.array(z.any()),
      seed: z.string(),
      timestamp: z.number(),
    }),
  }),
})

export const saveRoutes: FastifyPluginAsync = async (fastify) => {
  // Get latest save
  fastify.get('/', async (request, reply) => {
    try {
      await request.jwtVerify()
      const { userId } = request.user as { userId: string }
      
      const [save] = await db
        .select()
        .from(saves)
        .where(eq(saves.userId, userId))
        .orderBy(desc(saves.createdAt))
        .limit(1)
      
      if (!save) {
        return reply.status(404).send({ error: 'No save found' })
      }

      return { save: save.blob }
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // Save game
  fastify.post('/', async (request, reply) => {
    try {
      await request.jwtVerify()
      const { userId } = request.user as { userId: string }
      
      const body = saveGameSchema.parse(request.body)
      
      // Validate save size (max 1MB)
      const saveSize = JSON.stringify(body.blob).length
      if (saveSize > 1024 * 1024) {
        return reply.status(400).send({ error: 'Save too large' })
      }

      await db
        .insert(saves)
        .values({
          userId,
          blob: body.blob,
        })

      return { success: true }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid save data' })
      }
      return reply.status(401).send({ error: 'Unauthorized' })
    }
  })
}