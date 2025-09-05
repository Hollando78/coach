import { create } from 'zustand';
import { Season, Match } from '../types';
import { seasonService } from '../services/seasonService';

interface SeasonState {
  seasons: Season[];
  currentSeason: Season | null;
  matches: Match[];
  currentMatch: Match | null;
  isLoading: boolean;
  error: string | null;
  
  // Season actions
  fetchSeasons: (teamId: string) => Promise<void>;
  createSeason: (teamId: string, seasonData: { name: string; startDate?: string; endDate?: string }) => Promise<Season>;
  selectSeason: (season: Season) => void;
  
  // Match actions
  fetchMatches: (seasonId: string) => Promise<void>;
  createMatch: (seasonId: string, matchData: {
    date: string;
    opponent: string;
    homeAway: 'home' | 'away';
    venue?: string;
    formationId?: string;
  }) => Promise<Match>;
  getMatch: (matchId: string) => Promise<void>;
  updateMatch: (matchId: string, matchData: { date?: string; opponent?: string; homeAway?: 'home' | 'away'; venue?: string }) => Promise<void>;
  selectMatch: (matchId: string) => Promise<void>;
  startMatch: (matchId: string) => Promise<void>;
  stopMatch: (matchId: string) => Promise<void>;
  scoreGoal: (matchId: string, goalData: { playerId: string; minute: number; notes: string }) => Promise<void>;
  makeSubstitution: (matchId: string, subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => Promise<void>;
  
  // Formation actions
  getFormations: () => Promise<any>;
  createFormation: (formationData: { name: string; shapeJSON: any }, teamId?: string) => Promise<void>;
  deleteFormation: (formationId: string) => Promise<void>;
  
  // Match Plan actions
  updateMatchPlan: (matchId: string, planData: {
    formationId?: string;
    notes?: string;
    objectivesJSON?: string[];
    opponentInfoJSON?: Record<string, any>;
  }) => Promise<void>;
  
  // Player assignment actions
  savePlayerAssignments: (matchId: string, assignments: Array<{
    playerId: string;
    position: string;
    isBench: boolean;
  }>) => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearSeason: () => void;
  clearMatch: () => void;
}

export const useSeasonStore = create<SeasonState>((set, get) => ({
  seasons: [],
  currentSeason: null,
  matches: [],
  currentMatch: null,
  isLoading: false,
  error: null,

  fetchSeasons: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.getSeasons(teamId);
      set({ seasons: response.seasons, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch seasons',
        isLoading: false 
      });
    }
  },

  createSeason: async (teamId: string, seasonData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.createSeason(teamId, seasonData);
      set(state => ({ 
        seasons: [response.season, ...state.seasons],
        isLoading: false 
      }));
      return response.season;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create season',
        isLoading: false 
      });
      throw error;
    }
  },

  selectSeason: (season: Season) => {
    set({ currentSeason: season });
  },

  fetchMatches: async (seasonId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.getMatches(seasonId);
      set({ matches: response.matches, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch matches',
        isLoading: false 
      });
    }
  },

  createMatch: async (seasonId: string, matchData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.createMatch(seasonId, matchData);
      set(state => ({ 
        matches: [response.match, ...state.matches],
        isLoading: false 
      }));
      return response.match;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create match',
        isLoading: false 
      });
      throw error;
    }
  },

  selectMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.getMatch(matchId);
      set({ 
        currentMatch: response.match,
        isLoading: false 
      });
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
      const response = await seasonService.startMatch(matchId);
      set(state => ({
        currentMatch: state.currentMatch?.id === matchId ? response.match : state.currentMatch,
        matches: state.matches.map(match => 
          match.id === matchId ? response.match : match
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to start match',
        isLoading: false 
      });
      throw error;
    }
  },

  stopMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.stopMatch(matchId);
      set(state => ({
        currentMatch: state.currentMatch?.id === matchId ? response.match : state.currentMatch,
        matches: state.matches.map(match => 
          match.id === matchId ? response.match : match
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop match',
        isLoading: false 
      });
      throw error;
    }
  },

  getMatch: async (matchId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.getMatch(matchId);
      set({ 
        currentMatch: response.match,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load match',
        isLoading: false 
      });
    }
  },

  updateMatch: async (matchId: string, matchData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.updateMatch(matchId, matchData);
      set(state => ({
        currentMatch: response.match,
        matches: state.matches.map(match => 
          match.id === matchId ? response.match : match
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update match',
        isLoading: false 
      });
      throw error;
    }
  },

  scoreGoal: async (matchId: string, goalData) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.scoreGoal(matchId, goalData);
      set({ isLoading: false });
      // Refresh current match data
      get().getMatch(matchId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to record goal',
        isLoading: false 
      });
      throw error;
    }
  },

  makeSubstitution: async (matchId: string, subData) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.makeSubstitution(matchId, subData);
      set({ isLoading: false });
      // Refresh current match data
      get().getMatch(matchId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to make substitution',
        isLoading: false 
      });
      throw error;
    }
  },

  getFormations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await seasonService.getFormations();
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load formations',
        isLoading: false 
      });
      throw error;
    }
  },

  createFormation: async (formationData, teamId) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.createFormation(formationData, teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create formation',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteFormation: async (formationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.deleteFormation(formationId);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      // Don't set error in global state - let the caller handle it
      throw error;
    }
  },

  updateMatchPlan: async (matchId: string, planData) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.updateMatchPlan(matchId, planData);
      set({ isLoading: false });
      // Refresh current match data
      get().getMatch(matchId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save match plan',
        isLoading: false 
      });
      throw error;
    }
  },

  savePlayerAssignments: async (matchId: string, assignments: Array<{
    playerId: string;
    position: string;
    isBench: boolean;
  }>) => {
    set({ isLoading: true, error: null });
    try {
      await seasonService.savePlayerAssignments(matchId, assignments);
      set({ isLoading: false });
      // Refresh current match data
      get().getMatch(matchId);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save player assignments',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearSeason: () => set({ 
    currentSeason: null, 
    matches: [],
    currentMatch: null
  }),

  clearMatch: () => set({ 
    currentMatch: null
  })
}));