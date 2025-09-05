import { apiClient } from './apiClient';
import { Match, Season, MatchPlan, Assignment, Substitution, Goal, Formation } from '../types';

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

interface MatchPlanResponse {
  plan: MatchPlan;
}

interface SubstitutionResponse {
  substitution: Substitution;
}

interface GoalResponse {
  goal: Goal;
}

interface FormationsResponse {
  formations: Formation[];
}

interface FormationResponse {
  formation: Formation;
}

class MatchService {
  // Seasons
  async getSeasons(teamId: string): Promise<SeasonsResponse> {
    return apiClient.get<SeasonsResponse>(`/teams/${teamId}/seasons`);
  }

  async createSeason(
    teamId: string,
    data: { name: string; startDate?: string; endDate?: string }
  ): Promise<SeasonResponse> {
    return apiClient.post<SeasonResponse>(`/teams/${teamId}/seasons`, data);
  }

  // Matches
  async getMatches(seasonId: string): Promise<MatchesResponse> {
    return apiClient.get<MatchesResponse>(`/seasons/${seasonId}/matches`);
  }

  async createMatch(seasonId: string, data: any): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/seasons/${seasonId}/matches`, data);
  }

  async getMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.get<MatchResponse>(`/matches/${matchId}`);
  }

  async updateMatch(matchId: string, data: Partial<Match>): Promise<MatchResponse> {
    return apiClient.put<MatchResponse>(`/matches/${matchId}`, data);
  }

  async startMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/matches/${matchId}/start`);
  }

  async stopMatch(matchId: string): Promise<MatchResponse> {
    return apiClient.post<MatchResponse>(`/matches/${matchId}/stop`);
  }

  // Match planning
  async getMatchPlan(matchId: string): Promise<MatchPlanResponse> {
    return apiClient.get<MatchPlanResponse>(`/matches/${matchId}/plan`);
  }

  async updateMatchPlan(
    matchId: string,
    data: Partial<MatchPlan>
  ): Promise<MatchPlanResponse> {
    return apiClient.put<MatchPlanResponse>(`/matches/${matchId}/plan`, data);
  }

  // Assignments
  async updateAssignments(
    matchId: string,
    assignments: Assignment[]
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/matches/${matchId}/assignments`, {
      assignments
    });
  }

  // Live match events
  async makeSubstitution(
    matchId: string,
    data: { minute: number; offPlayerId: string; onPlayerId: string; position: string }
  ): Promise<SubstitutionResponse> {
    return apiClient.post<SubstitutionResponse>(`/matches/${matchId}/substitutions`, data);
  }

  async scoreGoal(
    matchId: string,
    data: { playerId: string; minute: number; notes?: string }
  ): Promise<GoalResponse> {
    return apiClient.post<GoalResponse>(`/matches/${matchId}/goals`, data);
  }

  // Formations
  async getFormations(teamId?: string): Promise<FormationsResponse> {
    const url = teamId ? `/formations?teamId=${teamId}` : '/formations';
    return apiClient.get<FormationsResponse>(url);
  }

  async createFormation(
    data: { name: string; shapeJSON: Record<string, any>; isPreset?: boolean },
    teamId?: string
  ): Promise<FormationResponse> {
    const url = teamId ? `/formations?teamId=${teamId}` : '/formations';
    return apiClient.post<FormationResponse>(url, data);
  }
}

export const matchService = new MatchService();