import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSeasonStore } from '../stores/seasonStore';
import { useTeamStore } from '../stores/teamStore';
import { TacticsBoard } from '../components/match/TacticsBoard';
import { 
  ArrowLeftIcon,
  PlusIcon,
  StopIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Match, Block, Assignment, Player } from '../types';

interface QuickGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: { playerId: string; minute: number; notes: string }) => void;
  isLoading: boolean;
  players: Player[];
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Goal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="player" className="block text-sm font-medium text-gray-700 mb-2">
              Scorer
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
                  {player.name} {player.shirtNo ? `- #${player.shirtNo}` : ''}
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
  players: Player[];
  currentMinute: number;
  currentLineup: Assignment[];
  benchPlayers: Assignment[];
}

function QuickSubModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  players, 
  currentMinute, 
  currentLineup, 
  benchPlayers 
}: QuickSubModalProps) {
  const [subData, setSubData] = useState({
    minute: currentMinute.toString(),
    offPlayerId: '',
    onPlayerId: '',
    position: ''
  });

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

  const onFieldPlayers = currentLineup.map(a => players.find(p => p.id === a.playerId)).filter(Boolean) as Player[];
  const benchPlayersList = benchPlayers.map(a => players.find(p => p.id === a.playerId)).filter(Boolean) as Player[];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Make Substitution</h2>
        
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
              onChange={(e) => {
                const playerId = e.target.value;
                const assignment = currentLineup.find(a => a.playerId === playerId);
                setSubData({ 
                  ...subData, 
                  offPlayerId: playerId,
                  position: assignment?.position || ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">Select player</option>
              {onFieldPlayers.map((player) => {
                const assignment = currentLineup.find(a => a.playerId === player.id);
                return (
                  <option key={player.id} value={player.id}>
                    {player.name} {player.shirtNo ? `#${player.shirtNo}` : ''} - {assignment?.position}
                  </option>
                );
              })}
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
              disabled={isLoading || !subData.offPlayerId}
              required
            >
              <option value="">Select player</option>
              {benchPlayersList.filter(p => p.id !== subData.offPlayerId).map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} {player.shirtNo ? `#${player.shirtNo}` : ''}
                </option>
              ))}
            </select>
          </div>

          {subData.position && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                {subData.position}
              </div>
            </div>
          )}
          
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

interface QuickOppositionGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: { minute: number; notes: string }) => void;
  isLoading: boolean;
  currentMinute: number;
}

function QuickOppositionGoalModal({ isOpen, onClose, onSubmit, isLoading, currentMinute }: QuickOppositionGoalModalProps) {
  const [goalData, setGoalData] = useState({
    minute: currentMinute.toString(),
    notes: ''
  });

  useEffect(() => {
    setGoalData(prev => ({ ...prev, minute: currentMinute.toString() }));
  }, [currentMinute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalData.minute) {
      onSubmit({
        minute: parseInt(goalData.minute),
        notes: goalData.notes
      });
      setGoalData({ minute: currentMinute.toString(), notes: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Record Opposition Goal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-2">
              Minute
            </label>
            <input
              type="number"
              id="minute"
              value={goalData.minute}
              onChange={(e) => setGoalData({ ...goalData, minute: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g., Free kick, Counter attack"
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
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={isLoading || !goalData.minute}
            >
              {isLoading ? 'Recording...' : 'Record Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formation detection from assignments
function detectFormationFromAssignments(assignments: Assignment[]): string {
  if (!assignments || assignments.length === 0) {
    return '3-2-3'; // Default formation
  }

  // Count players by position type with detailed logging
  const positionDetails: { position: string; category: string }[] = [];
  const positionCounts = assignments.reduce((counts, assignment) => {
    if (assignment.isBench) return counts; // Ignore bench players
    
    const position = assignment.position.toLowerCase();
    let category = 'unknown';
    
    // Improved categorization logic
    if (position.includes('goalkeeper') || position.includes('gk')) {
      counts.goalkeeper++;
      category = 'goalkeeper';
    } else if (position.includes('back') || position.includes('defender') || 
               position.includes('centre back') || position.includes('center back')) {
      counts.defense++;
      category = 'defense';
    } else if (position.includes('mid') && !position.includes('wing')) {
      // Midfielders but not wingers
      counts.midfield++;
      category = 'midfield';
    } else if (position.includes('wing') || position.includes('winger')) {
      // Wings can be midfield or attack depending on context
      if (position.includes('mid') || position.includes('back')) {
        counts.midfield++;
        category = 'midfield';
      } else {
        counts.attack++;
        category = 'attack';
      }
    } else if (position.includes('forward') || position.includes('striker') || 
               position.includes('centre forward') || position.includes('center forward')) {
      counts.attack++;
      category = 'attack';
    } else {
      // Default unknown positions to midfield
      counts.midfield++;
      category = 'midfield (default)';
    }
    
    positionDetails.push({ position: assignment.position, category });
    return counts;
  }, { goalkeeper: 0, defense: 0, midfield: 0, attack: 0 });

  // Determine formation based on counts (excluding goalkeeper)
  const formationString = `${positionCounts.defense}-${positionCounts.midfield}-${positionCounts.attack}`;
  
  console.log('Formation Detection Debug:', {
    totalAssignments: assignments.length,
    onFieldPlayers: assignments.filter(a => !a.isBench).length,
    positionDetails,
    counts: positionCounts,
    detectedFormation: formationString
  });
  
  // Map to actually available formations (remove 3-4-1 if not defined for this team)
  const availableFormations = ['3-2-3', '3-3-2', '2-4-2', '2-3-3'];
  
  if (availableFormations.includes(formationString)) {
    return formationString;
  }
  
  console.warn('Formation not found in available list:', formationString, 'Available:', availableFormations);
  
  // Fallback to closest match or default
  return '3-2-3';
}

function LiveMatchPage() {
  const { teamId, seasonId, matchId } = useParams<{ 
    teamId: string; 
    seasonId: string; 
    matchId: string; 
  }>();
  
  const navigate = useNavigate();
  const { currentMatch, isLoading, error, getMatch, clearError, startMatch, stopMatch, scoreGoal, makeSubstitution } = useSeasonStore();
  const { currentTeam, players, selectTeam, fetchPlayers } = useTeamStore();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isOppositionGoalModalOpen, setIsOppositionGoalModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [currentSecond, setCurrentSecond] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [isHalfTime, setIsHalfTime] = useState(false);
  const [nameDisplay, setNameDisplay] = useState<'initials' | 'first' | 'last'>('first');
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0); // Track current block manually
  const [testMode, setTestMode] = useState(false); // Track if we're using test controls

  useEffect(() => {
    if (matchId) {
      getMatch(matchId);
    }
    if (teamId && (!currentTeam || currentTeam.id !== teamId)) {
      selectTeam(teamId);
      if (teamId) {
        fetchPlayers(teamId);
      }
    }
  }, [matchId, teamId, getMatch, selectTeam, currentTeam, fetchPlayers]);

  // Calculate current match minute and seconds and update every second
  useEffect(() => {
    if (currentMatch?.startedAt && currentMatch.isLive && !isHalfTime && !testMode) {
      const startTime = new Date(currentMatch.startedAt).getTime();
      const updateTime = () => {
        const now = Date.now();
        const diffSeconds = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(diffSeconds / 60);
        const seconds = diffSeconds % 60;
        
        setCurrentMinute(Math.min(90, Math.max(0, minutes)));
        setCurrentSecond(Math.max(0, seconds));
      };

      updateTime();
      const interval = setInterval(updateTime, 1000); // Update every second

      return () => clearInterval(interval);
    } else if (currentMatch) {
      setCurrentMinute(currentMatch.currentMinute || 0);
      setCurrentSecond(0);
    }
  }, [currentMatch, isHalfTime, testMode]);

  // Calculate scores
  useEffect(() => {
    if (currentMatch?.goals) {
      const teamGoals = currentMatch.goals.filter(g => !g.isOpposition).length;
      const oppositionGoals = currentMatch.goals.filter(g => g.isOpposition).length;
      
      if (currentMatch.homeAway === 'home') {
        setHomeScore(teamGoals);
        setAwayScore(oppositionGoals);
      } else {
        setHomeScore(oppositionGoals);
        setAwayScore(teamGoals);
      }
    }
  }, [currentMatch]);

  // Get current block based on manual block index (not automatic time-based)
  const currentBlock = useMemo(() => {
    if (!currentMatch?.blocks || currentMatch.blocks.length === 0) {
      return null;
    }
    
    // Use manual block index, bounded by available blocks
    const safeIndex = Math.min(currentBlockIndex, currentMatch.blocks.length - 1);
    return currentMatch.blocks[safeIndex];
  }, [currentMatch, currentBlockIndex]);

  // Get current assignments
  const currentAssignments = useMemo(() => {
    if (currentBlock?.assignments) {
      return currentBlock.assignments;
    }
    // Fallback: create default assignments if no planning exists
    if (players.length > 0 && (!currentMatch?.blocks || currentMatch.blocks.length === 0)) {
      // Simple auto-assignment for first 9 players
      const defaultPositions = [
        'Goalkeeper',
        'Right Back',
        'Centre Back',
        'Left Back',
        'Right Midfielder',
        'Central Midfielder',
        'Left Midfielder',
        'Right Winger',
        'Striker'
      ];
      
      const fallbackAssignments = players.slice(0, 9).map((player, index) => ({
        id: `temp-${index}`,
        blockId: 'temp-block',
        playerId: player.id,
        position: defaultPositions[index] || 'Midfielder',
        isBench: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      return fallbackAssignments;
    }
    return [];
  }, [currentBlock, players, currentMatch]);

  // Get bench players
  const benchAssignments = useMemo(() => {
    if (currentBlock?.assignments) {
      return currentBlock.assignments.filter(a => a.isBench);
    }
    // Fallback bench
    if (players.length > 9) {
      return players.slice(9).map((player, index) => ({
        id: `bench-${index}`,
        blockId: 'temp-block',
        playerId: player.id,
        position: 'Substitute',
        isBench: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }
    return [];
  }, [currentBlock, players]);

  // Get planned formation from current block
  const currentFormationName = useMemo(() => {
    if (currentBlock?.formation) {
      console.log('Using planned formation for block:', {
        blockIndex: currentBlock.index,
        plannedFormation: currentBlock.formation.name
      });
      return currentBlock.formation.name;
    }
    // Fallback to detecting from assignments if no formation is planned
    const detectedFormation = detectFormationFromAssignments(currentAssignments || []);
    console.log('No planned formation for block, using detected:', {
      blockIndex: currentBlock?.index,
      detectedFormation,
      assignmentCount: currentAssignments?.length
    });
    return detectedFormation;
  }, [currentBlock, currentAssignments]);

  // Create formation object for TacticsBoard
  const currentFormation = useMemo(() => {
    return {
      id: `formation-${currentFormationName}`,
      name: currentFormationName,
      shapeJSON: { formation: currentFormationName },
      isPreset: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [currentFormationName]);

  // Calculate time on pitch for each player
  const playerTimeOnPitch = useMemo(() => {
    if (!currentMatch?.blocks || !currentMatch.substitutions) {
      return {};
    }

    const timeMap: Record<string, number> = {};
    const currentTime = currentMinute + (currentSecond / 60);

    // For each player, calculate their total time on pitch
    players.forEach(player => {
      let totalTime = 0;
      let isCurrentlyOnPitch = false;

      // Check each time block to see when player was on/off pitch
      currentMatch.blocks.forEach((block, blockIdx) => {
        if (blockIdx > currentBlockIndex) return; // Don't count future blocks

        const blockStart = block.startMin;
        const blockEnd = blockIdx < currentBlockIndex ? block.endMin : currentTime; // Current block uses current time

        // Check if player was assigned in this block (not on bench)
        const assignment = block.assignments.find(a => a.playerId === player.id && !a.isBench);
        
        if (assignment) {
          // Player was on pitch for this block
          let blockTime = Math.max(0, blockEnd - blockStart);
          
          // Check for substitutions within this block
          const subsInBlock = currentMatch.substitutions.filter(sub => 
            sub.minute >= blockStart && sub.minute <= blockEnd
          );

          // Adjust time based on substitutions
          subsInBlock.forEach(sub => {
            if (sub.offPlayerId === player.id && sub.minute <= blockEnd) {
              // Player was subbed off
              blockTime = Math.max(0, sub.minute - blockStart);
            } else if (sub.onPlayerId === player.id && sub.minute >= blockStart) {
              // Player was subbed on
              blockTime = Math.max(0, blockEnd - sub.minute);
            }
          });

          totalTime += blockTime;
          
          if (blockIdx === currentBlockIndex) {
            isCurrentlyOnPitch = true;
          }
        }
      });

      timeMap[player.id] = totalTime;
    });

    return timeMap;
  }, [currentMatch, players, currentBlockIndex, currentMinute, currentSecond]);

  // Get next planned substitutions
  const nextSubstitutions = useMemo(() => {
    if (!currentMatch?.blocks || currentMatch.blocks.length <= 1 || currentBlockIndex >= currentMatch.blocks.length - 1) {
      return null;
    }

    const nextBlock = currentMatch.blocks[currentBlockIndex + 1];
    const currentLineupIds = currentAssignments.filter(a => !a.isBench).map(a => a.playerId);
    const nextLineupIds = nextBlock.assignments.filter(a => !a.isBench).map(a => a.playerId);
    
    const playersComingOff = currentLineupIds.filter(id => !nextLineupIds.includes(id));
    const playersComingOn = nextLineupIds.filter(id => !currentLineupIds.includes(id));
    
    if (playersComingOff.length === 0) {
      return null;
    }

    return {
      minute: nextBlock.startMin,
      playersOff: playersComingOff.map(id => players.find(p => p.id === id)).filter(Boolean),
      playersOn: playersComingOn.map(id => players.find(p => p.id === id)).filter(Boolean),
      timeUntil: Math.max(0, nextBlock.startMin - currentMinute),
      timeUntilSeconds: Math.max(0, (nextBlock.startMin * 60) - (currentMinute * 60 + currentSecond)),
      canConfirm: (nextBlock.startMin * 60 - (currentMinute * 60 + currentSecond)) <= 60 && currentMatch.isLive // T-1 minute
    };
  }, [currentMatch, currentBlockIndex, currentAssignments, players, currentMinute, currentSecond]);

  // Get current match phase for button display
  const getMatchPhase = () => {
    if (!currentMatch.isLive) {
      return 'not_started'; // Show "Start Match"
    } else if (isHalfTime) {
      return 'half_time'; // Show "Start Second Half"  
    } else if (currentMinute < 45) {
      return 'first_half'; // Show "Half Time"
    } else if (currentMinute >= 45) {
      return 'second_half'; // Show "End Match"
    }
    return 'not_started';
  };

  const handleMatchAction = async () => {
    if (!matchId) return;
    
    const phase = getMatchPhase();
    
    switch (phase) {
      case 'not_started':
        // Start the match
        try {
          await startMatch(matchId);
          setIsHalfTime(false);
        } catch (error) {
          // Error handled by store
        }
        break;
        
      case 'first_half':
        // Go to half time (pause the match)
        setIsHalfTime(true);
        break;
        
      case 'half_time':
        // Resume for second half
        setIsHalfTime(false);
        break;
        
      case 'second_half':
        // End the match
        if (confirm('Are you sure you want to end this match?')) {
          try {
            await stopMatch(matchId);
            navigate(`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`);
          } catch (error) {
            // Error handled by store
          }
        }
        break;
    }
  };

  const getMatchButtonText = () => {
    const phase = getMatchPhase();
    switch (phase) {
      case 'not_started': return 'Start Match';
      case 'first_half': return 'Half Time';
      case 'half_time': return 'Start Second Half';
      case 'second_half': return 'End Match';
      default: return 'Start Match';
    }
  };

  const getMatchButtonColor = () => {
    const phase = getMatchPhase();
    switch (phase) {
      case 'not_started': return 'bg-green-600 hover:bg-green-700';
      case 'first_half': return 'bg-orange-600 hover:bg-orange-700';
      case 'half_time': return 'bg-green-600 hover:bg-green-700';
      case 'second_half': return 'bg-red-600 hover:bg-red-700';
      default: return 'bg-green-600 hover:bg-green-700';
    }
  };

  const getMatchButtonIcon = () => {
    const phase = getMatchPhase();
    switch (phase) {
      case 'not_started': return PlayIcon;
      case 'first_half': return ClockIcon;
      case 'half_time': return PlayIcon;
      case 'second_half': return StopIcon;
      default: return PlayIcon;
    }
  };

  const handleAddGoal = async (goalData: { playerId: string; minute: number; notes: string }) => {
    if (!matchId) return;
    try {
      await scoreGoal(matchId, goalData);
      setIsGoalModalOpen(false);
      setTimeout(() => getMatch(matchId), 500);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAddOppositionGoal = async (goalData: { minute: number; notes: string }) => {
    if (!matchId) return;
    try {
      await scoreGoal(matchId, { ...goalData, isOpposition: true });
      setIsOppositionGoalModalOpen(false);
      setTimeout(() => getMatch(matchId), 500);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!matchId) return;
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        // This would need to be added to the seasonStore
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/matches/${matchId}/goals/${goalId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setTimeout(() => getMatch(matchId), 500);
        }
      } catch (error) {
        // Error handling
      }
    }
  };

  const handleAddSubstitution = async (subData: { minute: number; offPlayerId: string; onPlayerId: string; position: string }) => {
    if (!matchId) return;
    try {
      await makeSubstitution(matchId, subData);
      setIsSubModalOpen(false);
      setTimeout(() => getMatch(matchId), 500);
    } catch (error) {
      // Error handled by store
    }
  };

  const handleConfirmSubstitutions = async () => {
    if (!nextSubstitutions || !nextSubstitutions.canConfirm) {
      return;
    }

    try {
      // Automatically make all the substitutions for the block transition
      for (let i = 0; i < nextSubstitutions.playersOff.length; i++) {
        const playerOut = nextSubstitutions.playersOff[i];
        const playerIn = nextSubstitutions.playersOn[i];
        
        if (playerOut && playerIn) {
          // Find the position from the next block assignments
          const nextBlock = currentMatch.blocks![currentBlockIndex + 1];
          const nextAssignment = nextBlock.assignments.find(a => a.playerId === playerIn.id);
          
          await makeSubstitution(matchId!, {
            minute: currentMinute,
            offPlayerId: playerOut.id,
            onPlayerId: playerIn.id,
            position: nextAssignment?.position || 'Midfielder'
          });
        }
      }

      // Advance to the next block
      setCurrentBlockIndex(prev => prev + 1);
      
    } catch (error) {
      console.error('Error confirming substitutions:', error);
    }
  };

  const formatMatchTime = () => {
    const formattedSeconds = currentSecond.toString().padStart(2, '0');
    
    if (currentMinute >= 45 && currentMinute < 90) {
      return `${currentMinute}:${formattedSeconds}`;
    } else if (currentMinute >= 90) {
      const extraMinutes = currentMinute - 90;
      return `90+${extraMinutes}:${formattedSeconds}`;
    }
    return `${currentMinute}:${formattedSeconds}`;
  };

  const formatTimeUntilSub = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Now';
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds}s`;
    } else if (minutes === 1 && seconds === 0) {
      return '1 min';
    } else if (seconds === 0) {
      return `${minutes} mins`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  if (isLoading && !currentMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading match...</h2>
        </div>
      </div>
    );
  }

  if (error && !currentMatch) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate(`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`)}
            className="bg-white text-red-600 px-6 py-2 rounded-md hover:bg-gray-100"
          >
            Back to Match Details
          </button>
        </div>
      </div>
    );
  }

  if (!currentMatch) {
    return null;
  }

  const currentLineup = currentAssignments.filter(a => !a.isBench);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-20 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/teams/${teamId}/seasons/${seasonId}/matches/${matchId}`)}
                className="text-white hover:text-gray-200"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">
                  {currentTeam?.name} vs {currentMatch.opponent}
                </h1>
                <p className="text-xs sm:text-sm text-green-100">
                  {currentMatch.isLive ? 'LIVE' : 'NOT STARTED'} • {currentMatch.homeAway === 'home' ? 'Home' : 'Away'}
                  {currentMatch.venue && ` • ${currentMatch.venue}`}
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Score and Timer */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 sm:gap-8 mb-2">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-600">{currentTeam?.name}</h3>
                  <div className="text-3xl sm:text-4xl font-bold text-green-600">
                    {currentMatch.homeAway === 'home' ? homeScore : awayScore}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-400">-</div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-gray-600">{currentMatch.opponent}</h3>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-600">
                    {currentMatch.homeAway === 'home' ? awayScore : homeScore}
                  </div>
                </div>
              </div>
              
              {/* Match Control Section */}
              <div className="flex flex-col items-center gap-3 mt-4">
                {currentMatch.isLive && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900">
                      <ClockIcon className="h-5 w-5" />
                      {isHalfTime ? 'HALF TIME' : formatMatchTime()}
                    </div>
                    
                    {/* Test Time Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTestMode(true);
                          setCurrentMinute(prev => Math.min(90, prev + 1));
                        }}
                        className={`${testMode ? 'bg-blue-500' : 'bg-gray-500'} text-white px-2 py-1 rounded text-xs hover:bg-gray-600`}
                      >
                        +1 min
                      </button>
                      <button
                        onClick={() => {
                          setTestMode(true);
                          setCurrentMinute(prev => Math.min(90, prev + 5));
                        }}
                        className={`${testMode ? 'bg-blue-500' : 'bg-gray-500'} text-white px-2 py-1 rounded text-xs hover:bg-gray-600`}
                      >
                        +5 min
                      </button>
                      <button
                        onClick={() => {
                          setTestMode(false);
                          setCurrentMinute(0);
                          setCurrentSecond(0);
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Reset
                      </button>
                      {testMode && (
                        <span className="text-xs text-blue-600 font-medium">TEST MODE</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Match Control Button */}
                {(() => {
                  const ButtonIcon = getMatchButtonIcon();
                  return (
                    <button
                      onClick={handleMatchAction}
                      className={`${getMatchButtonColor()} text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 font-semibold`}
                    >
                      <ButtonIcon className="h-5 w-5" />
                      {getMatchButtonText()}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Next Substitutions Alert */}
          {nextSubstitutions && currentMatch.isLive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ArrowPathIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Next Substitution in {formatTimeUntilSub(nextSubstitutions.timeUntilSeconds)}
                    </h3>
                    {nextSubstitutions.canConfirm && (
                      <button
                        onClick={handleConfirmSubstitutions}
                        disabled={isLoading}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Confirming...' : 'Confirm Subs'}
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-yellow-700">
                    {nextSubstitutions.playersOff.map((p, i) => (
                      <div key={p?.id}>
                        Off: {p?.name} → On: {nextSubstitutions.playersOn[i]?.name || 'TBD'}
                      </div>
                    ))}
                    {nextSubstitutions.canConfirm && (
                      <div className="text-xs text-yellow-600 mt-1 font-medium">
                        ⚡ Ready to confirm (T-1 minute)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Lineup - Tactics Board */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Current Lineup</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Block:</span>
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-1 rounded">
                      {currentBlockIndex + 1} of {currentMatch?.blocks?.length || 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Formation:</span>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                      {currentFormationName}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Name Display Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Names:</span>
                <select
                  value={nameDisplay}
                  onChange={(e) => setNameDisplay(e.target.value as 'initials' | 'first' | 'last')}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="first">First</option>
                  <option value="last">Last</option>
                  <option value="initials">Initials</option>
                </select>
              </div>
            </div>
            
            <div className="w-full">
              <TacticsBoard
                players={players}
                assignments={currentAssignments}
                onAssignmentsChange={() => {}} // Read-only for live match
                readonly={true}
                formations={[currentFormation]}
                selectedFormationId={currentFormation.id}
                nameDisplay={nameDisplay}
                playerTimeOnPitch={playerTimeOnPitch}
                matchDuration={90}
              />
            </div>
          </div>

          {/* Quick Actions - Always show, but style differently if match not started */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className={`bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow ${
                !currentMatch.isLive ? 'opacity-90' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⚽</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Our Goal</span>
              </div>
            </button>

            <button
              onClick={() => setIsOppositionGoalModalOpen(true)}
              className={`bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow ${
                !currentMatch.isLive ? 'opacity-90' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">⚽</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Opposition Goal</span>
              </div>
            </button>

            <button
              onClick={() => setIsSubModalOpen(true)}
              className={`bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow ${
                !currentMatch.isLive ? 'opacity-90' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Substitute</span>
              </div>
            </button>

            <button
              className={`bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow ${
                !currentMatch.isLive ? 'opacity-90' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">📝</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Add Note</span>
              </div>
            </button>
          </div>

          {/* Bench */}
          {benchAssignments.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bench</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {benchAssignments.map(assignment => {
                  const player = players.find(p => p.id === assignment.playerId);
                  if (!player) return null;
                  
                  return (
                    <div key={assignment.id} className="bg-gray-50 rounded px-3 py-2">
                      <div className="font-medium text-sm text-gray-900">
                        {player.shirtNo && <span className="text-gray-500 mr-1">#{player.shirtNo}</span>}
                        {player.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Match Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Goals */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals</h3>
              
              {currentMatch.goals && currentMatch.goals.length > 0 ? (
                <div className="space-y-2">
                  {currentMatch.goals.map((goal: any, index: number) => {
                    const player = players.find(p => p.id === goal.playerId);
                    const isOpposition = goal.isOpposition;
                    return (
                      <div key={index} className={`flex items-center justify-between p-2 rounded ${
                        isOpposition ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚽</span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {isOpposition ? currentMatch.opponent : (player?.name || 'Unknown')}
                            </p>
                            {goal.notes && <p className="text-xs text-gray-600">{goal.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isOpposition ? 'text-red-600' : 'text-green-600'
                          }`}>{goal.minute}'</span>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete goal"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No goals scored yet</p>
              )}
            </div>

            {/* Substitutions */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Substitutions</h3>
              
              {currentMatch.substitutions && currentMatch.substitutions.length > 0 ? (
                <div className="space-y-2">
                  {currentMatch.substitutions.map((sub: any, index: number) => {
                    const offPlayer = players.find(p => p.id === sub.offPlayerId);
                    const onPlayer = players.find(p => p.id === sub.onPlayerId);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">↔</span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {onPlayer?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-600">
                              for {offPlayer?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{sub.minute}'</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No substitutions made yet</p>
              )}
            </div>
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
        currentLineup={currentLineup}
        benchPlayers={benchAssignments}
      />

      <QuickOppositionGoalModal
        isOpen={isOppositionGoalModalOpen}
        onClose={() => setIsOppositionGoalModalOpen(false)}
        onSubmit={handleAddOppositionGoal}
        isLoading={isLoading}
        currentMinute={currentMinute}
      />
    </div>
  );
}

export default LiveMatchPage;