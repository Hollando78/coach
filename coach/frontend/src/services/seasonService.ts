import { apiClient } from './apiClient';
import { Season, Match, Formation } from '../types';

interface SeasonsResponse {
  seasons: Season[];
}

interface SeasonResponse {
  season: Season;
}

interface MatchesResponse {
  matches: Match[];
}

interface MatchResponse {
  match: Match;
}

interface FormationsResponse {
  formations: Formation[];
}

interface FormationResponse {
  formation: Formation;
}

class SeasonService {
  async getSeasons(teamId: string): Promise<SeasonsResponse> {
    return apiClient.get<SeasonsResponse>(`/teams/${teamId}/seasons`);
  }

  async createSeason(
    teamId: string, 
    seasonData: { name: string; startDate?: string; endDate?: string }
  ): Promise<SeasonResponse> {
    return apiClient.post<SeasonResponse>(`/teams/${teamId}/seasons`, seasonData);
  }

  async getMatches(seasonId: string): Promise<MatchesResponse> {
    return apiClient.get<MatchesResponse>(`/seasons/${seasonId}/matches`);
  }

  async createMatch(
    seasonId: string,
    matchData: {
      date: string;
      opponent: string;
      homeAway: 'home' | 'away';
      venue?: string;
      formationId?: string;
    }
  ): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/seasons/${seasonId}/matches`, matchData);
  }

  async getMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.get<MatchResponse>(`/matches/${matchId}`);
  }

  async updateMatch(
    matchId: string,
    matchData: {
      date?: string;
      opponent?: string;
      homeAway?: 'home' | 'away';
      venue?: string;
    }
  ): Promise<MatchResponse> {
    return apiClient.put<MatchResponse>(`/matches/${matchId}`, matchData);
  }

  async startMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/matches/${matchId}/start`, {});
  }

  async stopMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/matches/${matchId}/stop`, {});
  }

  async makeSubstitution(
    matchId: string,
    substitutionData: {
      minute: number;
      offPlayerId: string;
      onPlayerId: string;
      position: string;
    }
  ): Promise<{ substitution: any }> {
    return apiClient.post(`/matches/${matchId}/substitutions`, substitutionData);
  }

  async scoreGoal(
    matchId: string,
    goalData: {
      playerId: string;
      minute: number;
      notes: string;
    }
  ): Promise<{ goal: any }> {
    return apiClient.post(`/matches/${matchId}/goals`, goalData);
  }

  async getFormations(): Promise<FormationsResponse> {
    return apiClient.get<FormationsResponse>('/formations');
  }

  async createFormation(
    formationData: {
      name: string;
      shapeJSON: Record<string, any>;
      isPreset?: boolean;
    },
    teamId?: string
  ): Promise<FormationResponse> {
    const url = teamId ? `/formations?teamId=${teamId}` : '/formations';
    return apiClient.post<FormationResponse>(url, formationData);
  }

  async deleteFormation(formationId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/formations/${formationId}`);
  }

  async updateMatchPlan(
    matchId: string,
    planData: {
      formationId?: string;
      notes?: string;
      objectivesJSON?: string[];
      opponentInfoJSON?: Record<string, any>;
    }
  ): Promise<any> {
    return apiClient.put(`/matches/${matchId}/plan`, planData);
  }

  async savePlayerAssignments(
    matchId: string,
    assignments: Array<{
      playerId: string;
      position: string;
      isBench: boolean;
    }>
  ): Promise<any> {
    return apiClient.put(`/matches/${matchId}/player-assignments`, { assignments });
  }

  async saveBlocks(
    matchId: string,
    blocks: Array<{
      index: number;
      startMin: number;
      endMin: number;
      assignments: Array<{
        playerId: string;
        position: string;
        isBench: boolean;
      }>;
    }>
  ): Promise<any> {
    return apiClient.post(`/matches/${matchId}/blocks`, { blocks });
  }

  async updatePlayerAvailability(
    matchId: string,
    playerId: string,
    isAvailable: boolean
  ): Promise<any> {
    console.log('seasonService.updatePlayerAvailability called:', { matchId, playerId, isAvailable });
    const response = await apiClient.put(`/matches/${matchId}/player-availability`, {
      playerId,
      isAvailable
    });
    console.log('seasonService.updatePlayerAvailability response:', response);
    return response;
  }
}

export const seasonService = new SeasonService();