import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../auth/lucia';
import { verifyAuth } from '../middleware/auth';

const createSeasonSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const createMatchSchema = z.object({
  date: z.string().datetime(),
  opponent: z.string().min(1).max(100),
  homeAway: z.enum(['home', 'away']).default('home'),
  venue: z.string().max(100).optional(),
  formationId: z.string().optional()
});

const updateMatchSchema = z.object({
  date: z.string().datetime().optional(),
  opponent: z.string().min(1).max(100).optional(),
  homeAway: z.enum(['home', 'away']).optional(),
  venue: z.string().max(100).optional()
});

const createFormationSchema = z.object({
  name: z.string().min(1).max(100),
  shapeJSON: z.record(z.any()),
  isPreset: z.boolean().default(false)
});

const saveBlocksSchema = z.object({
  blocks: z.array(z.object({
    index: z.number(),
    startMin: z.number(),
    endMin: z.number(),
    assignments: z.array(z.object({
      playerId: z.string(),
      position: z.string(),
      isBench: z.boolean().default(false)
    }))
  }))
});

const updateMatchPlanSchema = z.object({
  formationId: z.string().nullable().optional(),
  notes: z.string().default(''),
  objectivesJSON: z.array(z.string()).default([]),
  opponentInfoJSON: z.record(z.any()).default({})
});

const makeSubstitutionSchema = z.object({
  minute: z.number().int().min(0),
  offPlayerId: z.string(),
  onPlayerId: z.string(),
  position: z.string()
});

const scoreGoalSchema = z.object({
  playerId: z.string(),
  minute: z.number().int().min(0),
  notes: z.string().default('')
});

const savePlayerAssignmentsSchema = z.object({
  assignments: z.array(z.object({
    playerId: z.string(),
    position: z.string(),
    isBench: z.boolean().default(false)
  }))
});

const updatePlayerAvailabilitySchema = z.object({
  playerId: z.string(),
  isAvailable: z.boolean()
});

export default async function matchRoutes(fastify: FastifyInstance) {
  // Get seasons for team
  fastify.get('/teams/:teamId/seasons', { preHandler: [verifyAuth] }, async (request, reply) => {
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

    const seasons = await prisma.season.findMany({
      where: { 
        teamId,
        deleted: false 
      },
      include: {
        _count: {
          select: { matches: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ seasons });
  });

  // Create season
  fastify.post('/teams/:teamId/seasons', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { teamId } = request.params as { teamId: string };
      const { name, startDate, endDate } = createSeasonSchema.parse(request.body);

      const team = await prisma.team.findFirst({
        where: { 
          id: teamId,
          ownerId: request.user!.id 
        }
      });

      if (!team) {
        return reply.status(404).send({ error: 'Team not found' });
      }

      const season = await prisma.season.create({
        data: {
          name,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          teamId
        }
      });

      return reply.status(201).send({ season });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Get matches for season
  fastify.get('/seasons/:seasonId/matches', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { seasonId } = request.params as { seasonId: string };

    const season = await prisma.season.findFirst({
      where: { id: seasonId },
      include: { team: true }
    });

    if (!season || season.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Season not found' });
    }

    const matches = await prisma.match.findMany({
      where: { seasonId },
      include: {
        formation: true,
        _count: {
          select: {
            goals: true,
            substitutions: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return reply.send({ matches });
  });

  // Create match
  fastify.post('/seasons/:seasonId/matches', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { seasonId } = request.params as { seasonId: string };
      const { date, opponent, homeAway, venue, formationId } = createMatchSchema.parse(request.body);

      const season = await prisma.season.findFirst({
        where: { id: seasonId },
        include: { team: true }
      });

      if (!season || season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Season not found' });
      }

      const match = await prisma.match.create({
        data: {
          date: new Date(date),
          opponent,
          homeAway,
          venue,
          formationId,
          seasonId
        },
        include: {
          formation: true
        }
      });

      return reply.status(201).send({ match });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Get match by ID
  fastify.get('/matches/:matchId', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findFirst({
      where: { id: matchId },
      include: {
        season: {
          include: { 
            team: {
              include: {
                players: true // Include all team players for availability checking
              }
            }
          }
        },
        formation: true,
        blocks: {
          include: {
            assignments: {
              include: {
                player: true
              }
            }
          },
          orderBy: { index: 'asc' }
        },
        substitutions: {
          include: {
            offPlayer: true,
            onPlayer: true
          },
          orderBy: { minute: 'asc' }
        },
        goals: {
          include: {
            player: true
          },
          orderBy: { minute: 'asc' }
        },
        plan: {
          include: {
            formation: true
          }
        },
        playerAvailability: {
          include: {
            player: true
          }
        }
      }
    });

    if (!match || match.season.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    // Create a map of player availability for easier frontend consumption
    const availabilityMap = match.playerAvailability.reduce((acc, availability) => {
      acc[availability.playerId] = availability.isAvailable;
      return acc;
    }, {} as Record<string, boolean>);

    // Add availability info to players
    const playersWithAvailability = match.season.team.players.map(player => ({
      ...player,
      isAvailableForMatch: availabilityMap[player.id] !== undefined ? availabilityMap[player.id] : true // Default to available
    }));

    return reply.send({ 
      match: {
        ...match,
        season: {
          ...match.season,
          team: {
            ...match.season.team,
            players: playersWithAvailability
          }
        }
      }
    });
  });

  // Start match
  fastify.post('/matches/:matchId/start', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findFirst({
      where: { id: matchId },
      include: {
        season: {
          include: { team: true }
        }
      }
    });

    if (!match || match.season.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (match.isLive) {
      return reply.status(400).send({ error: 'Match is already live' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        isLive: true,
        startedAt: new Date()
      }
    });

    // Emit socket event
    fastify.io.to(`match:${matchId}`).emit('match:started', { match: updatedMatch });

    return reply.send({ match: updatedMatch });
  });

  // Stop match
  fastify.post('/matches/:matchId/stop', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findFirst({
      where: { id: matchId },
      include: {
        season: {
          include: { team: true }
        }
      }
    });

    if (!match || match.season.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!match.isLive) {
      return reply.status(400).send({ error: 'Match is not live' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        isLive: false,
        stoppedAt: new Date()
      }
    });

    // Emit socket event
    fastify.io.to(`match:${matchId}`).emit('match:stopped', { match: updatedMatch });

    return reply.send({ match: updatedMatch });
  });

  // Make substitution
  fastify.post('/matches/:matchId/substitutions', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { minute, offPlayerId, onPlayerId, position } = makeSubstitutionSchema.parse(request.body);

      const match = await prisma.match.findFirst({
        where: { id: matchId },
        include: {
          season: {
            include: { team: true }
          }
        }
      });

      if (!match || match.season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      const substitution = await prisma.substitution.create({
        data: {
          matchId,
          minute,
          offPlayerId,
          onPlayerId,
          position
        },
        include: {
          offPlayer: true,
          onPlayer: true
        }
      });

      // Emit socket event
      fastify.io.to(`match:${matchId}`).emit('substitution:made', { substitution });

      return reply.status(201).send({ substitution });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Score goal
  fastify.post('/matches/:matchId/goals', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { playerId, minute, notes } = scoreGoalSchema.parse(request.body);

      const match = await prisma.match.findFirst({
        where: { id: matchId },
        include: {
          season: {
            include: { team: true }
          }
        }
      });

      if (!match || match.season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      const goal = await prisma.goal.create({
        data: {
          matchId,
          playerId,
          minute,
          notes
        },
        include: {
          player: true
        }
      });

      // Emit socket event
      fastify.io.to(`match:${matchId}`).emit('goal:scored', { goal });

      return reply.status(201).send({ goal });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Get/Create match plan
  fastify.get('/matches/:matchId/plan', { preHandler: [verifyAuth] }, async (request, reply) => {
    const { matchId } = request.params as { matchId: string };

    const match = await prisma.match.findFirst({
      where: { id: matchId },
      include: {
        season: {
          include: { team: true }
        },
        plan: {
          include: {
            formation: true
          }
        }
      }
    });

    if (!match || match.season.team.ownerId !== request.user!.id) {
      return reply.status(404).send({ error: 'Match not found' });
    }

    if (!match.plan) {
      const plan = await prisma.matchPlan.create({
        data: {
          matchId,
          formationId: match.formationId
        },
        include: {
          formation: true
        }
      });
      return reply.send({ plan });
    }

    return reply.send({ plan: match.plan });
  });

  // Update match plan
  fastify.put('/matches/:matchId/plan', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const updateData = updateMatchPlanSchema.parse(request.body);

      const match = await prisma.match.findFirst({
        where: { id: matchId },
        include: {
          season: {
            include: { team: true }
          }
        }
      });

      if (!match || match.season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      const plan = await prisma.matchPlan.upsert({
        where: { matchId },
        update: {
          ...updateData,
          objectivesJSON: JSON.stringify(updateData.objectivesJSON),
          opponentInfoJSON: JSON.stringify(updateData.opponentInfoJSON)
        },
        create: {
          matchId,
          ...updateData,
          objectivesJSON: JSON.stringify(updateData.objectivesJSON),
          opponentInfoJSON: JSON.stringify(updateData.opponentInfoJSON)
        },
        include: {
          formation: true
        }
      });

      return reply.send({ plan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Match plan validation error:', error.errors);
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Match plan update error:', error);
      throw error;
    }
  });

  // Get formations
  fastify.get('/formations', { preHandler: [verifyAuth] }, async (request, reply) => {
    const formations = await prisma.formation.findMany({
      where: {
        OR: [
          { isPreset: true },
          { 
            team: {
              ownerId: request.user!.id
            }
          }
        ]
      },
      orderBy: { name: 'asc' }
    });

    return reply.send({ formations });
  });

  // Create formation
  fastify.post('/formations', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { name, shapeJSON, isPreset } = createFormationSchema.parse(request.body);
      const { teamId } = request.query as { teamId?: string };

      if (teamId) {
        const team = await prisma.team.findFirst({
          where: { 
            id: teamId,
            ownerId: request.user!.id 
          }
        });

        if (!team) {
          return reply.status(404).send({ error: 'Team not found' });
        }
      }

      const formation = await prisma.formation.create({
        data: {
          name,
          shapeJSON: JSON.stringify(shapeJSON),
          isPreset,
          teamId: teamId || null
        }
      });

      return reply.status(201).send({ formation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Delete formation
  fastify.delete('/formations/:formationId', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { formationId } = request.params as { formationId: string };

      // Find formation and verify ownership
      const formation = await prisma.formation.findFirst({
        where: { 
          id: formationId,
          isPreset: false, // Only allow deletion of custom formations, not presets
          OR: [
            {
              team: {
                ownerId: request.user!.id
              }
            },
            {
              teamId: null, // User-created formations without a specific team
              // We need to ensure this formation was created by this user
              // Since we don't track the creator directly, we'll be restrictive here
            }
          ]
        },
        include: {
          team: true
        }
      });

      if (!formation) {
        return reply.status(404).send({ error: 'Formation not found or cannot be deleted' });
      }

      // Check if formation is being used by matches belonging to the current user
      const matchesCount = await prisma.match.count({
        where: {
          formationId: formationId,
          season: {
            team: {
              ownerId: request.user!.id
            }
          }
        }
      });

      // Check if formation is being used by match plans belonging to the current user
      const matchPlansCount = await prisma.matchPlan.count({
        where: {
          formationId: formationId,
          match: {
            season: {
              team: {
                ownerId: request.user!.id
              }
            }
          }
        }
      });

      console.log('Formation usage check:', {
        formationId,
        matchesCount,
        matchPlansCount,
        userId: request.user!.id
      });

      if (matchesCount > 0 || matchPlansCount > 0) {
        return reply.status(400).send({ 
          error: 'Cannot delete formation as it is being used in matches or match plans' 
        });
      }

      // Delete the formation
      await prisma.formation.delete({
        where: { id: formationId }
      });

      return reply.send({ message: 'Formation deleted successfully' });
    } catch (error) {
      console.error('Error deleting formation:', error);
      throw error;
    }
  });

  // Save player assignments
  fastify.put('/matches/:matchId/player-assignments', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { assignments } = savePlayerAssignmentsSchema.parse(request.body);

      // Verify match ownership
      const match = await prisma.match.findFirst({
        where: { id: matchId },
        include: {
          season: {
            include: { team: true }
          }
        }
      });

      if (!match || match.season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      // Verify all players belong to the team
      if (assignments.length > 0) {
        const playerIds = assignments.map(a => a.playerId);
        const playersCount = await prisma.player.count({
          where: {
            id: { in: playerIds },
            teamId: match.season.team.id
          }
        });

        if (playersCount !== playerIds.length) {
          return reply.status(400).send({ error: 'Some players do not belong to this team' });
        }
      }
      
      // Clear existing assignments and create new ones
      await prisma.$transaction(async (tx) => {
        // Delete existing assignments for this match
        await tx.assignment.deleteMany({
          where: {
            block: {
              matchId: matchId
            }
          }
        });

        if (assignments.length === 0) {
          return; // No assignments to create
        }

        // Create a default block if none exists
        let block = await tx.block.findFirst({
          where: { matchId }
        });

        if (!block) {
          block = await tx.block.create({
            data: {
              matchId,
              index: 0,
              startMin: 0,   // Start at minute 0
              endMin: 45     // End at minute 45 (first half)
            }
          });
        }

        // Create assignments with specific positions and bench status
        for (const assignment of assignments) {
          await tx.assignment.create({
            data: {
              blockId: block.id,
              playerId: assignment.playerId,
              position: assignment.position,
              isBench: assignment.isBench
            }
          });
        }
      });

      return reply.send({ 
        message: 'Player assignments saved successfully',
        assignmentsCount: assignments.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Player assignments validation error:', error.errors);
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      console.error('Player assignments save error:', error);
      throw error;
    }
  });

  // Update match details
  fastify.put('/matches/:matchId', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const updateData = updateMatchSchema.parse(request.body);

      // Verify match ownership
      const match = await prisma.match.findFirst({
        where: { id: matchId },
        include: {
          season: {
            include: { team: true }
          }
        }
      });

      if (!match || match.season.team.ownerId !== request.user!.id) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      // Don't allow editing if match is live
      if (match.isLive) {
        return reply.status(400).send({ error: 'Cannot edit match details while match is live' });
      }

      // Update match with only provided fields
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          ...updateData,
          // Convert date string to DateTime if provided
          ...(updateData.date && { date: new Date(updateData.date) })
        },
        include: {
          season: {
            include: { team: true }
          },
          formation: true,
          blocks: {
            include: {
              assignments: { include: { player: true } }
            },
            orderBy: { index: 'asc' }
          },
          plan: { include: { formation: true } }
        }
      });

      return reply.send({ match: updatedMatch });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Update player availability for match
  fastify.put('/matches/:matchId/player-availability', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { playerId, isAvailable } = updatePlayerAvailabilitySchema.parse(request.body);

      // Verify match ownership
      const match = await prisma.match.findFirst({
        where: { 
          id: matchId,
          season: { team: { ownerId: request.user!.id } }
        },
        include: {
          season: { include: { team: true } }
        }
      });

      if (!match) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      // Verify player belongs to team
      const player = await prisma.player.findFirst({
        where: {
          id: playerId,
          teamId: match.season.team.id
        }
      });

      if (!player) {
        return reply.status(404).send({ error: 'Player not found in team' });
      }

      // Upsert player availability
      const availability = await prisma.matchPlayerAvailability.upsert({
        where: {
          matchId_playerId: {
            matchId,
            playerId
          }
        },
        update: {
          isAvailable
        },
        create: {
          matchId,
          playerId,
          isAvailable
        },
        include: {
          player: true
        }
      });

      return reply.send({ availability });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });

  // Save match blocks with assignments
  fastify.post('/matches/:matchId/blocks', { preHandler: [verifyAuth] }, async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const data = saveBlocksSchema.parse(request.body);

      // Verify match ownership
      const match = await prisma.match.findFirst({
        where: { 
          id: matchId,
          season: { team: { ownerId: request.user!.id } }
        }
      });

      if (!match) {
        return reply.status(404).send({ error: 'Match not found' });
      }

      // Delete existing blocks and assignments for this match
      await prisma.block.deleteMany({
        where: { matchId }
      });

      // Create new blocks with assignments
      const createdBlocks = await Promise.all(
        data.blocks.map(async (blockData) => {
          const block = await prisma.block.create({
            data: {
              matchId,
              index: blockData.index,
              startMin: blockData.startMin,
              endMin: blockData.endMin,
              assignments: {
                create: blockData.assignments.map(assignment => ({
                  playerId: assignment.playerId,
                  position: assignment.position,
                  isBench: assignment.isBench
                }))
              }
            },
            include: {
              assignments: {
                include: {
                  player: true
                }
              }
            }
          });
          return block;
        })
      );

      return reply.send({ 
        message: 'Blocks saved successfully', 
        blocks: createdBlocks 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }
      throw error;
    }
  });
}