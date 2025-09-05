export interface User {
  id: string;
  email: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    players: number;
  };
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  shirtNo?: number;
  skillRating: number;
  preferredPositions: string[];
  isAvailable: boolean; // Global availability (kept for backward compatibility)
  isAvailableForMatch?: boolean; // Match-specific availability
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  teamId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    matches: number;
  };
}

export interface Match {
  id: string;
  seasonId: string;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  venue?: string;
  formationId?: string;
  currentMinute: number;
  isLive: boolean;
  startedAt?: string;
  stoppedAt?: string;
  createdAt: string;
  updatedAt: string;
  formation?: Formation;
  blocks?: Block[];
  substitutions?: Substitution[];
  goals?: Goal[];
  plan?: MatchPlan;
  _count?: {
    goals: number;
    substitutions: number;
  };
}

export interface Formation {
  id: string;
  name: string;
  shapeJSON: Record<string, any>;
  isPreset: boolean;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchPlan {
  id: string;
  matchId: string;
  formationId?: string;
  notes: string;
  objectivesJSON: string[];
  opponentInfoJSON: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  formation?: Formation;
}

export interface Block {
  id: string;
  matchId: string;
  index: number;
  startMin: number;
  endMin: number;
  createdAt: string;
  updatedAt: string;
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  blockId: string;
  playerId: string;
  position: string;
  isBench: boolean;
  createdAt: string;
  updatedAt: string;
  player: Player;
}

export type PlanningInterval = 'quarters' | 'thirds';

export interface PlannedSubstitution {
  fromBlock: number;
  toBlock: number;
  playerOut: Player;
  playerIn: Player;
  position: string;
  minute: number;
}

export interface TimeBlockConfig {
  interval: PlanningInterval;
  blocks: Array<{
    index: number;
    startMin: number;
    endMin: number;
    label: string;
  }>;
}

export interface Substitution {
  id: string;
  matchId: string;
  minute: number;
  offPlayerId: string;
  onPlayerId: string;
  position: string;
  createdAt: string;
  updatedAt: string;
  offPlayer: Player;
  onPlayer: Player;
}

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  minute: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  player: Player;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Position {
  x: number;
  y: number;
  role: string;
}

export interface FormationShape {
  positions: Position[];
  name: string;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'substitution' | 'card' | 'note';
  minute: number;
  playerId?: string;
  description: string;
  createdAt: string;
}

export interface OfflineEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  synced: boolean;
}