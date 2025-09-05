import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamStore } from '../stores/teamStore';
import { Player } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  UserIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface CreatePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (player: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>) => void;
  isLoading: boolean;
  existingPlayers: Player[];
}

function CreatePlayerModal({ isOpen, onClose, onSubmit, isLoading, existingPlayers }: CreatePlayerModalProps) {
  const [playerData, setPlayerData] = useState({
    name: '',
    shirtNo: '',
    skillRating: 5,
    preferredPositions: [] as string[],
    isAvailable: true
  });

  const positionOptions = [
    'Goalkeeper', 'Centre Back', 'Left Back', 'Right Back', 
    'Defensive Mid', 'Central Mid', 'Attacking Mid',
    'Left Wing', 'Right Wing', 'Centre Forward', 'Second Striker'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shirtNo = playerData.shirtNo ? parseInt(playerData.shirtNo) : undefined;
    
    // Check if shirt number is already taken
    if (shirtNo && existingPlayers.some(p => p.shirtNo === shirtNo)) {
      alert('Shirt number already taken!');
      return;
    }

    onSubmit({
      name: playerData.name.trim(),
      shirtNo,
      skillRating: playerData.skillRating,
      preferredPositions: playerData.preferredPositions,
      isAvailable: playerData.isAvailable
    });
    
    setPlayerData({
      name: '',
      shirtNo: '',
      skillRating: 5,
      preferredPositions: [],
      isAvailable: true
    });
  };

  const handlePositionToggle = (position: string) => {
    setPlayerData(prev => ({
      ...prev,
      preferredPositions: prev.preferredPositions.includes(position)
        ? prev.preferredPositions.filter(p => p !== position)
        : [...prev.preferredPositions, position]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Player</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Player Name *
            </label>
            <input
              type="text"
              id="playerName"
              value={playerData.name}
              onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="shirtNo" className="block text-sm font-medium text-gray-700 mb-2">
              Shirt Number (1-99)
            </label>
            <input
              type="number"
              id="shirtNo"
              min="1"
              max="99"
              value={playerData.shirtNo}
              onChange={(e) => setPlayerData(prev => ({ ...prev, shirtNo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="skillRating" className="block text-sm font-medium text-gray-700 mb-2">
              Skill Rating: {playerData.skillRating}/10
            </label>
            <input
              type="range"
              id="skillRating"
              min="1"
              max="10"
              value={playerData.skillRating}
              onChange={(e) => setPlayerData(prev => ({ ...prev, skillRating: parseInt(e.target.value) }))}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Positions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positionOptions.map(position => (
                <button
                  key={position}
                  type="button"
                  onClick={() => handlePositionToggle(position)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    playerData.preferredPositions.includes(position)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={playerData.isAvailable}
                onChange={(e) => setPlayerData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700">Available for selection</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Unavailable players cannot be selected for matches
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
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
              disabled={isLoading || !playerData.name.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (player: Partial<Player>) => void;
  isLoading: boolean;
  player: Player | null;
  existingPlayers: Player[];
}

function EditPlayerModal({ isOpen, onClose, onSubmit, isLoading, player, existingPlayers }: EditPlayerModalProps) {
  const [playerData, setPlayerData] = useState({
    name: '',
    shirtNo: '',
    skillRating: 5,
    preferredPositions: [] as string[],
    isAvailable: true
  });

  const positionOptions = [
    'Goalkeeper', 'Centre Back', 'Left Back', 'Right Back', 
    'Defensive Mid', 'Central Mid', 'Attacking Mid',
    'Left Wing', 'Right Wing', 'Centre Forward', 'Second Striker'
  ];

  useEffect(() => {
    if (player && isOpen) {
      setPlayerData({
        name: player.name,
        shirtNo: player.shirtNo?.toString() || '',
        skillRating: player.skillRating,
        preferredPositions: player.preferredPositions || [],
        isAvailable: player.isAvailable
      });
    }
  }, [player, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    const shirtNo = playerData.shirtNo ? parseInt(playerData.shirtNo) : null;
    
    // Check if shirt number is already taken by another player
    if (shirtNo && existingPlayers.some(p => p.shirtNo === shirtNo && p.id !== player.id)) {
      alert('Shirt number already taken!');
      return;
    }

    onSubmit({
      name: playerData.name.trim(),
      shirtNo,
      skillRating: playerData.skillRating,
      preferredPositions: playerData.preferredPositions,
      isAvailable: playerData.isAvailable
    });
  };

  const handlePositionToggle = (position: string) => {
    setPlayerData(prev => ({
      ...prev,
      preferredPositions: prev.preferredPositions.includes(position)
        ? prev.preferredPositions.filter(p => p !== position)
        : [...prev.preferredPositions, position]
    }));
  };

  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Player</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Player Name *
            </label>
            <input
              type="text"
              id="playerName"
              value={playerData.name}
              onChange={(e) => setPlayerData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="shirtNo" className="block text-sm font-medium text-gray-700 mb-2">
              Shirt Number (1-99)
            </label>
            <input
              type="number"
              id="shirtNo"
              min="1"
              max="99"
              value={playerData.shirtNo}
              onChange={(e) => setPlayerData(prev => ({ ...prev, shirtNo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="skillRating" className="block text-sm font-medium text-gray-700 mb-2">
              Skill Rating: {playerData.skillRating}/10
            </label>
            <input
              type="range"
              id="skillRating"
              min="1"
              max="10"
              value={playerData.skillRating}
              onChange={(e) => setPlayerData(prev => ({ ...prev, skillRating: parseInt(e.target.value) }))}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Positions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positionOptions.map(position => (
                <button
                  key={position}
                  type="button"
                  onClick={() => handlePositionToggle(position)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    playerData.preferredPositions.includes(position)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  {position}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={playerData.isAvailable}
                onChange={(e) => setPlayerData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700">Available for selection</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Unavailable players cannot be selected for matches
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
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
              disabled={isLoading || !playerData.name.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { 
    currentTeam, 
    players, 
    isLoading, 
    error, 
    selectTeam, 
    createPlayer, 
    updatePlayer, 
    deletePlayer,
    clearError 
  } = useTeamStore();

  const [isCreatePlayerModalOpen, setIsCreatePlayerModalOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayerData, setDeletePlayerData] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (teamId) {
      selectTeam(teamId);
    }
  }, [teamId, selectTeam]);

  const handleCreatePlayer = async (playerData: Omit<Player, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>) => {
    if (!teamId) return;
    
    try {
      await createPlayer(teamId, playerData);
      setIsCreatePlayerModalOpen(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleEditPlayer = async (playerData: Partial<Player>) => {
    if (!editPlayer) return;
    
    try {
      await updatePlayer(editPlayer.id, playerData);
      setEditPlayer(null);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeletePlayer = async () => {
    if (!deletePlayerData) return;
    
    try {
      await deletePlayer(deletePlayerData.id);
      setDeletePlayerData(null);
    } catch (error) {
      // Error handled by store
    }
  };

  const getSkillRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100';
    if (rating >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading && !currentTeam) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentTeam) {
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
            <h1 className="text-2xl font-bold text-gray-900">{currentTeam.name}</h1>
            <p className="text-gray-600">{players.length} players</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/teams/${currentTeam.id}/seasons`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <TrophyIcon className="h-5 w-5" />
            Manage Seasons
          </Link>
          <button
            onClick={() => setIsCreatePlayerModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Player
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </>
        ) : players.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
            <p className="text-gray-500 mb-6">Start building your squad by adding players</p>
            <button
              onClick={() => setIsCreatePlayerModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Your First Player
            </button>
          </div>
        ) : (
          players.map((player) => (
            <div key={player.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                  {player.shirtNo && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      #{player.shirtNo}
                    </span>
                  )}
                  {!player.isAvailable && (
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditPlayer(player)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit player"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletePlayerData({ id: player.id, name: player.name })}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete player"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Skill Rating:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSkillRatingColor(player.skillRating)}`}>
                    {player.skillRating}/10
                  </span>
                </div>
                
                {player.preferredPositions && player.preferredPositions.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Positions:</span>
                    <div className="flex flex-wrap gap-1">
                      {player.preferredPositions.map((position, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreatePlayerModal
        isOpen={isCreatePlayerModalOpen}
        onClose={() => setIsCreatePlayerModalOpen(false)}
        onSubmit={handleCreatePlayer}
        isLoading={isLoading}
        existingPlayers={players}
      />

      <EditPlayerModal
        isOpen={editPlayer !== null}
        onClose={() => setEditPlayer(null)}
        onSubmit={handleEditPlayer}
        isLoading={isLoading}
        player={editPlayer}
        existingPlayers={players}
      />

      {/* Delete Confirmation Modal */}
      {deletePlayerData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Player</h2>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "{deletePlayerData.name}" from the team? This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletePlayerData(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlayer}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Removing...' : 'Remove Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamDetailPage;