import React, { useRef, useEffect } from 'react';
import { useDndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Player, Assignment, Position } from '../../types';
import PlayerPosition from './PlayerPosition';

interface PitchViewProps {
  players: Player[];
  assignments: Assignment[];
  positions: Position[];
  onAssignmentChange: (assignments: Assignment[]) => void;
  readonly?: boolean;
}

function PitchView({ 
  players, 
  assignments, 
  positions, 
  onAssignmentChange, 
  readonly = false 
}: PitchViewProps) {
  const pitchRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    if (readonly) return;
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeAssignment = assignments.find(a => a.id === active.id);
    const overPosition = positions.find(p => p.role === over.id);
    
    if (!activeAssignment || !overPosition) {
      return;
    }

    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === activeAssignment.id) {
        return {
          ...assignment,
          position: overPosition.role
        };
      }
      return assignment;
    });

    onAssignmentChange(updatedAssignments);
  };

  const getPlayerAtPosition = (positionRole: string) => {
    const assignment = assignments.find(a => a.position === positionRole && !a.isBench);
    return assignment ? players.find(p => p.id === assignment.playerId) : null;
  };

  const getBenchPlayers = () => {
    return assignments
      .filter(a => a.isBench)
      .map(a => players.find(p => p.id === a.playerId))
      .filter(Boolean) as Player[];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Pitch */}
      <div 
        ref={pitchRef}
        className="pitch relative w-full aspect-[3/4] mb-6 rounded-lg overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(white 2px, transparent 2px),
            linear-gradient(90deg, white 2px, transparent 2px),
            linear-gradient(white 1px, transparent 1px),
            linear-gradient(90deg, white 1px, transparent 1px)
          `,
          backgroundSize: '60px 40px, 60px 40px, 20px 20px, 20px 20px'
        }}
      >
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Goals */}
        <div className="absolute top-0 left-1/2 w-16 h-2 bg-white transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-16 h-2 bg-white transform -translate-x-1/2"></div>
        
        {/* 18-yard boxes */}
        <div className="absolute top-0 left-1/2 w-32 h-16 border-2 border-white transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-32 h-16 border-2 border-white transform -translate-x-1/2"></div>
        
        {/* 6-yard boxes */}
        <div className="absolute top-0 left-1/2 w-16 h-6 border-2 border-white transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-16 h-6 border-2 border-white transform -translate-x-1/2"></div>
        
        {/* Player positions */}
        {positions.map((position) => {
          const player = getPlayerAtPosition(position.role);
          return (
            <div
              key={position.role}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`
              }}
            >
              {player ? (
                <PlayerPosition
                  player={player}
                  position={position.role}
                  isDraggable={!readonly}
                />
              ) : (
                <div className="w-8 h-8 border-2 border-dashed border-white rounded-full bg-green-600 bg-opacity-30 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bench */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Bench</h3>
        <div className="flex flex-wrap gap-2">
          {getBenchPlayers().map((player) => (
            <PlayerPosition
              key={player.id}
              player={player}
              position="bench"
              isDraggable={!readonly}
              className="relative transform-none"
            />
          ))}
          {getBenchPlayers().length === 0 && (
            <div className="text-gray-500 text-sm">No players on bench</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PitchView;