import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '../../types';

interface PlayerPositionProps {
  player: Player;
  position: string;
  isDraggable?: boolean;
  className?: string;
  onClick?: () => void;
}

function PlayerPosition({ 
  player, 
  position, 
  isDraggable = true, 
  className = '',
  onClick 
}: PlayerPositionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `${player.id}-${position}`,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1
  };

  const getPositionColor = (pos: string) => {
    if (pos === 'bench') return 'bg-gray-400';
    if (pos.includes('GK')) return 'bg-yellow-500';
    if (pos.includes('DEF')) return 'bg-blue-600';
    if (pos.includes('MID')) return 'bg-green-600';
    if (pos.includes('FWD')) return 'bg-red-600';
    return 'bg-blue-600';
  };

  const getPlayerInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3); // Max 3 initials to fit in chip
  };

  const displayText = getPlayerInitials(player.name);


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        player-position ${getPositionColor(position)} ${className}
        ${isDraggable ? 'cursor-move' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${isDragging ? '' : 'transition-opacity duration-150'}
      `}
      onClick={onClick}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      title={`${player.name} (${position})`}
    >
      <span className="text-white text-xs font-bold">
        {displayText}
      </span>
      
      {/* Skill rating indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center">
        <span className="text-xs font-bold text-gray-800">
          {Math.round(player.skillRating)}
        </span>
      </div>
      
      {/* Player name on hover/click */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
        {player.name}
      </div>
    </div>
  );
}

export default PlayerPosition;