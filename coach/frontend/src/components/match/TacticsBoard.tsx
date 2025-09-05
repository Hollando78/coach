import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable, closestCenter, rectIntersection, pointerWithin } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { Player, Assignment, Position } from '../../types';
import PlayerPosition from './PlayerPosition';

interface TacticsBoardProps {
  players: Player[];
  assignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
  readonly?: boolean;
  formationPositions?: Position[];
}

// Default 9-a-side formation positions (3-2-3-1)
const DEFAULT_FORMATION_POSITIONS: Position[] = [
  // Goalkeeper
  { x: 50, y: 85, role: 'Goalkeeper' },
  
  // Defense (3 players)
  { x: 25, y: 65, role: 'Left Back' },
  { x: 50, y: 65, role: 'Centre Back' },
  { x: 75, y: 65, role: 'Right Back' },
  
  // Midfield (2 players)
  { x: 35, y: 45, role: 'Defensive Mid' },
  { x: 65, y: 45, role: 'Central Mid' },
  
  // Attack (3 players)
  { x: 20, y: 25, role: 'Left Wing' },
  { x: 50, y: 25, role: 'Centre Forward' },
  { x: 80, y: 25, role: 'Right Wing' },
];

export function TacticsBoard({
  players,
  assignments,
  onAssignmentsChange,
  readonly = false,
  formationPositions = DEFAULT_FORMATION_POSITIONS
}: TacticsBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    
    if (readonly) return;
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    // Handle dragging player to position slot
    if (over.id.toString().startsWith('position-')) {
      const targetPosition = over.id.toString().replace('position-', '');
      
      // Extract player ID from drag ID format: "playerId-currentPosition"
      const activeIdStr = active.id.toString();
      const playerId = activeIdStr.includes('-') 
        ? activeIdStr.substring(0, activeIdStr.lastIndexOf('-'))
        : activeIdStr;
      
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      
      // Find if this player already has an assignment
      const existingAssignment = assignments.find(a => a.playerId === playerId);
      
      // Check if target position is already occupied by a different player
      const occupyingAssignment = assignments.find(a => 
        a.position === targetPosition && !a.isBench && a.playerId !== playerId
      );
      
      let updatedAssignments = [...assignments];
      
      if (existingAssignment) {
        // Update existing assignment to new position
        updatedAssignments = updatedAssignments.map(assignment => {
          if (assignment.playerId === playerId) {
            return {
              ...assignment,
              position: targetPosition,
              isBench: false
            };
          }
          return assignment;
        });
      } else {
        // Create new assignment for unassigned player
        const newAssignment: Assignment = {
          id: `assignment-${playerId}-${Date.now()}`,
          blockId: 'temp',
          playerId: playerId,
          position: targetPosition,
          isBench: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          player: player
        };
        updatedAssignments = [...updatedAssignments, newAssignment];
      }
      
      // If target position was occupied by another player, move that player to bench
      if (occupyingAssignment) {
        updatedAssignments = updatedAssignments.map(assignment => {
          if (assignment.id === occupyingAssignment.id) {
            return {
              ...assignment,
              position: 'bench',
              isBench: true
            };
          }
          return assignment;
        });
      }

      onAssignmentsChange(updatedAssignments);
      return;
    }

    
    // Handle dragging player to bench
    if (over.id === 'bench') {
      // Extract player ID from drag ID format: "playerId-currentPosition"
      const activeIdStr = active.id.toString();
      const playerId = activeIdStr.includes('-') 
        ? activeIdStr.substring(0, activeIdStr.lastIndexOf('-'))
        : activeIdStr;
      
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      
      // Find if this player already has an assignment
      const existingAssignment = assignments.find(a => a.playerId === playerId);
      
      let updatedAssignments = [...assignments];
      
      if (existingAssignment) {
        // Update existing assignment to bench
        updatedAssignments = updatedAssignments.map(assignment => {
          if (assignment.playerId === playerId) {
            return {
              ...assignment,
              position: 'bench',
              isBench: true
            };
          }
          return assignment;
        });
      } else {
        // Create new assignment for unassigned player
        const newAssignment: Assignment = {
          id: `assignment-${playerId}-${Date.now()}`,
          blockId: 'temp',
          playerId: playerId,
          position: 'bench',
          isBench: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          player: player
        };
        updatedAssignments = [...updatedAssignments, newAssignment];
      }

      onAssignmentsChange(updatedAssignments);
      return;
    }
    
    // Handle dragging player back to available (unassign)
    if (over.id === 'available') {
      // Extract player ID from drag ID format: "playerId-currentPosition"
      const activeIdStr = active.id.toString();
      const playerId = activeIdStr.includes('-') 
        ? activeIdStr.substring(0, activeIdStr.lastIndexOf('-'))
        : activeIdStr;
      
      // Remove the player's assignment (make them unassigned)
      const updatedAssignments = assignments.filter(a => a.playerId !== playerId);
      onAssignmentsChange(updatedAssignments);
      return;
    }
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

  const getUnassignedPlayers = () => {
    const assignedPlayerIds = assignments.map(a => a.playerId);
    return players.filter(p => !assignedPlayerIds.includes(p.id));
  };

  const getActivePlayer = () => {
    if (!activeId) return null;
    
    // Extract player ID from sortable ID format: "playerId-position"
    const activeIdStr = activeId.toString();
    const playerId = activeIdStr.includes('-') 
      ? activeIdStr.substring(0, activeIdStr.lastIndexOf('-'))
      : activeIdStr;
    
    return players.find(p => p.id === playerId) || null;
  };

  const benchPlayers = getBenchPlayers();
  const unassignedPlayers = getUnassignedPlayers();
  const activePlayer = getActivePlayer();

  // Create a comprehensive list of all draggable items
  const allDraggableItems = [
    ...unassignedPlayers.map(p => `${p.id}-unassigned`),
    ...assignments.map(a => `${a.playerId}-${a.isBench ? 'bench' : a.position}`)
  ];


  return (
    <div className="w-full max-w-6xl mx-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allDraggableItems}>
          <div className="flex gap-4">
          {/* Available Players */}
          <div className="w-52">
            <AvailablePlayersArea>
              <h3 className="text-lg font-semibold mb-3">Available Players</h3>
              
              <div className="grid grid-cols-2 gap-3 min-h-[200px] py-2">
                {unassignedPlayers.map((player) => (
                  <div key={player.id} className="flex justify-center">
                    <PlayerPosition
                      player={player}
                      position="unassigned"
                      isDraggable={!readonly}
                      className="transform-none"
                    />
                  </div>
                ))}
                {unassignedPlayers.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="text-sm">All players assigned</p>
                  </div>
                )}
              </div>
            </AvailablePlayersArea>
          </div>
          
          {/* Main Pitch */}
          <div className="flex-1">
            <div 
              className="pitch relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-green-600"
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
              
              {/* Formation Positions */}
              {formationPositions.map((position) => {
                const player = getPlayerAtPosition(position.role);
                return (
                  <PositionSlot
                    key={position.role}
                    position={position}
                    player={player}
                    readonly={readonly}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Bench - 4 slots as requested */}
          <div className="w-52">
            <div className="bg-white rounded-lg p-4 shadow-sm h-full">
              <h3 className="text-lg font-semibold mb-3">Bench</h3>
              
              <BenchArea 
                players={benchPlayers}
                maxSlots={4}
                readonly={readonly}
              />
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activePlayer ? (
            <div className="opacity-80">
              <PlayerPosition
                player={activePlayer}
                position="dragging"
                isDraggable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Position slot component
interface PositionSlotProps {
  position: Position;
  player: Player | null;
  readonly: boolean;
}

function PositionSlot({ position, player, readonly }: PositionSlotProps) {
  const dropId = `position-${position.role}`;
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
  });



  return (
    <div
      ref={setNodeRef}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
        isOver ? 'scale-110 z-10' : ''
      } transition-transform duration-200`}
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
        <div className={`w-16 h-16 border-2 border-dashed rounded-full flex items-center justify-center transition-all ${
          isOver 
            ? 'border-blue-400 bg-blue-200 scale-110' 
            : 'border-white bg-white bg-opacity-20 hover:bg-opacity-30'
        }`}>
          <span className="text-white text-xs font-bold">?</span>
        </div>
      )}
      
      {/* Position label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium whitespace-nowrap bg-black bg-opacity-50 px-2 py-1 rounded">
        {position.role}
      </div>
    </div>
  );
}

// Bench area component
// Component for Available Players drop area
interface AvailablePlayersAreaProps {
  children: React.ReactNode;
}

function AvailablePlayersArea({ children }: AvailablePlayersAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'available',
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg p-4 shadow-sm transition-all duration-200 ${
        isOver ? 'ring-2 ring-green-400 bg-green-50' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface BenchAreaProps {
  players: Player[];
  maxSlots: number;
  readonly: boolean;
}

function BenchArea({ players, maxSlots, readonly }: BenchAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'bench',
  });



  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] p-3 border-2 border-dashed rounded-lg transition-colors ${
        isOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="grid grid-cols-2 gap-3 auto-rows-min">
        {/* Show all bench players */}
        {players.map((player, index) => (
          <div key={`bench-${player.id}-${index}`} className="flex justify-center h-20">
            <PlayerPosition
              player={player}
              position="bench"
              isDraggable={!readonly}
              className="transform-none"
            />
          </div>
        ))}
        
        {/* Show empty slots if there are fewer players than max slots */}
        {Array.from({ length: Math.max(0, maxSlots - players.length) }).map((_, index) => (
          <div 
            key={`empty-${index}`} 
            className="flex justify-center"
          >
            <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">?</span>
            </div>
          </div>
        ))}
      </div>
      
      {players.length > maxSlots && (
        <div className="mt-3 text-sm text-red-600">
          Warning: {players.length - maxSlots} extra players on bench
        </div>
      )}
      
      {players.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-sm">Drag players here</p>
          <p className="text-xs mt-1">Maximum {maxSlots} bench slots</p>
        </div>
      )}
    </div>
  );
}

export default TacticsBoard;