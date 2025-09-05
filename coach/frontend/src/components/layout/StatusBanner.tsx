import React from 'react';
import { useOfflineStore } from '../../stores/offlineStore';

interface StatusBannerProps {
  isOnline: boolean;
}

function StatusBanner({ isOnline }: StatusBannerProps) {
  const { queuedEvents, isSyncing, lastSyncAt } = useOfflineStore();
  const pendingCount = queuedEvents.filter(e => !e.synced).length;

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`
      fixed top-16 md:top-20 left-0 right-0 z-40 px-4 py-2 text-center text-sm font-medium
      ${isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}
    `}>
      {!isOnline ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span>Offline mode - Changes will sync when connection is restored</span>
          {pendingCount > 0 && (
            <span className="bg-red-200 px-2 py-1 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </div>
      ) : isSyncing ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Syncing changes...</span>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
          <span>{pendingCount} changes waiting to sync</span>
        </div>
      ) : null}
    </div>
  );
}

export default StatusBanner;