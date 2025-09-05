import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { seasonService } from '../services/seasonService';
import { Player, Assignment, PlanningInterval } from '../types';
import { TimeBlockSelector } from '../components/match/TimeBlockSelector';
import { TimeBlockPlanner } from '../components/match/TimeBlockPlanner';
import { SubstitutionPlan } from '../components/match/SubstitutionPlan';
import { createTimeBlockConfig, analyzeAllSubstitutions } from '../utils/timeBlocks';
import { 
  ArrowLeftIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  Squares2X2Icon,
  TrashIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface CreateFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formationData: { name: string; shapeJSON: any }) => void;
  isLoading: boolean;
}

function CreateFormationModal({ isOpen, onClose, onSubmit, isLoading }: CreateFormationModalProps) {
  const [formationData, setFormationData] = useState({
    name: '',
    formation: '3-3-2'
  });

  const formations = [
    { name: '3-3-2', description: 'Classic balanced 9-aside formation' },
    { name: '3-2-3', description: 'Attacking formation with wide forwards' },
    { name: '2-4-2', description: 'Midfield-heavy formation' },
    { name: '3-4-1', description: 'Single striker formation' },
    { name: '2-3-3', description: 'High attacking formation' },
    { name: '4-3-1', description: 'Defensive formation with solid backline' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formationData.name.trim() && formationData.formation) {
      onSubmit({
        name: formationData.name.trim(),
        shapeJSON: { formation: formationData.formation }
      });
      setFormationData({ name: '', formation: '3-3-2' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Formation</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Formation Name
            </label>
            <input
              type="text"
              id="name"
              value={formationData.name}
              onChange={(e) => setFormationData({ ...formationData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., My 4-4-2"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="formation" className="block text-sm font-medium text-gray-700 mb-2">
              Formation Type
            </label>
            <select
              id="formation"
              value={formationData.formation}
              onChange={(e) => setFormationData({ ...formationData, formation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              {formations.map((formation) => (
                <option key={formation.name} value={formation.name}>
                  {formation.name} - {formation.description}
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
              disabled={isLoading || !formationData.name.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Formation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Remove local Player interface since we import it from types

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  selectedPlayers: string[];
  onSelectionChange: (playerIds: string[]) => void;
}

function PlayerSelectionModal({ isOpen, onClose, players, selectedPlayers, onSelectionChange }: PlayerSelectionModalProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedPlayers);

  useEffect(() => {
    setLocalSelection(selectedPlayers);
  }, [selectedPlayers, isOpen]);

  const togglePlayer = (playerId: string) => {
    if (localSelection.includes(playerId)) {
      setLocalSelection(localSelection.filter(id => id !== playerId));
    } else {
      setLocalSelection([...localSelection, playerId]);
    }
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Select Players ({localSelection.length} selected)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {players.map((player) => {
            const isSelected = localSelection.includes(player.id);
            const canSelect = !isSelected && player.isAvailable;
            const isDisabled = !player.isAvailable;
            
            return (
              <div
                key={player.id}
                onClick={() => player.isAvailable ? togglePlayer(player.id) : undefined}
                className={`p-3 border rounded-lg transition-colors ${
                  !player.isAvailable
                    ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                    : isSelected 
                    ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                    : canSelect
                    ? 'border-gray-300 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {player.name} #{player.shirtNo || 'N/A'}
                      </p>
                      {!player.isAvailable && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {player.preferredPositions.join(', ') || 'No preferred positions'}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={localSelection.length === 0}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

interface PlayerAssignment {
  playerId: string;
  position: string;
  isBench: boolean;
}

interface PositionAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  selectedPlayers: string[];
  onAssignmentsChange: (assignments: PlayerAssignment[]) => void;
  formation?: any;
}

function PositionAssignmentModal({ 
  isOpen, 
  onClose, 
  players, 
  selectedPlayers, 
  onAssignmentsChange,
  formation 
}: PositionAssignmentModalProps) {
  const [assignments, setAssignments] = useState<PlayerAssignment[]>([]);

  // Standard 9-a-side positions
  const positions = [
    'Goalkeeper',
    'Centre Back',
    'Left Back', 
    'Right Back',
    'Defensive Mid',
    'Central Mid',
    'Left Wing',
    'Right Wing',
    'Centre Forward'
  ];

  useEffect(() => {
    if (isOpen && selectedPlayers.length > 0) {
      // Initialize assignments for field players (max 9)
      const fieldPlayers = selectedPlayers.slice(0, 9);
      const bench = selectedPlayers.slice(9);
      
      const initialAssignments: PlayerAssignment[] = fieldPlayers.map((playerId, index) => ({
        playerId,
        position: positions[index] || `Position ${index + 1}`,
        isBench: false
      }));

      // Add bench players
      bench.forEach(playerId => {
        initialAssignments.push({
          playerId,
          position: 'Substitute',
          isBench: true
        });
      });

      setAssignments(initialAssignments);
    }
  }, [isOpen, selectedPlayers]);

  const updatePlayerPosition = (playerId: string, newPosition: string) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.playerId === playerId 
        ? { ...assignment, position: newPosition }
        : assignment
    ));
  };

  const togglePlayerBench = (playerId: string) => {
    setAssignments(prev => prev.map(assignment => {
      if (assignment.playerId === playerId) {
        const newIsBench = !assignment.isBench;
        return {
          ...assignment,
          isBench: newIsBench,
          position: newIsBench ? 'Substitute' : 'Goalkeeper' // Default position when moving to field
        };
      }
      return assignment;
    }));
  };

  const handleConfirm = () => {
    onAssignmentsChange(assignments);
    onClose();
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.name} ${player.shirtNo ? `#${player.shirtNo}` : ''}` : 'Unknown';
  };

  if (!isOpen) return null;

  const startingEleven = assignments.filter(a => !a.isBench);
  const substitutes = assignments.filter(a => a.isBench);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-6 w-6" />
          Assign Player Positions
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Selected Players */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Selected Players ({startingEleven.length})
            </h3>
            <div className="space-y-3">
              {startingEleven.map((assignment) => (
                <div key={assignment.playerId} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getPlayerName(assignment.playerId)}
                    </p>
                    <select
                      value={assignment.position}
                      onChange={(e) => updatePlayerPosition(assignment.playerId, e.target.value)}
                      className="mt-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {positions.map(position => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => togglePlayerBench(assignment.playerId)}
                    className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Move to Bench
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bench */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Bench ({substitutes.length})
            </h3>
            <div className="space-y-3">
              {substitutes.length === 0 ? (
                <p className="text-gray-500 text-sm">No players on bench</p>
              ) : (
                substitutes.map((assignment) => (
                  <div key={assignment.playerId} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {getPlayerName(assignment.playerId)}
                      </p>
                      <p className="text-sm text-gray-600">Substitute</p>
                    </div>
                    {startingEleven.length < 9 && (
                      <button
                        onClick={() => togglePlayerBench(assignment.playerId)}
                        className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        Move to Field
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
  onSubmit: (matchData: { date: string; opponent: string; homeAway: 'home' | 'away' }) => void;
  isLoading: boolean;
}

function EditMatchModal({ isOpen, onClose, match, onSubmit, isLoading }: EditMatchModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    opponent: '',
    homeAway: 'home' as 'home' | 'away'
  });

  useEffect(() => {
    if (isOpen && match) {
      // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
      const matchDate = new Date(match.date);
      const formattedDate = matchDate.toISOString().slice(0, 16);
      
      setFormData({
        date: formattedDate,
        opponent: match.opponent,
        homeAway: match.homeAway
      });
    }
  }, [isOpen, match]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.opponent.trim()) {
      // Convert to ISO string for API
      const isoDate = new Date(formData.date).toISOString();
      onSubmit({
        date: isoDate,
        opponent: formData.opponent.trim(),
        homeAway: formData.homeAway
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PencilIcon className="h-6 w-6 text-blue-500" />
          Edit Match Details
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="opponent" className="block text-sm font-medium text-gray-700 mb-2">
              Opponent
            </label>
            <input
              type="text"
              id="opponent"
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Arsenal FC"
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
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="homeAway" className="block text-sm font-medium text-gray-700 mb-2">
              Venue
            </label>
            <select
              id="homeAway"
              value={formData.homeAway}
              onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as 'home' | 'away' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="home">Home</option>
              <option value="away">Away</option>
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
              disabled={isLoading || !formData.opponent.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlanningPage() {
  const { teamId, seasonId, matchId } = useParams<{ 
    teamId: string; 
    seasonId: string; 
    matchId: string; 
  }>();
  
  const { currentMatch, isLoading, error, getMatch, updateMatch, clearError, getFormations, createFormation, deleteFormation, updateMatchPlan, savePlayerAssignments } = useSeasonStore();
  const { currentTeam, players, selectTeam, fetchPlayers } = useTeamStore();
  const [formations, setFormations] = useState<any[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [playerAssignments, setPlayerAssignments] = useState<PlayerAssignment[]>([]);
  const [isFormationModalOpen, setIsFormationModalOpen] = useState(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formationToDelete, setFormationToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditMatchModalOpen, setIsEditMatchModalOpen] = useState(false);
  
  // Match plan state
  const [matchNotes, setMatchNotes] = useState<string>('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [opponentInfo, setOpponentInfo] = useState<Record<string, any>>({});
  
  // Time-based planning state
  const [planningInterval, setPlanningInterval] = useState<PlanningInterval>('quarters');
  const [blockAssignments, setBlockAssignments] = useState<Record<number, Assignment[]>>({});
  const [blockFormations, setBlockFormations] = useState<Record<number, string>>({});
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0); // Will be used for editing specific blocks
  
  // Warning dialog state for interval changes
  const [isIntervalWarningOpen, setIsIntervalWarningOpen] = useState(false);
  const [pendingInterval, setPendingInterval] = useState<PlanningInterval | null>(null);

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
      loadFormations();
    }
  }, [currentTeam]);

  // Load existing match plan data and player assignments when match loads
  useEffect(() => {
    if (currentMatch) {
      // Load existing player assignments from all blocks (not just first block)
      if (currentMatch.blocks && currentMatch.blocks.length > 0) {
        // Collect all unique player IDs from all blocks
        const allAssignedPlayerIds = new Set<string>();
        
        currentMatch.blocks.forEach(block => {
          if (block.assignments) {
            block.assignments.forEach(assignment => {
              allAssignedPlayerIds.add(assignment.playerId);
            });
          }
        });
        
        setSelectedPlayers(Array.from(allAssignedPlayerIds));
        console.log('Loaded players from blocks:', Array.from(allAssignedPlayerIds));
      }
      
      // Load existing match plan data
      if (currentMatch.plan) {
        setMatchNotes(currentMatch.plan.notes || '');
        // Parse objectivesJSON if it's a string, otherwise use as-is
        try {
          if (currentMatch.plan?.objectivesJSON) {
            const objectivesData = currentMatch.plan.objectivesJSON;
            const parsedObjectives = typeof objectivesData === 'string'
              ? JSON.parse(objectivesData)
              : objectivesData;
            setObjectives(Array.isArray(parsedObjectives) && parsedObjectives.length > 0 ? parsedObjectives : ['']);
          } else {
            setObjectives(['']);
          }
        } catch (error) {
          console.error('Error parsing objectivesJSON:', error);
          setObjectives(['']);
        }
        // Parse opponentInfoJSON if it's a string, otherwise use as-is
        try {
          const opponentInfoData = currentMatch.plan.opponentInfoJSON || {};
          const parsedOpponentInfo = typeof opponentInfoData === 'string' 
            ? JSON.parse(opponentInfoData)
            : opponentInfoData;
          setOpponentInfo(parsedOpponentInfo);
        } catch (error) {
          console.error('Error parsing opponentInfoJSON:', error);
          setOpponentInfo({});
        }
        
        // Set selected formation if it exists in the plan
        if (currentMatch.plan.formationId) {
          // We'll need to find the formation in the loaded formations
          // This will be handled when formations are loaded
        }
      }
    }
  }, [currentMatch]);

  const loadPlayers = async () => {
    if (!currentTeam) return;
    try {
      await fetchPlayers(currentTeam.id);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  };

  const loadFormations = async () => {
    try {
      const response = await getFormations();
      setFormations(response.formations || []);
      
      // Set formation from match plan if it exists, otherwise use first formation
      if (currentMatch?.plan?.formationId && response.formations) {
        const savedFormation = response.formations.find(f => f.id === currentMatch.plan.formationId);
        setSelectedFormation(savedFormation || response.formations[0]);
      } else if (response.formations && response.formations.length > 0) {
        setSelectedFormation(response.formations[0]);
      }
    } catch (error) {
      console.error('Failed to load formations:', error);
    }
  };

  const handleCreateFormation = async (formationData: { name: string; shapeJSON: any }) => {
    if (!currentTeam) return;
    try {
      await createFormation(formationData, currentTeam.id);
      setIsFormationModalOpen(false);
      loadFormations();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeleteFormation = (formation: any) => {
    setFormationToDelete(formation);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Time-based planning handlers
  const handleIntervalChange = (newInterval: PlanningInterval) => {
    // Check if there are any existing block assignments
    const hasAssignments = Object.keys(blockAssignments).some(
      blockIndex => blockAssignments[parseInt(blockIndex)]?.length > 0
    );

    if (hasAssignments) {
      // Show warning dialog if there are existing assignments
      setPendingInterval(newInterval);
      setIsIntervalWarningOpen(true);
    } else {
      // No assignments, safe to change immediately
      setPlanningInterval(newInterval);
      setCurrentBlockIndex(0);
    }
  };

  const handleConfirmIntervalChange = () => {
    if (pendingInterval) {
      setPlanningInterval(pendingInterval);
      // Clear current assignments when changing interval to avoid confusion
      setBlockAssignments({});
      setCurrentBlockIndex(0);
      setPendingInterval(null);
    }
    setIsIntervalWarningOpen(false);
  };

  const handleCancelIntervalChange = () => {
    setPendingInterval(null);
    setIsIntervalWarningOpen(false);
  };

  const handleBlockAssignmentsChange = (blockIndex: number, assignments: Assignment[]) => {
    setBlockAssignments(prev => ({
      ...prev,
      [blockIndex]: assignments
    }));
  };

  const handleBlockFormationChange = (blockIndex: number, formationId: string) => {
    setBlockFormations(prev => ({
      ...prev,
      [blockIndex]: formationId
    }));
  };

  const handleSaveBlocks = async (blockAssignments: Record<number, Assignment[]>) => {
    if (!currentMatch) {
      throw new Error('No match selected');
    }

    const config = createTimeBlockConfig(planningInterval);
    
    // Transform blockAssignments to API format
    const blocks = config.blocks.map(blockConfig => ({
      index: blockConfig.index,
      startMin: blockConfig.startMin,
      endMin: blockConfig.endMin,
      assignments: (blockAssignments[blockConfig.index] || []).map(assignment => ({
        playerId: assignment.playerId,
        position: assignment.position,
        isBench: assignment.isBench
      }))
    }));

    await seasonService.saveBlocks(currentMatch.id, blocks);
  };

  // Initialize block assignments when planning interval changes
  useEffect(() => {
    if (currentMatch && players.length > 0) {
      const config = createTimeBlockConfig(planningInterval);
      const newBlockAssignments: Record<number, Assignment[]> = {};
      
      console.log('Loading block assignments for match:', currentMatch.id);
      console.log('Current match blocks:', currentMatch.blocks);
      
      // Load existing block assignments if they exist, otherwise initialize as empty
      if (currentMatch.blocks && currentMatch.blocks.length > 0) {
        console.log('Loading existing blocks from database, count:', currentMatch.blocks.length);
        // Load existing blocks from database
        for (let i = 0; i < config.blocks.length; i++) {
          const existingBlock = currentMatch.blocks.find(block => block.index === i);
          if (existingBlock && existingBlock.assignments && existingBlock.assignments.length > 0) {
            console.log(`Loading block ${i} with ${existingBlock.assignments.length} assignments`);
            newBlockAssignments[i] = existingBlock.assignments.map(assignment => ({
              playerId: assignment.playerId,
              player: players.find(p => p.id === assignment.playerId)!,
              position: assignment.position,
              isBench: assignment.isBench
            })).filter(assignment => assignment.player); // Filter out any assignments where player wasn't found
          } else {
            newBlockAssignments[i] = [];
          }
        }
      } else {
        console.log('No existing blocks found, initializing empty blocks');
        // Initialize all blocks as empty for tactics board functionality
        // Users will drag players from Available Players to assign them
        for (let i = 0; i < config.blocks.length; i++) {
          newBlockAssignments[i] = [];
        }
      }
      
      console.log('Final block assignments:', newBlockAssignments);
      setBlockAssignments(newBlockAssignments);
    }
  }, [planningInterval, currentMatch?.id, players.length]);

  const confirmDeleteFormation = async () => {
    if (formationToDelete) {
      try {
        await deleteFormation(formationToDelete.id);
        setIsDeleteModalOpen(false);
        setFormationToDelete(null);
        setDeleteError(null);
        
        // If the deleted formation was selected, clear selection
        if (selectedFormation?.id === formationToDelete.id) {
          setSelectedFormation(null);
        }
        
        loadFormations();
      } catch (error) {
        // Handle error locally in the modal instead of global store error
        setDeleteError(error instanceof Error ? error.message : 'Failed to delete formation');
      }
    }
  };

  const handleUpdateMatch = async (matchData: { date: string; opponent: string; homeAway: 'home' | 'away' }) => {
    if (!matchId) return;
    try {
      await updateMatch(matchId, matchData);
      setIsEditMatchModalOpen(false);
    } catch (error) {
      // Error handled by store
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSelectedPlayerDetails = () => {
    return selectedPlayers.map(playerId => 
      players.find(p => p.id === playerId)
    ).filter(Boolean);
  };

  const addObjective = () => {
    setObjectives([...objectives, '']);
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSaveMatchPlan = async () => {
    if (!matchId) return;
    
    try {
      // Save match plan data
      const planData: any = {
        notes: matchNotes,
        objectivesJSON: objectives.filter(obj => obj.trim() !== ''),
        opponentInfoJSON: opponentInfo
      };
      
      // Only include formationId if it's defined
      if (selectedFormation?.id) {
        planData.formationId = selectedFormation.id;
      }
      
      await updateMatchPlan(matchId, planData);
      
      // Save player assignments with positions
      const assignments = playerAssignments.length > 0 
        ? playerAssignments 
        : selectedPlayers.map((playerId, index) => ({
            playerId,
            position: `pos-${index + 1}`,
            isBench: false
          }));
      
      await savePlayerAssignments(matchId, assignments);
      
      // Also save the time blocks to preserve block assignments
      await handleSaveBlocks(blockAssignments);
    } catch (error) {
      // Error is handled by the store
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`} className="text-blue-600 hover:text-blue-800">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Match Planning: vs {currentMatch.opponent}
                </h1>
                <p className="text-gray-600">
                  {formatDate(currentMatch.date)} • {currentMatch.homeAway === 'home' ? 'Home Ground' : 'Away Ground'}
                </p>
              </div>
              <button
                onClick={() => setIsEditMatchModalOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit match details"
                aria-label="Edit match details"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveMatchPlan}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <DocumentTextIcon className="h-5 w-5" />
          {isLoading ? 'Saving...' : 'Save Plan'}
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

      {/* Main Planning Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formation Selection */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Formation</h2>
              <button
                onClick={() => setIsFormationModalOpen(true)}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {formations.length > 0 ? (
              <div className="space-y-3">
                {formations.map((formation) => (
                  <div
                    key={formation.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedFormation?.id === formation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        onClick={() => setSelectedFormation(formation)}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Squares2X2Icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{formation.name}</p>
                          <p className="text-sm text-gray-600">
                            {formation.shapeJSON?.formation || 'Custom'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Only show delete button for non-preset formations */}
                      {!formation.isPreset && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFormation(formation);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete formation"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Squares2X2Icon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No formations created yet</p>
                <button
                  onClick={() => setIsFormationModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Create Formation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Team Selection */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Selected Players ({selectedPlayers.length})
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlayerModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  Select Players
                </button>
                {selectedPlayers.length > 0 && (
                  <button
                    onClick={() => setIsPositionModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                    Assign Positions
                  </button>
                )}
              </div>
            </div>

            {playerAssignments.length > 0 ? (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Field Players */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Selected Players</h3>
                    {playerAssignments.filter(a => !a.isBench).map((assignment) => {
                      const player = players.find(p => p.id === assignment.playerId);
                      return (
                        <div key={assignment.playerId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                              {player?.shirtNo || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{player?.name}</p>
                              <p className="text-sm text-green-700 font-medium">{assignment.position}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPlayers(selectedPlayers.filter(id => id !== assignment.playerId));
                              setPlayerAssignments(playerAssignments.filter(a => a.playerId !== assignment.playerId));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Bench Players */}
                  {playerAssignments.some(a => a.isBench) && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Bench</h3>
                      {playerAssignments.filter(a => a.isBench).map((assignment) => {
                        const player = players.find(p => p.id === assignment.playerId);
                        return (
                          <div key={assignment.playerId} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">
                                {player?.shirtNo || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{player?.name}</p>
                                <p className="text-sm text-yellow-700 font-medium">{assignment.position}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedPlayers(selectedPlayers.filter(id => id !== assignment.playerId));
                                setPlayerAssignments(playerAssignments.filter(a => a.playerId !== assignment.playerId));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedPlayers.length > 0 ? (
              <div className="space-y-3">
                {getSelectedPlayerDetails().map((player, index) => (
                  <div key={player?.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                        #{player?.jerseyNumber}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{player?.name}</p>
                        <p className="text-sm text-gray-600">
                          {player?.preferredPositions?.join(', ') || player?.position}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlayers(selectedPlayers.filter(id => id !== player?.id))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players selected</h3>
                <p className="text-gray-500 mb-6">Select players for your starting nine</p>
                <button
                  onClick={() => setIsPlayerModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  Select Players
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time-based Planning Section */}
      {selectedPlayers.length > 0 && (
        <div className="space-y-6">
          {/* Time Block Selector */}
          <TimeBlockSelector
            interval={planningInterval}
            onIntervalChange={handleIntervalChange}
          />

          {/* Time Block Planner */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <TimeBlockPlanner
                interval={planningInterval}
                players={players}
                blockAssignments={blockAssignments}
                onBlockAssignmentsChange={handleBlockAssignmentsChange}
                onSaveBlocks={handleSaveBlocks}
                formations={formations}
                blockFormations={blockFormations}
                onBlockFormationChange={handleBlockFormationChange}
              />
            </div>

            {/* Substitution Analysis */}
            <div>
              <SubstitutionPlan
                substitutions={analyzeAllSubstitutions(
                  Object.entries(blockAssignments).map(([index, assignments]) => ({
                    index: parseInt(index),
                    assignments
                  })),
                  players
                )}
                interval={planningInterval}
              />
            </div>
          </div>
        </div>
      )}

      {/* Match Plan */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Match Plan</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Match Notes</h3>
            <textarea
              value={matchNotes}
              onChange={(e) => setMatchNotes(e.target.value)}
              placeholder="Enter your match strategy, key points, and tactical notes..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Team Objectives */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Team Objectives</h3>
              <button
                onClick={addObjective}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add Objective
              </button>
            </div>
            
            <div className="space-y-3">
              {objectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    placeholder={`Objective ${index + 1}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {objectives.length > 1 && (
                    <button
                      onClick={() => removeObjective(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Match Information Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Match Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Opposition:</span>
              <p className="font-medium">{currentMatch.opponent}</p>
            </div>
            <div>
              <span className="text-gray-500">Venue:</span>
              <p className="font-medium">{currentMatch.homeAway === 'home' ? 'Home Ground' : 'Away Ground'}</p>
            </div>
            <div>
              <span className="text-gray-500">Formation:</span>
              <p className="font-medium">{selectedFormation?.shapeJSON?.formation || 'Not selected'}</p>
            </div>
            <div>
              <span className="text-gray-500">Squad Size:</span>
              <p className="font-medium">{players.length} players available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateFormationModal
        isOpen={isFormationModalOpen}
        onClose={() => setIsFormationModalOpen(false)}
        onSubmit={handleCreateFormation}
        isLoading={isLoading}
      />

      <PlayerSelectionModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        players={players}
        selectedPlayers={selectedPlayers}
        onSelectionChange={setSelectedPlayers}
      />

      <PositionAssignmentModal
        isOpen={isPositionModalOpen}
        onClose={() => setIsPositionModalOpen(false)}
        players={players}
        selectedPlayers={selectedPlayers}
        onAssignmentsChange={setPlayerAssignments}
        formation={selectedFormation}
      />

      <EditMatchModal
        isOpen={isEditMatchModalOpen}
        onClose={() => setIsEditMatchModalOpen(false)}
        match={currentMatch}
        onSubmit={handleUpdateMatch}
        isLoading={isLoading}
      />

      {/* Delete Formation Confirmation Modal */}
      {isDeleteModalOpen && formationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrashIcon className="h-6 w-6 text-red-500" />
              Delete Formation
            </h2>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the formation <strong>"{formationToDelete.name}"</strong>? 
              This action cannot be undone.
            </p>
            
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{deleteError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setFormationToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFormation}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interval Change Warning Modal */}
      {isIntervalWarningOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Change Planning Intervals
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                You have existing player assignments for the current time blocks. 
                Changing from <strong>{planningInterval}</strong> to <strong>{pendingInterval}</strong> will clear all current assignments.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 text-sm font-medium">
                  ⚠️ This action cannot be undone. All tactical plans for the current interval will be lost.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelIntervalChange}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Keep Current ({planningInterval})
              </button>
              <button
                onClick={handleConfirmIntervalChange}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear & Change to {pendingInterval}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanningPage;