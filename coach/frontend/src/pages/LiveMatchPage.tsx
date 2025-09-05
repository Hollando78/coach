import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { 
  ArrowLeftIcon,
  PlusIcon,
  StopIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface QuickGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: { playerId: string; minute: number; notes: string }) => void;
  isLoading: boolean;
  players: any[];
  currentMinute: number;
}

function QuickGoalModal({ isOpen, onClose, onSubmit, isLoading, players, currentMinute }: QuickGoalModalProps) {
  const [goalData, setGoalData] = useState({
    playerId: '',
    minute: currentMinute.toString(),
    notes: ''
  });

  useEffect(() => {
    setGoalData(prev => ({ ...prev, minute: currentMinute.toString() }));
  }, [currentMinute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalData.playerId && goalData.minute) {
      onSubmit({
        playerId: goalData.playerId,
        minute: parseInt(goalData.minute),
        notes: goalData.notes
      });
      setGoalData({ playerId: '', minute: currentMinute.toString(), notes: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Goal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-2">
              Player
            </label>
            <select
              id="player"
              value={goalData.playerId}
              onChange={(e) => setGoalData({ ...goalData, playerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Header, Penalty, Own goal"
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
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !goalData.playerId || !goalData.minute}
            >
              {isLoading ? 'Recording...' : 'Record Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface QuickSubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => void;
  isLoading: boolean;
  players: any[];
  currentMinute: number;
}

function QuickSubModal({ isOpen, onClose, onSubmit, isLoading, players, currentMinute }: QuickSubModalProps) {
  const [subData, setSubData] = useState({
    minute: currentMinute.toString(),
    offPlayerId: '',
    onPlayerId: '',
    position: ''
  });

  const positions = [
    'Goalkeeper', 'Right Back', 'Centre Back', 'Left Back', 
    'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
    'Right Winger', 'Left Winger', 'Striker', 'Centre Forward'
  ];

  useEffect(() => {
    setSubData(prev => ({ ...prev, minute: currentMinute.toString() }));
  }, [currentMinute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subData.minute && subData.offPlayerId && subData.onPlayerId && subData.position) {
      onSubmit({
        minute: parseInt(subData.minute),
        offPlayerId: subData.offPlayerId,
        onPlayerId: subData.onPlayerId,
        position: subData.position
      });
      setSubData({ minute: currentMinute.toString(), offPlayerId: '', onPlayerId: '', position: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Substitution</h2>
        
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !subData.minute || !subData.offPlayerId || !subData.onPlayerId || !subData.position}
            >
              {isLoading ? 'Recording...' : 'Make Substitution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LiveMatchPage() {
  const { teamId, seasonId, matchId } = useParams<{ 
    teamId: string; 
    seasonId: string; 
    matchId: string; 
  }>();
  
  const { currentMatch, isLoading, error, getMatch, clearError, stopMatch, scoreGoal, makeSubstitution } = useSeasonStore();
  const { currentTeam, selectTeam, getTeamPlayers } = useTeamStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);

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

  // Calculate current match minute
  useEffect(() => {
    if (currentMatch?.startedAt && currentMatch.isLive) {
      const startTime = new Date(currentMatch.startedAt).getTime();
      const updateMinute = () => {
        const now = Date.now();
        const diffMinutes = Math.floor((now - startTime) / 60000);
        setCurrentMinute(Math.max(0, diffMinutes));
      };

      updateMinute();
      const interval = setInterval(updateMinute, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [currentMatch]);

  const loadPlayers = async () => {
    if (!currentTeam) return;
    try {
      const response = await getTeamPlayers(currentTeam.id);
      setPlayers(response.players || []);
    } catch (error) {
      console.error('Failed to load players:', error);
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
      // Refresh match data
      setTimeout(() => getMatch(matchId), 500);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAddSubstitution = async (subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => {
    if (!matchId) return;
    try {
      await makeSubstitution(matchId, subData);
      setIsSubModalOpen(false);
      // Refresh match data
      setTimeout(() => getMatch(matchId), 500);
    } catch (error) {
      // Error handled by store
    }
  };

  const formatMatchTime = () => {
    if (currentMinute >= 45 && currentMinute < 90) {
      return `45+${currentMinute - 45}'`;
    } else if (currentMinute >= 90) {
      return `90+${currentMinute - 90}'`;
    }
    return `${currentMinute}'`;
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-green-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading match...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-red-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={clearError}
            className="bg-white text-red-600 px-6 py-2 rounded-md hover:bg-gray-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentMatch || !currentMatch.isLive) {
    return (
      <div className="h-screen bg-gray-600 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Match Not Live</h2>
          <p className="mb-4">This match is not currently live.</p>
          <Link 
            to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`}
            className="bg-white text-gray-600 px-6 py-2 rounded-md hover:bg-gray-100"
          >
            Back to Match Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-green-400 to-green-600 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-20 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`} 
              className="text-white hover:text-gray-200"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {currentTeam?.name} vs {currentMatch.opponent}
              </h1>
              <p className="text-green-100">Live Match - {currentMatch.homeAway === 'home' ? 'Home' : 'Away'}</p>
            </div>
          </div>
          
          <button
            onClick={handleStopMatch}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <StopIcon className="h-4 w-4" />
            End Match
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500 text-white px-4 py-2 text-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6">
        {/* Score and Timer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{currentTeam?.name}</h3>
                <div className="text-4xl font-bold text-green-600">
                  {currentMatch.goals?.filter((g: any) => g.playerId !== 'own-goal').length || 0}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">vs</div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{currentMatch.opponent}</h3>
                <div className="text-4xl font-bold text-gray-600">0</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
              <ClockIcon className="h-6 w-6" />
              {formatMatchTime()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Record Goal</h3>
                <p className="text-gray-600">Quick goal entry</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsSubModalOpen(true)}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Make Substitution</h3>
                <p className="text-gray-600">Player change</p>
              </div>
            </div>
          </button>
        </div>

        {/* Match Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals</h3>
            
            {currentMatch.goals && currentMatch.goals.length > 0 ? (
              <div className="space-y-3">
                {currentMatch.goals.map((goal: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ⚽
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{goal.player?.name}</p>
                        <p className="text-sm text-gray-600">{goal.notes || 'Goal'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{goal.minute}'</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No goals scored yet</p>
            )}
          </div>

          {/* Substitutions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Substitutions</h3>
            
            {currentMatch.substitutions && currentMatch.substitutions.length > 0 ? (
              <div className="space-y-3">
                {currentMatch.substitutions.map((sub: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        ↔
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.onPlayer?.name} ↔ {sub.offPlayer?.name}
                        </p>
                        <p className="text-sm text-gray-600">{sub.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600">{sub.minute}'</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No substitutions made yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuickGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleAddGoal}
        isLoading={isLoading}
        players={players}
        currentMinute={currentMinute}
      />

      <QuickSubModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onSubmit={handleAddSubstitution}
        isLoading={isLoading}
        players={players}
        currentMinute={currentMinute}
      />
    </div>
  );
}

export default LiveMatchPage;