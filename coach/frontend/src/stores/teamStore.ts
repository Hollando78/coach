import { create } from 'zustand';
import { Team, Player } from '../types';
import { teamService } from '../services/teamService';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  players: Player[];
  isLoading: boolean;
  error: string | null;
  
  // Team actions
  fetchTeams: () => Promise<void>;
  createTeam: (name: string) => Promise<Team>;
  updateTeam: (teamId: string, name: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  selectTeam: (teamId: string) => Promise<void>;
  
  // Player actions
  fetchPlayers: (teamId: string) => Promise<void>;
  createPlayer: (teamId: string, player: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>) => Promise<Player>;
  updatePlayer: (playerId: string, player: Partial<Player>) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  clearTeam: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  players: [],
  isLoading: false,
  error: null,

  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.getTeams();
      set({ teams: response.teams, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch teams',
        isLoading: false 
      });
    }
  },

  createTeam: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.createTeam(name);
      set(state => ({ 
        teams: [response.team, ...state.teams],
        isLoading: false 
      }));
      return response.team;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create team',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTeam: async (teamId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.updateTeam(teamId, { name });
      set(state => ({
        teams: state.teams.map(team => 
          team.id === teamId ? response.team : team
        ),
        currentTeam: state.currentTeam?.id === teamId ? response.team : state.currentTeam,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update team',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.deleteTeam(teamId);
      set(state => ({
        teams: state.teams.filter(team => team.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
        players: state.currentTeam?.id === teamId ? [] : state.players,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete team',
        isLoading: false 
      });
      throw error;
    }
  },

  selectTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.getTeam(teamId);
      set({ 
        currentTeam: response.team,
        players: response.team.players || [],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load team',
        isLoading: false 
      });
    }
  },

  fetchPlayers: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.getPlayers(teamId);
      set({ players: response.players, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch players',
        isLoading: false 
      });
    }
  },

  createPlayer: async (teamId: string, playerData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.createPlayer(teamId, playerData);
      set(state => ({ 
        players: [...state.players, response.player],
        isLoading: false 
      }));
      return response.player;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create player',
        isLoading: false 
      });
      throw error;
    }
  },

  updatePlayer: async (playerId: string, playerData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await teamService.updatePlayer(playerId, playerData);
      set(state => ({
        players: state.players.map(player => 
          player.id === playerId ? response.player : player
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update player',
        isLoading: false 
      });
      throw error;
    }
  },

  deletePlayer: async (playerId: string) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.deletePlayer(playerId);
      set(state => ({
        players: state.players.filter(player => player.id !== playerId),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete player',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearTeam: () => set({ 
    currentTeam: null, 
    players: [] 
  })
}));