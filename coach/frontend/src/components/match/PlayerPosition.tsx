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
  nameDisplay?: 'initials' | 'first' | 'last';
  timeOnPitch?: number; // minutes played
  matchDuration?: number; // total match duration in minutes
}

function PlayerPosition({ 
  player, 
  position, 
  isDraggable = true, 
  className = '',
  onClick,
  nameDisplay = 'initials',
  timeOnPitch = 0,
  matchDuration = 90
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

  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  };

  const getLastName = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  };

  const getDisplayText = (name: string, display: 'initials' | 'first' | 'last') => {
    switch (display) {
      case 'first':
        return getFirstName(name);
      case 'last':
        return getLastName(name);
      case 'initials':
      default:
        return getPlayerInitials(name);
    }
  };

  const displayText = getDisplayText(player.name, nameDisplay);

  // Calculate pie chart progress (0 to 100)
  const timeProgress = Math.min(100, (timeOnPitch / matchDuration) * 100);
  
  // Create SVG path for pie chart starting from 12 o'clock
  const createPieChart = (percentage: number) => {
    const angle = (percentage / 100) * 360;
    // Start from 12 o'clock (top) and go clockwise
    const radians = (angle * Math.PI) / 180 - Math.PI / 2;
    const x = 50 + 40 * Math.cos(radians);
    const y = 50 + 40 * Math.sin(radians);
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    if (percentage === 0) return '';
    if (percentage >= 100) return 'M 50,10 A 40,40 0 1,1 49.99,10 Z';
    
    // Start from 12 o'clock (50,10) and sweep clockwise
    return `M 50,50 L 50,10 A 40,40 0 ${largeArcFlag},1 ${x},${y} Z`;
  };

  const pieChartPath = createPieChart(timeProgress);


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        player-position ${className}
        ${isDraggable ? 'cursor-move' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${isDragging ? '' : 'transition-opacity duration-150'}
      `}
      onClick={onClick}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      title={`${player.name} (${position}) - ${timeOnPitch.toFixed(1)}min`}
    >
      {/* Background pie chart */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100"
      >
        {/* Blue background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="#3B82F6" 
          opacity="0.8"
        />
        {/* Red progress pie */}
        {pieChartPath && (
          <path 
            d={pieChartPath}
            fill="#EF4444" 
            opacity="0.9"
          />
        )}
      </svg>
      
      {/* Player text content - positioned above SVG */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <span className="text-white text-xs font-bold drop-shadow-sm">
          {displayText}
        </span>
      </div>
      
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