import Dexie, { Table } from 'dexie';
import { OfflineEvent } from '../types';
import { apiClient } from './apiClient';

class OfflineDatabase extends Dexie {
  events!: Table<OfflineEvent>;
  matches!: Table<any>;
  teams!: Table<any>;
  players!: Table<any>;

  constructor() {
    super('FootballCoachDB');
    
    this.version(1).stores({
      events: 'id, type, timestamp, synced',
      matches: 'id, seasonId, date, opponent',
      teams: 'id, name, ownerId',
      players: 'id, teamId, name, shirtNo'
    });
  }
}

class OfflineService {
  private db: OfflineDatabase;

  constructor() {
    this.db = new OfflineDatabase();
  }

  // Event management
  async storeEvent(event: OfflineEvent): Promise<void> {
    await this.db.events.add(event);
  }

  async getEvents(): Promise<OfflineEvent[]> {
    return await this.db.events.orderBy('timestamp').toArray();
  }

  async getPendingEvents(): Promise<OfflineEvent[]> {
    return await this.db.events.where('synced').equals(false).toArray();
  }

  async markEventSynced(eventId: string): Promise<void> {
    await this.db.events.update(eventId, { synced: true });
  }

  async removeEvent(eventId: string): Promise<void> {
    await this.db.events.delete(eventId);
  }

  async clearEvents(): Promise<void> {
    await this.db.events.clear();
  }

  // Sync event with server
  async syncEvent(event: OfflineEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'team:create':
          await apiClient.post('/teams', event.data);
          break;
        case 'team:update':
          await apiClient.put(`/teams/${event.data.id}`, event.data);
          break;
        case 'team:delete':
          await apiClient.delete(`/teams/${event.data.id}`);
          break;
        case 'player:create':
          await apiClient.post(`/teams/${event.data.teamId}/players`, event.data);
          break;
        case 'player:update':
          await apiClient.put(`/teams/players/${event.data.id}`, event.data);
          break;
        case 'player:delete':
          await apiClient.delete(`/teams/players/${event.data.id}`);
          break;
        case 'match:create':
          await apiClient.post(`/seasons/${event.data.seasonId}/matches`, event.data);
          break;
        case 'match:update':
          await apiClient.put(`/matches/${event.data.id}`, event.data);
          break;
        case 'match:start':
          await apiClient.post(`/matches/${event.data.id}/start`);
          break;
        case 'match:stop':
          await apiClient.post(`/matches/${event.data.id}/stop`);
          break;
        case 'substitution:make':
          await apiClient.post(`/matches/${event.data.matchId}/substitutions`, event.data);
          break;
        case 'goal:score':
          await apiClient.post(`/matches/${event.data.matchId}/goals`, event.data);
          break;
        default:
          console.warn(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Failed to sync event ${event.id}:`, error);
      throw error;
    }
  }

  // Data caching for offline access
  async cacheTeam(team: any): Promise<void> {
    await this.db.teams.put(team);
  }

  async getCachedTeams(ownerId: string): Promise<any[]> {
    return await this.db.teams.where('ownerId').equals(ownerId).toArray();
  }

  async cachePlayer(player: any): Promise<void> {
    await this.db.players.put(player);
  }

  async getCachedPlayers(teamId: string): Promise<any[]> {
    return await this.db.players.where('teamId').equals(teamId).toArray();
  }

  async cacheMatch(match: any): Promise<void> {
    await this.db.matches.put(match);
  }

  async getCachedMatches(seasonId: string): Promise<any[]> {
    return await this.db.matches.where('seasonId').equals(seasonId).toArray();
  }

  async getCachedMatch(matchId: string): Promise<any | undefined> {
    return await this.db.matches.get(matchId);
  }

  // Cleanup
  async clearCache(): Promise<void> {
    await Promise.all([
      this.db.teams.clear(),
      this.db.players.clear(),
      this.db.matches.clear()
    ]);
  }

  // Database utilities
  async getDatabaseSize(): Promise<number> {
    const [eventCount, teamCount, playerCount, matchCount] = await Promise.all([
      this.db.events.count(),
      this.db.teams.count(),
      this.db.players.count(),
      this.db.matches.count()
    ]);
    
    return eventCount + teamCount + playerCount + matchCount;
  }
}

export const offlineService = new OfflineService();