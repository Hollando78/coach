import React, { useState } from 'react';
import { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (playerId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

function PlayerCard({ 
  player, 
  onEdit, 
  onDelete, 
  showActions = true,
  compact = false 
}: PlayerCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getSkillColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 bg-green-100';
    if (rating >= 6) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPositionBadges = () => {
    if (typeof player.preferredPositions === 'string') {
      try {
        return JSON.parse(player.preferredPositions);
      } catch {
        return [];
      }
    }
    return player.preferredPositions || [];
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            {player.shirtNo || player.name.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{player.name}</div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              getSkillColor(player.skillRating)
            }`}>
              {player.skillRating.toFixed(1)}
            </span>
            {player.shirtNo && (
              <span className="text-xs text-gray-500">#{player.shirtNo}</span>
            )}
          </div>
        </div>
        
        {showActions && (onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(player);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                        onDelete(player.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 last:rounded-b-md"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {player.shirtNo || player.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
            <div className="flex items-center space-x-3 mt-1">
              {player.shirtNo && (
                <span className="text-sm text-gray-600">#{player.shirtNo}</span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                getSkillColor(player.skillRating)
              }`}>
                Rating: {player.skillRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        
        {showActions && (onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(player);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                        onDelete(player.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 last:rounded-b-md"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Preferred positions */}
      {getPositionBadges().length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Preferred Positions</div>
          <div className="flex flex-wrap gap-2">
            {getPositionBadges().map((position: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {position}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCard;