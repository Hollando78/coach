import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CalendarIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CreateSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (seasonData: { name: string; startDate?: string; endDate?: string }) => void;
  isLoading: boolean;
}

function CreateSeasonModal({ isOpen, onClose, onSubmit, isLoading }: CreateSeasonModalProps) {
  const [seasonData, setSeasonData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seasonData.name.trim()) {
      onSubmit({
        name: seasonData.name.trim(),
        startDate: seasonData.startDate || undefined,
        endDate: seasonData.endDate || undefined
      });
      setSeasonData({ name: '', startDate: '', endDate: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Season</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="seasonName" className="block text-sm font-medium text-gray-700 mb-2">
              Season Name
            </label>
            <input
              type="text"
              id="seasonName"
              value={seasonData.name}
              onChange={(e) => setSeasonData({ ...seasonData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 2024-25 Season"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              id="startDate"
              value={seasonData.startDate}
              onChange={(e) => setSeasonData({ ...seasonData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              id="endDate"
              value={seasonData.endDate}
              onChange={(e) => setSeasonData({ ...seasonData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              min={seasonData.startDate}
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
              disabled={isLoading || !seasonData.name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SeasonsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { currentTeam, selectTeam } = useTeamStore();
  const { 
    seasons, 
    isLoading, 
    error, 
    fetchSeasons, 
    createSeason, 
    clearError 
  } = useSeasonStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (teamId) {
      if (!currentTeam || currentTeam.id !== teamId) {
        selectTeam(teamId);
      }
      fetchSeasons(teamId);
    }
  }, [teamId, currentTeam, selectTeam, fetchSeasons]);

  const handleCreateSeason = async (seasonData: { name: string; startDate?: string; endDate?: string }) => {
    if (!teamId) return;
    
    try {
      await createSeason(teamId, seasonData);
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getSeasonStatus = (season: any) => {
    const now = new Date();
    const startDate = season.startDate ? new Date(season.startDate) : null;
    const endDate = season.endDate ? new Date(season.endDate) : null;

    if (endDate && now > endDate) return 'Completed';
    if (startDate && now < startDate) return 'Upcoming';
    return 'Active';
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
          <Link to="/teams" className="text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentTeam?.name} - Seasons
            </h1>
            <p className="text-gray-600">Manage seasons and matches for your team</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Season
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
        ) : seasons.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No seasons yet</h3>
            <p className="text-gray-500 mb-6">Create your first season to start managing matches</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Season
            </button>
          </div>
        ) : (
          seasons.map((season) => (
            <div key={season.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{season.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getSeasonStatus(season) === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : getSeasonStatus(season) === 'Upcoming'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {getSeasonStatus(season)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {formatDate(season.startDate)} - {formatDate(season.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Matches: {season._count?.matches || 0}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Link
                  to={`/teams/${teamId}/seasons/${season.id}/matches`}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  View Matches
                </Link>
                
                <span className="text-xs text-gray-500">
                  Created {formatDate(season.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Season Modal */}
      <CreateSeasonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSeason}
        isLoading={isLoading}
      />
    </div>
  );
}

export default SeasonsPage;
