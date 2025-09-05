import { create } from 'zustand';
import { Match, Assignment, Substitution, Goal, Season, MatchPlan } from '../types';
import { matchService } from '../services/matchService';
import { socketService } from '../services/socketService';

interface MatchState {
  currentMatch: Match | null;
  matches: Match[];
  seasons: Season[];
  assignments: Assignment[];
  substitutions: Substitution[];
  goals: Goal[];
  matchPlan: MatchPlan | null;
  isLive: boolean;
  currentMinute: number;
  isLoading: boolean;
  error: string | null;
  
  // Season actions
  fetchSeasons: (teamId: string) => Promise<void>;
  createSeason: (teamId: string, name: string, startDate?: string, endDate?: string) => Promise<void>;
  
  // Match actions
  fetchMatches: (seasonId: string) => Promise<void>;
  createMatch: (seasonId: string, matchData: any) => Promise<void>;
  loadMatch: (matchId: string) => Promise<void>;
  startMatch: (matchId: string) => Promise<void>;
  stopMatch: (matchId: string) => Promise<void>;
  updateMatch: (matchId: string, data: Partial<Match>) => Promise<void>;
  
  // Match plan actions
  fetchMatchPlan: (matchId: string) => Promise<void>;
  updateMatchPlan: (matchId: string, plan: Partial<MatchPlan>) => Promise<void>;
  
  // Assignment actions
  updateAssignments: (matchId: string, assignments: Assignment[]) => Promise<void>;
  
  // Live match actions
  makeSubstitution: (matchId: string, substitution: Omit<Substitution, 'id' | 'matchId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  scoreGoal: (matchId: string, goal: Omit<Goal, 'id' | 'matchId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // Real-time updates
  updateCurrentMinute: (minute: number) => void;
  addSubstitution: (substitution: Substitution) => void;
  addGoal: (goal: Goal) => void;
  
  // Socket management
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  
  // Utility
  clearError: () => void;
  clearMatch: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  matches: [],
  seasons: [],
  assignments: [],
  substitutions: [],
  goals: [],
  matchPlan: null,
  isLive: false,
  currentMinute: 0,
  isLoading: false,
  error: null,

  fetchSeasons: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.getSeasons(teamId);
      set({ seasons: response.seasons, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch seasons',
        isLoading: false 
      });
    }
  },

  createSeason: async (teamId: string, name: string, startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.createSeason(teamId, { name, startDate, endDate });
      set(state => ({ 
        seasons: [response.season, ...state.seasons],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create season',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchMatches: async (seasonId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.getMatches(seasonId);
      set({ matches: response.matches, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch matches',
        isLoading: false 
      });
    }
  },

  createMatch: async (seasonId: string, matchData: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.createMatch(seasonId, matchData);
      set(state => ({ 
        matches: [response.match, ...state.matches],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create match',
        isLoading: false 
      });
      throw error;
    }
  },

  loadMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.getMatch(matchId);
      const match = response.match;
      set({ 
        currentMatch: match,
        assignments: match.blocks?.flatMap(block => block.assignments) || [],
        substitutions: match.substitutions || [],
        goals: match.goals || [],
        matchPlan: match.plan || null,
        isLive: match.isLive,
        currentMinute: match.currentMinute,
        isLoading: false 
      });
      
      // Join socket room for real-time updates
      get().joinMatch(matchId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load match',
        isLoading: false 
      });
    }
  },

  startMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.startMatch(matchId);
      set({ 
        currentMatch: response.match,
        isLive: true,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start match',
        isLoading: false 
      });
    }
  },

  stopMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.stopMatch(matchId);
      set({ 
        currentMatch: response.match,
        isLive: false,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop match',
        isLoading: false 
      });
    }
  },

  updateMatch: async (matchId: string, data: Partial<Match>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.updateMatch(matchId, data);
      set({ 
        currentMatch: response.match,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update match',
        isLoading: false 
      });
    }
  },

  fetchMatchPlan: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.getMatchPlan(matchId);
      set({ matchPlan: response.plan, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch match plan',
        isLoading: false 
      });
    }
  },

  updateMatchPlan: async (matchId: string, plan: Partial<MatchPlan>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.updateMatchPlan(matchId, plan);
      set({ matchPlan: response.plan, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update match plan',
        isLoading: false 
      });
    }
  },

  updateAssignments: async (matchId: string, assignments: Assignment[]) => {
    set({ isLoading: true, error: null });
    try {
      await matchService.updateAssignments(matchId, assignments);
      set({ assignments, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update assignments',
        isLoading: false 
      });
    }
  },

  makeSubstitution: async (matchId: string, substitutionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.makeSubstitution(matchId, substitutionData);
      set(state => ({
        substitutions: [...state.substitutions, response.substitution],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to make substitution',
        isLoading: false 
      });
      throw error;
    }
  },

  scoreGoal: async (matchId: string, goalData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await matchService.scoreGoal(matchId, goalData);
      set(state => ({
        goals: [...state.goals, response.goal],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to score goal',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCurrentMinute: (minute: number) => {
    set({ currentMinute: minute });
  },

  addSubstitution: (substitution: Substitution) => {
    set(state => ({
      substitutions: [...state.substitutions, substitution]
    }));
  },

  addGoal: (goal: Goal) => {
    set(state => ({
      goals: [...state.goals, goal]
    }));
  },

  joinMatch: (matchId: string) => {
    socketService.joinMatch(matchId);
  },

  leaveMatch: (matchId: string) => {
    socketService.leaveMatch(matchId);
  },

  clearError: () => set({ error: null }),
  
  clearMatch: () => set({ 
    currentMatch: null,
    assignments: [],
    substitutions: [],
    goals: [],
    matchPlan: null,
    isLive: false,
    currentMinute: 0
  })
}));