import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../auth/lucia';
import { verifyAuth } from '../middleware/auth';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100)
});

const createPlayerSchema = z.object({
  name: z.string().min(1).max(100),
  shirtNo: z.number().int().min(1).max(99).optional(),
  skillRating: z.number().min(1).max(10).default(5),
  preferredPositions: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true)
});

const updatePlayerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shirtNo: z.number().int().min(1).max(99).nullable().optional(),
  skillRating: z.number().min(1).max(10).optional(),
  preferredPositions: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional()
});

export default async function teamRoutes(fastify: FastifyInstance) {
  // Get all teams for user
  fastify.get('/', { preHandler: [verifyAuth] }, async (request, reply) => {
    const teams = await prisma.team.findMany({
      where: { ownerId: request.user!.id },
      include: {
        _count: {
          select: { players: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ teams });
  });

  // Create team
  fastify.post('/', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { name } = createTeamSchema.parse(request.body);

      const team = await prisma.team.create({
        data: {
          name,
          ownerId: request.user!.id
        },
        include: {
          _count: {
            select: { players: true }
          }
        }
      });

      return reply.status(201).send({ team });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Get team by ID
  fastify.get('/:teamId', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    const team = await prisma.team.findFirst({
      where: { 
        id: teamId,
        ownerId: request.user!.id 
      },
      include: {
        players: {
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { 
            players: true,
            seasons: true 
          }
        }
      }
    });

    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    return reply.send({ team });
  });

  // Update team
  fastify.put('/:teamId', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { teamId } = request.params as { teamId: string };
      const { name } = createTeamSchema.parse(request.body);

      const team = await prisma.team.findFirst({
        where: { 
          id: teamId,
          ownerId: request.user!.id 
        }
      });

      if (!team) {
        return reply.status(404).send({ error: 'Team not found' });
      }

      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: { name }
      });

      return reply.send({ team: updatedTeam });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Delete team
  fastify.delete('/:teamId', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    const team = await prisma.team.findFirst({
      where: { 
        id: teamId,
        ownerId: request.user!.id 
      }
    });

    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    await prisma.team.delete({
      where: { id: teamId }
    });

    return reply.send({ message: 'Team deleted successfully' });
  });

  // Get team players
  fastify.get('/:teamId/players', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { teamId } = request.params as { teamId: string };

    const team = await prisma.team.findFirst({
      where: { 
        id: teamId,
        ownerId: request.user!.id 
      }
    });

    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
    }

    const players = await prisma.player.findMany({
      where: { teamId },
      orderBy: { name: 'asc' }
    });

    return reply.send({ players });
  });

  // Create player
  fastify.post('/:teamId/players', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { teamId } = request.params as { teamId: string };
      const { name, shirtNo, skillRating, preferredPositions, isAvailable } = createPlayerSchema.parse(request.body);

      const team = await prisma.team.findFirst({
        where: { 
          id: teamId,
          ownerId: request.user!.id 
        }
      });

      if (!team) {
        return reply.status(404).send({ error: 'Team not found' });
      }

      // Check if shirt number is already taken
      if (shirtNo) {
        const existingPlayer = await prisma.player.findFirst({
          where: { 
            teamId,
            shirtNo 
          }
        });

        if (existingPlayer) {
          return reply.status(400).send({ error: 'Shirt number already taken' });
        }
      }

      const player = await prisma.player.create({
        data: {
          name,
          shirtNo,
          skillRating,
          preferredPositions: JSON.stringify(preferredPositions),
          isAvailable,
          teamId
        }
      });

      return reply.status(201).send({ player });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Update player
  fastify.put('/players/:playerId', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { playerId } = request.params as { playerId: string };
      const updateData = updatePlayerSchema.parse(request.body);

      const player = await prisma.player.findFirst({
        where: { id: playerId },
        include: { team: true }
      });

      if (!player || player.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Player not found' });
      }

      // Check if shirt number is already taken by another player
      if (updateData.shirtNo) {
        const existingPlayer = await prisma.player.findFirst({
          where: { 
            teamId: player.teamId,
            shirtNo: updateData.shirtNo,
            id: { not: playerId }
          }
        });

        if (existingPlayer) {
          return reply.status(400).send({ error: 'Shirt number already taken' });
        }
      }

      const updatedPlayer = await prisma.player.update({
        where: { id: playerId },
        data: {
          ...updateData,
          preferredPositions: updateData.preferredPositions ? 
            JSON.stringify(updateData.preferredPositions) : undefined
        }
      });

      return reply.send({ player: updatedPlayer });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Delete player
  fastify.delete('/players/:playerId', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { playerId } = request.params as { playerId: string };

    const player = await prisma.player.findFirst({
      where: { id: playerId },
      include: { team: true }
    });

    if (!player || player.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Player not found' });
    }

    await prisma.player.delete({
      where: { id: playerId }
    });

    return reply.send({ message: 'Player deleted successfully' });
  });
}