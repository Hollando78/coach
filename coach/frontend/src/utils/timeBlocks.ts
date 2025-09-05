import { Assignment, Player, PlanningInterval, PlannedSubstitution, TimeBlockConfig } from '../types';

export const createTimeBlockConfig = (interval: PlanningInterval): TimeBlockConfig => {
  switch (interval) {
    case 'quarters':
      return {
        interval: 'quarters',
        blocks: [
          { index: 0, startMin: 0, endMin: 15, label: '1st Quarter (0-15 min)' },
          { index: 1, startMin: 15, endMin: 30, label: '2nd Quarter (15-30 min)' },
          { index: 2, startMin: 30, endMin: 45, label: '3rd Quarter (30-45 min)' },
          { index: 3, startMin: 45, endMin: 60, label: '4th Quarter (45-60 min)' }
        ]
      };
    case 'thirds':
      return {
        interval: 'thirds',
        blocks: [
          { index: 0, startMin: 0, endMin: 20, label: '1st Third (0-20 min)' },
          { index: 1, startMin: 20, endMin: 40, label: '2nd Third (20-40 min)' },
          { index: 2, startMin: 40, endMin: 60, label: '3rd Third (40-60 min)' }
        ]
      };
    default:
      return createTimeBlockConfig('quarters');
  }
};

export const detectSubstitutions = (
  fromAssignments: Assignment[],
  toAssignments: Assignment[],
  fromBlockIndex: number,
  toBlockIndex: number,
  allPlayers: Player[]
): PlannedSubstitution[] => {
  const substitutions: PlannedSubstitution[] = [];
  
  // Create maps for easy lookup
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));
  
  // Separate field players and bench players
  const fromFieldPlayers = fromAssignments.filter(a => !a.isBench);
  const toFieldPlayers = toAssignments.filter(a => !a.isBench);
  const fromBenchPlayers = fromAssignments.filter(a => a.isBench);
  const toBenchPlayers = toAssignments.filter(a => a.isBench);
  
  // Create player ID sets for field players
  const fromFieldPlayerIds = new Set(fromFieldPlayers.map(a => a.playerId));
  const toFieldPlayerIds = new Set(toFieldPlayers.map(a => a.playerId));
  
  // Find actual substitutions (field player changes)
  const playersOut = fromFieldPlayers.filter(a => !toFieldPlayerIds.has(a.playerId));
  const playersIn = toFieldPlayers.filter(a => !fromFieldPlayerIds.has(a.playerId));
  
  // Match substitutions (pair players going out with players coming in)
  const config = createTimeBlockConfig('quarters'); // Default for minute calculation
  const minute = toBlockIndex < config.blocks.length ? config.blocks[toBlockIndex].startMin : 0;
  
  for (let i = 0; i < Math.min(playersOut.length, playersIn.length); i++) {
    const playerOutAssignment = playersOut[i];
    const playerInAssignment = playersIn[i];
    const playerOut = playerMap.get(playerOutAssignment.playerId);
    const playerIn = playerMap.get(playerInAssignment.playerId);
    
    if (playerOut && playerIn) {
      substitutions.push({
        fromBlock: fromBlockIndex,
        toBlock: toBlockIndex,
        playerOut,
        playerIn,
        position: playerInAssignment.position, // Position they're coming into
        minute
      });
    }
  }
  
  return substitutions;
};

export const detectTacticalMoves = (
  fromAssignments: Assignment[],
  toAssignments: Assignment[],
  fromBlockIndex: number,
  toBlockIndex: number,
  allPlayers: Player[]
): PlannedSubstitution[] => {
  const tacticalMoves: PlannedSubstitution[] = [];
  
  // Only look at field players (not bench)
  const fromFieldPlayers = fromAssignments.filter(a => !a.isBench);
  const toFieldPlayers = toAssignments.filter(a => !a.isBench);
  
  // Create maps for position lookup
  const fromPlayerPositions = new Map(fromFieldPlayers.map(a => [a.playerId, a.position]));
  const toPlayerPositions = new Map(toFieldPlayers.map(a => [a.playerId, a.position]));
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));
  
  // Find players who changed positions but stayed on field
  const playersWhoMoved = toFieldPlayers.filter(toAssignment => {
    const fromPosition = fromPlayerPositions.get(toAssignment.playerId);
    return fromPosition && fromPosition !== toAssignment.position;
  });
  
  const config = createTimeBlockConfig('quarters'); // Default for minute calculation
  const minute = toBlockIndex < config.blocks.length ? config.blocks[toBlockIndex].startMin : 0;
  
  for (const movedPlayer of playersWhoMoved) {
    const player = playerMap.get(movedPlayer.playerId);
    const fromPosition = fromPlayerPositions.get(movedPlayer.playerId);
    
    if (player && fromPosition) {
      tacticalMoves.push({
        fromBlock: fromBlockIndex,
        toBlock: toBlockIndex,
        playerOut: player, // Same player
        playerIn: player,  // Same player
        position: `${fromPosition} → ${movedPlayer.position}`, // Show the positional change
        minute
      });
    }
  }
  
  return tacticalMoves;
};

export const analyzeAllSubstitutions = (
  blocks: { index: number; assignments: Assignment[] }[],
  allPlayers: Player[]
): PlannedSubstitution[] => {
  const allChanges: PlannedSubstitution[] = [];
  
  for (let i = 0; i < blocks.length - 1; i++) {
    const currentBlock = blocks[i];
    const nextBlock = blocks[i + 1];
    
    if (currentBlock && nextBlock) {
      // Get actual substitutions (player changes)
      const substitutions = detectSubstitutions(
        currentBlock.assignments,
        nextBlock.assignments,
        currentBlock.index,
        nextBlock.index,
        allPlayers
      );
      
      // Get tactical moves (position changes)
      const tacticalMoves = detectTacticalMoves(
        currentBlock.assignments,
        nextBlock.assignments,
        currentBlock.index,
        nextBlock.index,
        allPlayers
      );
      
      allChanges.push(...substitutions, ...tacticalMoves);
    }
  }
  
  return allChanges;
};

export const formatTimeRange = (startMin: number, endMin: number): string => {
  return `${startMin}-${endMin} min`;
};

export const getBlockLabel = (index: number, interval: PlanningInterval): string => {
  const config = createTimeBlockConfig(interval);
  const block = config.blocks.find(b => b.index === index);
  return block?.label || `Block ${index + 1}`;
};