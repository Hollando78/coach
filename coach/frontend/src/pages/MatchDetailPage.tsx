import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: { playerId: string; minute: number; notes: string }) => void;
  isLoading: boolean;
  players: any[];
}

function AddGoalModal({ isOpen, onClose, onSubmit, isLoading, players }: AddGoalModalProps) {
  const [goalData, setGoalData] = useState({
    playerId: '',
    minute: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalData.playerId && goalData.minute) {
      onSubmit({
        playerId: goalData.playerId,
        minute: parseInt(goalData.minute),
        notes: goalData.notes
      });
      setGoalData({ playerId: '', minute: '', notes: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Goal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-2">
              Player
            </label>
            <select
              id="player"
              value={goalData.playerId}
              onChange={(e) => setGoalData({ ...goalData, playerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - #{player.jerseyNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-2">
              Minute
            </label>
            <input
              type="number"
              id="minute"
              value={goalData.minute}
              onChange={(e) => setGoalData({ ...goalData, minute: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 25"
              min="0"
              max="120"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <input
              type="text"
              id="notes"
              value={goalData.notes}
              onChange={(e) => setGoalData({ ...goalData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Header from corner kick"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !goalData.playerId || !goalData.minute}
            >
              {isLoading ? 'Adding...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddSubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => void;
  isLoading: boolean;
  players: any[];
}

function AddSubstitutionModal({ isOpen, onClose, onSubmit, isLoading, players }: AddSubstitutionModalProps) {
  const [subData, setSubData] = useState({
    minute: '',
    offPlayerId: '',
    onPlayerId: '',
    position: ''
  });

  const positions = [
    'Goalkeeper', 'Right Back', 'Centre Back', 'Left Back', 
    'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
    'Right Winger', 'Left Winger', 'Striker', 'Centre Forward'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subData.minute && subData.offPlayerId && subData.onPlayerId && subData.position) {
      onSubmit({
        minute: parseInt(subData.minute),
        offPlayerId: subData.offPlayerId,
        onPlayerId: subData.onPlayerId,
        position: subData.position
      });
      setSubData({ minute: '', offPlayerId: '', onPlayerId: '', position: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Substitution</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-2">
              Minute
            </label>
            <input
              type="number"
              id="minute"
              value={subData.minute}
              onChange={(e) => setSubData({ ...subData, minute: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 65"
              min="0"
              max="120"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="offPlayer" className="block text-sm font-medium text-gray-700 mb-2">
              Player Coming Off
            </label>
            <select
              id="offPlayer"
              value={subData.offPlayerId}
              onChange={(e) => setSubData({ ...subData, offPlayerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select player</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - #{player.jerseyNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="onPlayer" className="block text-sm font-medium text-gray-700 mb-2">
              Player Coming On
            </label>
            <select
              id="onPlayer"
              value={subData.onPlayerId}
              onChange={(e) => setSubData({ ...subData, onPlayerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select player</option>
              {players.filter(p => p.id !== subData.offPlayerId).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - #{player.jerseyNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <select
              id="position"
              value={subData.position}
              onChange={(e) => setSubData({ ...subData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select position</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !subData.minute || !subData.offPlayerId || !subData.onPlayerId || !subData.position}
            >
              {isLoading ? 'Adding...' : 'Add Substitution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MatchDetailPage() {
  const { teamId, seasonId, matchId } = useParams<{ 
    teamId: string; 
    seasonId: string; 
    matchId: string; 
  }>();
  
  const { currentMatch, isLoading, error, getMatch, clearError, startMatch, stopMatch, scoreGoal, makeSubstitution } = useSeasonStore();
  const { currentTeam, selectTeam, fetchPlayers, players } = useTeamStore();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  useEffect(() => {
    if (matchId) {
      getMatch(matchId);
    }
    if (teamId && (!currentTeam || currentTeam.id !== teamId)) {
      selectTeam(teamId);
    }
  }, [matchId, teamId, getMatch, selectTeam, currentTeam]);

  useEffect(() => {
    if (currentTeam) {
      loadPlayers();
    }
  }, [currentTeam]);

  const loadPlayers = async () => {
    if (!currentTeam) return;
    try {
      await fetchPlayers(currentTeam.id);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const handleStartMatch = async () => {
    if (!matchId) return;
    try {
      await startMatch(matchId);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleStopMatch = async () => {
    if (!matchId) return;
    try {
      await stopMatch(matchId);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAddGoal = async (goalData: { playerId: string; minute: number; notes: string }) => {
    if (!matchId) return;
    try {
      await scoreGoal(matchId, goalData);
      setIsGoalModalOpen(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAddSubstitution = async (subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => {
    if (!matchId) return;
    try {
      await makeSubstitution(matchId, subData);
      setIsSubModalOpen(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMatchStatus = () => {
    if (!currentMatch) return 'Unknown';
    if (currentMatch.isLive) return 'Live';
    
    const matchDate = new Date(currentMatch.date);
    const now = new Date();
    
    if (matchDate > now) return 'Upcoming';
    if (currentMatch.stoppedAt) return 'Completed';
    return 'Scheduled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Live': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="card">
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Error loading match</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={clearError}
          className="text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentMatch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Match not found</h2>
        <p className="text-gray-500 mb-4">The match you're looking for doesn't exist.</p>
        <Link to={`/teams/${teamId}/seasons/${seasonId}/matches`} className="text-blue-600 hover:text-blue-800">
          ← Back to Matches
        </Link>
      </div>
    );
  }

  const status = getMatchStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/teams/${teamId}/seasons/${seasonId}/matches`} className="text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              vs {currentMatch.opponent}
            </h1>
            <p className="text-gray-600">Match Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          
          {status === 'Scheduled' && (
            <button
              onClick={handleStartMatch}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <PlayIcon className="h-4 w-4" />
              Start Match
            </button>
          )}
          
          {status === 'Live' && (
            <>
              <Link
                to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}/live`}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                Live View
              </Link>
              <button
                onClick={handleStopMatch}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <StopIcon className="h-4 w-4" />
                End Match
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Match Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Match Info */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Match Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium">{formatDate(currentMatch.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Venue</p>
                <p className="font-medium">
                  {currentMatch.homeAway === 'home' ? 'Home Ground' : 'Away Ground'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Opposition</p>
                <p className="font-medium">{currentMatch.opponent}</p>
              </div>
            </div>

            {currentMatch.startedAt && (
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Started At</p>
                  <p className="font-medium">{formatDate(currentMatch.startedAt)}</p>
                </div>
              </div>
            )}

            {currentMatch.stoppedAt && (
              <div className="flex items-center gap-3">
                <StopIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Ended At</p>
                  <p className="font-medium">{formatDate(currentMatch.stoppedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <Link
              to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}/plan`}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Match Planning
            </Link>

            {/* Show Live Match button if match has planning (blocks) or is already live */}
            {(currentMatch?.blocks && currentMatch.blocks.length > 0) || status === 'Live' ? (
              <Link
                to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}/live`}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
              >
                <PlayIcon className="h-4 w-4" />
                Live Match View
              </Link>
            ) : null}

            {status === 'Live' && (
              <>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Goal
                </button>

                <button
                  onClick={() => setIsSubModalOpen(true)}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Substitution
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goals and Substitutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals</h2>
          
          {currentMatch.goals && currentMatch.goals.length > 0 ? (
            <div className="space-y-3">
              {currentMatch.goals.map((goal: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{goal.player?.name}</p>
                    <p className="text-sm text-gray-600">{goal.notes || 'Goal'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{goal.minute}'</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No goals recorded yet</p>
          )}
        </div>

        {/* Substitutions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Substitutions</h2>
          
          {currentMatch.substitutions && currentMatch.substitutions.length > 0 ? (
            <div className="space-y-3">
              {currentMatch.substitutions.map((sub: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {sub.onPlayer?.name} ↔ {sub.offPlayer?.name}
                    </p>
                    <p className="text-sm text-gray-600">{sub.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-yellow-600">{sub.minute}'</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No substitutions recorded yet</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleAddGoal}
        isLoading={isLoading}
        players={players}
      />

      <AddSubstitutionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSubmit={handleAddSubstitution}
        isLoading={isLoading}
        players={players}
      />
    </div>
  );
}

export default MatchDetailPage;