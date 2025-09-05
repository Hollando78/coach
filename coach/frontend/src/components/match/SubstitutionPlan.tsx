import React from 'react';
import { ArrowRightIcon, ClockIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { PlannedSubstitution, PlanningInterval } from '../../types';
import { getBlockLabel } from '../../utils/timeBlocks';

interface SubstitutionPlanProps {
  substitutions: PlannedSubstitution[];
  interval: PlanningInterval;
}

export function SubstitutionPlan({ substitutions, interval }: SubstitutionPlanProps) {
  if (substitutions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        <ClockIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No planned changes</p>
        <p className="text-sm mt-1">Substitutions and tactical moves between time blocks will appear here</p>
      </div>
    );
  }

  // Group substitutions by time block transition
  const substitutionsByTransition = substitutions.reduce((acc, sub) => {
    const key = `${sub.fromBlock}-${sub.toBlock}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(sub);
    return acc;
  }, {} as Record<string, PlannedSubstitution[]>);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <ClockIcon className="w-5 h-5" />
        Planned Changes
      </h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-50 border rounded"></div>
          <span>Substitution</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
          <span>Tactical Move</span>
        </div>
      </div>
      
      {Object.entries(substitutionsByTransition).map(([transitionKey, subs]) => {
        const firstSub = subs[0];
        const fromLabel = getBlockLabel(firstSub.fromBlock, interval);
        const toLabel = getBlockLabel(firstSub.toBlock, interval);
        
        return (
          <div key={transitionKey} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600">
              <ClockIcon className="w-4 h-4" />
              <span>{fromLabel}</span>
              <ArrowRightIcon className="w-4 h-4" />
              <span>{toLabel}</span>
              <span className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {firstSub.minute}'
              </span>
            </div>
            
            <div className="space-y-2">
              {subs.map((sub, index) => {
                // Check if this is a tactical move (same player, different positions)
                const isTacticalMove = sub.playerOut.id === sub.playerIn.id;
                
                return (
                  <div key={index} className={`flex items-center gap-3 p-2 rounded ${
                    isTacticalMove ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    {isTacticalMove ? (
                      // Tactical Move (same player, position change)
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {sub.playerOut.shirtNo || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{sub.playerOut.name}</div>
                            <div className="text-xs text-blue-600 font-medium">
                              Tactical Move: {sub.position}
                            </div>
                          </div>
                        </div>
                        
                        {/* Tactical move icon */}
                        <ArrowsRightLeftIcon className="w-4 h-4 text-blue-500" />
                        
                        <div className="flex-1"></div>
                      </>
                    ) : (
                      // Actual Substitution (different players)
                      <>
                        {/* Player Out */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-semibold text-sm">
                              {sub.playerOut.shirtNo || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{sub.playerOut.name}</div>
                            <div className="text-xs text-gray-500">Going off</div>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                        
                        {/* Player In */}
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {sub.playerIn.shirtNo || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{sub.playerIn.name}</div>
                            <div className="text-xs text-green-600 font-medium">{sub.position}</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}