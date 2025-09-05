import { apiClient } from './apiClient';
import { Team, Player } from '../types';

// Utility function to transform player data from API response
const transformPlayer = (player: any): Player => ({
  ...player,
  preferredPositions: typeof player.preferredPositions === 'string' 
    ? JSON.parse(player.preferredPositions) 
    : player.preferredPositions
});

// Utility function to transform team data with players
const transformTeam = (team: any): Team => ({
  ...team,
  players: team.players ? team.players.map(transformPlayer) : undefined
});

interface TeamsResponse {
  teams: Team[];
}

interface TeamResponse {
  team: Team;
}

interface PlayersResponse {
  players: Player[];
}

interface PlayerResponse {
  player: Player;
}

class TeamService {
  async getTeams(): Promise<TeamsResponse> {
    return apiClient.get<TeamsResponse>('/teams');
  }

  async createTeam(name: string): Promise<TeamResponse> {
    return apiClient.post<TeamResponse>('/teams', { name });
  }

  async getTeam(teamId: string): Promise<TeamResponse> {
    const response = await apiClient.get<TeamResponse>(`/teams/${teamId}`);
    return {
      team: transformTeam(response.team)
    };
  }

  async updateTeam(teamId: string, data: { name: string }): Promise<TeamResponse> {
    return apiClient.put<TeamResponse>(`/teams/${teamId}`, data);
  }

  async deleteTeam(teamId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/teams/${teamId}`);
  }

  async getPlayers(teamId: string): Promise<PlayersResponse> {
    const response = await apiClient.get<PlayersResponse>(`/teams/${teamId}/players`);
    return {
      players: response.players.map(transformPlayer)
    };
  }

  async createPlayer(
    teamId: string,
    player: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>
  ): Promise<PlayerResponse> {
    const response = await apiClient.post<PlayerResponse>(`/teams/${teamId}/players`, player);
    return {
      player: transformPlayer(response.player)
    };
  }

  async updatePlayer(
    playerId: string,
    player: Partial<Player>
  ): Promise<PlayerResponse> {
    const response = await apiClient.put<PlayerResponse>(`/teams/players/${playerId}`, player);
    return {
      player: transformPlayer(response.player)
    };
  }

  async deletePlayer(playerId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/teams/players/${playerId}`);
  }
}

export const teamService = new TeamService();