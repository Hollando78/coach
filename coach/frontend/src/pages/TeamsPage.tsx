import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTeamStore } from '../stores/teamStore';
import { PlusIcon, UserGroupIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

function CreateTeamModal({ isOpen, onClose, onSubmit, isLoading }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onSubmit(teamName.trim());
      setTeamName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Team</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
              disabled={isLoading}
              required
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
              disabled={isLoading || !teamName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading: boolean;
  initialName: string;
}

function EditTeamModal({ isOpen, onClose, onSubmit, isLoading, initialName }: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(initialName);

  useEffect(() => {
    setTeamName(initialName);
  }, [initialName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onSubmit(teamName.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Team</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
              disabled={isLoading}
              required
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
              disabled={isLoading || !teamName.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  teamName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isLoading, teamName }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Team</h2>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{teamName}"? This action cannot be undone and will remove all associated players and data.
        </p>
        
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
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Team'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamsPage() {
  const { teams, isLoading, error, fetchTeams, createTeam, updateTeam, deleteTeam, clearError } = useTeamStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<{ id: string; name: string } | null>(null);
  const [deleteTeamData, setDeleteTeamData] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (name: string) => {
    try {
      await createTeam(name);
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleEditTeam = async (name: string) => {
    if (!editTeam) return;
    
    try {
      await updateTeam(editTeam.id, name);
      setEditTeam(null);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamData) return;
    
    try {
      await deleteTeam(deleteTeamData.id);
      setDeleteTeamData(null);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage your football teams and players</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Team
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
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : teams.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first team</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Team
            </button>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditTeam({ id: team.id, name: team.name })}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit team"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTeamData({ id: team.id, name: team.name })}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete team"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p>Players: {team._count?.players || 0}</p>
                <p>Created: {formatDate(team.createdAt)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <Link
                  to={`/teams/${team.id}`}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Manage Team
                </Link>
                
                <span className="text-xs text-gray-500">
                  {team._count?.players === 1 ? '1 player' : `${team._count?.players || 0} players`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTeam}
        isLoading={isLoading}
      />

      <EditTeamModal
        isOpen={editTeam !== null}
        onClose={() => setEditTeam(null)}
        onSubmit={handleEditTeam}
        isLoading={isLoading}
        initialName={editTeam?.name || ''}
      />

      <ConfirmDeleteModal
        isOpen={deleteTeamData !== null}
        onClose={() => setDeleteTeamData(null)}
        onConfirm={handleDeleteTeam}
        isLoading={isLoading}
        teamName={deleteTeamData?.name || ''}
      />
    </div>
  );
}

export default TeamsPage;