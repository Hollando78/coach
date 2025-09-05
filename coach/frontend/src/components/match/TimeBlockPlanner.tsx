import React, { useState } from 'react';
import { PencilIcon, UserIcon, EyeIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Assignment, Player, PlanningInterval, TimeBlockConfig, Formation } from '../../types';
import { createTimeBlockConfig, formatTimeRange } from '../../utils/timeBlocks';
import { TacticsBoard } from './TacticsBoard';

interface TimeBlockPlannerProps {
  interval: PlanningInterval;
  players: Player[];
  blockAssignments: Record<number, Assignment[]>;
  onBlockAssignmentsChange: (blockIndex: number, assignments: Assignment[]) => void;
  onSaveBlocks?: (blockAssignments: Record<number, Assignment[]>) => Promise<void>;
  formations?: Formation[];
  blockFormations?: Record<number, string>; // formationId per block
  onBlockFormationChange?: (blockIndex: number, formationId: string) => void;
}

export function TimeBlockPlanner({ 
  interval, 
  players, 
  blockAssignments, 
  onBlockAssignmentsChange,
  onSaveBlocks,
  formations,
  blockFormations,
  onBlockFormationChange
}: TimeBlockPlannerProps) {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
  const [showTacticsBoard, setShowTacticsBoard] = useState<boolean>(false);
  const config: TimeBlockConfig = createTimeBlockConfig(interval);

  const handleEditBlock = (blockIndex: number) => {
    setActiveBlockIndex(blockIndex);
    setShowTacticsBoard(true);
  };

  const handleTacticsBoardClose = () => {
    setShowTacticsBoard(false);
  };

  const handleSaveBlock = async () => {
    try {
      if (onSaveBlocks) {
        await onSaveBlocks(blockAssignments);
      }
      setShowTacticsBoard(false);
    } catch (error) {
      console.error('Failed to save blocks:', error);
      // Keep the tactics board open on error
    }
  };

  const getAssignedPlayers = (blockIndex: number) => {
    const assignments = blockAssignments[blockIndex] || [];
    return assignments.filter(a => !a.isBench);
  };

  const getBenchPlayers = (blockIndex: number) => {
    const assignments = blockAssignments[blockIndex] || [];
    return assignments.filter(a => a.isBench);
  };

  const handleCopyFromPrevious = () => {
    if (activeBlockIndex > 0) {
      const previousBlockAssignments = blockAssignments[activeBlockIndex - 1];
      if (previousBlockAssignments && previousBlockAssignments.length > 0) {
        onBlockAssignmentsChange(activeBlockIndex, [...previousBlockAssignments]);
      }
    }
  };

  if (showTacticsBoard) {
    const activeBlockAssignments = blockAssignments[activeBlockIndex] || [];
    const activeBlockConfig = config.blocks[activeBlockIndex];
    const hasPreviousBlock = activeBlockIndex > 0;
    const previousBlockHasAssignments = hasPreviousBlock && 
      blockAssignments[activeBlockIndex - 1] && 
      blockAssignments[activeBlockIndex - 1].length > 0;
    
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Tactics Board - {activeBlockConfig.label}
            </h3>
            <p className="text-sm text-gray-600">
              {formatTimeRange(activeBlockConfig.startMin, activeBlockConfig.endMin)}
            </p>
          </div>
          <div className="flex gap-2">
            {previousBlockHasAssignments && activeBlockAssignments.length === 0 && (
              <button
                onClick={handleCopyFromPrevious}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Copy from {config.blocks[activeBlockIndex - 1].label}
              </button>
            )}
            <button
              onClick={handleSaveBlock}
              className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              Save & Close
            </button>
            <button
              onClick={handleTacticsBoardClose}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              View All Blocks
            </button>
          </div>
        </div>
        
        <TacticsBoard
          players={players}
          assignments={activeBlockAssignments}
          onAssignmentsChange={(assignments) => onBlockAssignmentsChange(activeBlockIndex, assignments)}
          readonly={false}
          formations={formations}
          selectedFormationId={blockFormations?.[activeBlockIndex] || ''}
          onFormationChange={(formationId) => {
            if (onBlockFormationChange) {
              onBlockFormationChange(activeBlockIndex, formationId);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Time Block Planning</h3>
      
      <div className="grid gap-4">
        {config.blocks.map((blockConfig) => {
          const assignedPlayers = getAssignedPlayers(blockConfig.index);
          const benchPlayers = getBenchPlayers(blockConfig.index);
          const isActive = activeBlockIndex === blockConfig.index;
          
          return (
            <div
              key={blockConfig.index}
              className={`border rounded-lg p-4 transition-all ${
                isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{blockConfig.label}</h4>
                  <p className="text-sm text-gray-600">
                    {formatTimeRange(blockConfig.startMin, blockConfig.endMin)}
                  </p>
                </div>
                <button
                  onClick={() => handleEditBlock(blockConfig.index)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit Lineup
                </button>
              </div>
              
              {/* Starting XI */}
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Starting XI ({assignedPlayers.length}/9)
                </h5>
                {assignedPlayers.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {assignedPlayers.slice(0, 9).map((assignment) => (
                      <div
                        key={assignment.playerId}
                        className="flex items-center gap-2 p-2 bg-white rounded border text-sm"
                      >
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {assignment.player.shirtNo || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{assignment.player.name}</div>
                          <div className="text-xs text-gray-500 truncate">{assignment.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded text-center text-gray-500 text-sm">
                    <UserIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    No players assigned
                  </div>
                )}
              </div>
              
              {/* Bench */}
              {benchPlayers.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Bench ({benchPlayers.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {benchPlayers.map((assignment) => (
                      <div
                        key={assignment.playerId}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                      >
                        <span className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                          {assignment.player.shirtNo || '?'}
                        </span>
                        <span className="truncate">{assignment.player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}