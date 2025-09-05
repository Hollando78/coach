import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (matchData: {
    date: string;
    opponent: string;
    homeAway: 'home' | 'away';
  }) => void;
  isLoading: boolean;
}

function CreateMatchModal({ isOpen, onClose, onSubmit, isLoading }: CreateMatchModalProps) {
  const [matchData, setMatchData] = useState({
    date: '',
    opponent: '',
    homeAway: 'home' as 'home' | 'away',
    venue: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchData.date && matchData.opponent.trim()) {
      // Convert datetime-local to ISO string
      const isoDate = new Date(matchData.date).toISOString();
      onSubmit({
        ...matchData,
        date: isoDate,
        opponent: matchData.opponent.trim()
      });
      setMatchData({ date: '', opponent: '', homeAway: 'home', venue: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule New Match</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-2">
              Opponent Team
            </label>
            <input
              type="text"
              id="opponent"
              value={matchData.opponent}
              onChange={(e) => setMatchData({ ...matchData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Liverpool FC"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Match Date & Time
            </label>
            <input
              type="datetime-local"
              id="date"
              value={matchData.date}
              onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home or Away
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="home"
                  checked={matchData.homeAway === 'home'}
                  onChange={(e) => setMatchData({ ...matchData, homeAway: e.target.value as 'home' | 'away' })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Home
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="away"
                  checked={matchData.homeAway === 'away'}
                  onChange={(e) => setMatchData({ ...matchData, homeAway: e.target.value as 'home' | 'away' })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Away
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
              Venue (Optional)
            </label>
            <input
              type="text"
              id="venue"
              value={matchData.venue}
              onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wembley Stadium, Old Trafford"
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
              disabled={isLoading || !matchData.date || !matchData.opponent.trim()}
            >
              {isLoading ? 'Scheduling...' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onSubmit: (matchData: { date: string; opponent: string; homeAway: 'home' | 'away'; venue?: string }) => void;
  isLoading: boolean;
}

function EditMatchModal({ isOpen, onClose, match, onSubmit, isLoading }: EditMatchModalProps) {
  const [matchData, setMatchData] = useState({
    date: '',
    opponent: '',
    homeAway: 'home' as 'home' | 'away',
    venue: ''
  });

  useEffect(() => {
    if (match && isOpen) {
      // Convert ISO date to datetime-local format
      const localDate = new Date(match.date);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

      setMatchData({
        date: formattedDate,
        opponent: match.opponent,
        homeAway: match.homeAway,
        venue: match.venue || ''
      });
    }
  }, [match, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchData.date && matchData.opponent.trim()) {
      // Convert datetime-local to ISO string
      const isoDate = new Date(matchData.date).toISOString();
      onSubmit({
        ...matchData,
        date: isoDate,
        opponent: matchData.opponent.trim()
      });
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Match Details</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="editOpponent" className="block text-sm font-medium text-gray-700 mb-2">
              Opponent Team
            </label>
            <input
              type="text"
              id="editOpponent"
              value={matchData.opponent}
              onChange={(e) => setMatchData({ ...matchData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Liverpool FC"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="editDate" className="block text-sm font-medium text-gray-700 mb-2">
              Match Date & Time
            </label>
            <input
              type="datetime-local"
              id="editDate"
              value={matchData.date}
              onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home or Away
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="home"
                  checked={matchData.homeAway === 'home'}
                  onChange={(e) => setMatchData({ ...matchData, homeAway: e.target.value as 'home' | 'away' })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Home
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="away"
                  checked={matchData.homeAway === 'away'}
                  onChange={(e) => setMatchData({ ...matchData, homeAway: e.target.value as 'home' | 'away' })}
                  className="mr-2"
                  disabled={isLoading}
                />
                Away
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="editVenue" className="block text-sm font-medium text-gray-700 mb-2">
              Venue (Optional)
            </label>
            <input
              type="text"
              id="editVenue"
              value={matchData.venue}
              onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wembley Stadium, Old Trafford"
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
              disabled={isLoading || !matchData.date || !matchData.opponent.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MatchesPage() {
  const { teamId, seasonId } = useParams<{ teamId: string; seasonId: string }>();
  const { currentTeam, selectTeam } = useTeamStore();
  const { 
    currentSeason,
    matches, 
    isLoading, 
    error, 
    fetchMatches, 
    createMatch,
    updateMatch,
    selectSeason,
    clearError 
  } = useSeasonStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);

  useEffect(() => {
    if (teamId && seasonId) {
      // Ensure we have the current team loaded
      if (!currentTeam || currentTeam.id !== teamId) {
        selectTeam(teamId);
      }
      
      // Fetch season data and matches
      fetchMatches(seasonId);
      
      // Set current season context (we'll need to modify the store for this)
      // For now, we'll work with what we have
    }
  }, [teamId, seasonId, currentTeam, selectTeam, fetchMatches]);

  const handleCreateMatch = async (matchData: {
    date: string;
    opponent: string;
    homeAway: 'home' | 'away';
    venue?: string;
  }) => {
    if (!seasonId) return;
    
    try {
      await createMatch(seasonId, matchData);
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleEditMatch = async (matchData: { date: string; opponent: string; homeAway: 'home' | 'away'; venue?: string }) => {
    if (!editMatch) return;
    
    try {
      await updateMatch(editMatch.id, matchData);
      setEditMatch(null);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMatchStatus = (match: any) => {
    if (match.isLive) return 'Live';
    
    const matchDate = new Date(match.date);
    const now = new Date();
    
    if (matchDate > now) return 'Upcoming';
    if (match.stoppedAt) return 'Completed';
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

  if (!currentTeam && !isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">Team not found</h2>
        <p className="text-gray-500 mb-4">The team you're looking for doesn't exist or you don't have access to it.</p>
        <Link to="/teams" className="text-blue-600 hover:text-blue-800">← Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/teams/${teamId}/seasons`} className="text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentTeam?.name} - Matches
            </h1>
            <p className="text-gray-600">Season matches and fixtures</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Schedule Match
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </>
        ) : matches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches scheduled</h3>
            <p className="text-gray-500 mb-6">Schedule your first match to start tracking games</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Schedule First Match
            </button>
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  vs {match.opponent}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getMatchStatus(match))}`}>
                    {getMatchStatus(match)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    match.homeAway === 'home' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {match.homeAway === 'home' ? 'Home' : 'Away'}
                  </span>
                  <button
                    onClick={() => setEditMatch(match)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit match details"
                    aria-label="Edit match details"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{formatDate(match.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{match.venue || (match.homeAway === 'home' ? 'Home Ground' : 'Away Ground')}</span>
                </div>
                {(match._count?.goals > 0 || match._count?.substitutions > 0) && (
                  <div className="flex items-center gap-4 text-xs">
                    <span>Goals: {match._count?.goals || 0}</span>
                    <span>Subs: {match._count?.substitutions || 0}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <Link
                  to={`/teams/${teamId}/seasons/${seasonId}/matches/${match.id}`}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" />
                  View Details
                </Link>
                
                <div className="flex gap-1">
                  {getMatchStatus(match) === 'Live' ? (
                    <Link
                      to={`/teams/${teamId}/seasons/${seasonId}/matches/${match.id}/live`}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors inline-flex items-center gap-1"
                    >
                      <StopIcon className="h-3 w-3" />
                      Live
                    </Link>
                  ) : getMatchStatus(match) === 'Scheduled' || getMatchStatus(match) === 'Upcoming' ? (
                    <span className="text-xs text-gray-500">
                      {formatDateShort(match.date)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMatch}
        isLoading={isLoading}
      />

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={editMatch !== null}
        onClose={() => setEditMatch(null)}
        match={editMatch}
        onSubmit={handleEditMatch}
        isLoading={isLoading}
      />
    </div>
  );
}

export default MatchesPage;
