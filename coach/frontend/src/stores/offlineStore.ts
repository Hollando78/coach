import { create } from 'zustand';
import { OfflineEvent } from '../types';
import { offlineService } from '../services/offlineService';

interface OfflineState {
  isOnline: boolean;
  queuedEvents: OfflineEvent[];
  isSyncing: boolean;
  lastSyncAt: Date | null;
  
  // Network status
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Event queue management
  addToQueue: (event: Omit<OfflineEvent, 'id' | 'timestamp' | 'synced'>) => void;
  removeFromQueue: (eventId: string) => void;
  markAsSynced: (eventId: string) => void;
  
  // Sync operations
  syncQueue: () => Promise<void>;
  clearQueue: () => void;
  
  // Utility
  getQueueSize: () => number;
  getPendingEvents: () => OfflineEvent[];
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: navigator.onLine,
  queuedEvents: [],
  isSyncing: false,
  lastSyncAt: null,

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
    
    // Auto-sync when coming back online
    if (isOnline && get().queuedEvents.filter(e => !e.synced).length > 0) {
      setTimeout(() => {
        get().syncQueue();
      }, 1000);
    }
  },

  addToQueue: (eventData) => {
    const event: OfflineEvent = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
      ...eventData
    };
    
    set(state => ({
      queuedEvents: [...state.queuedEvents, event]
    }));
    
    // Store in IndexedDB
    offlineService.storeEvent(event);
    
    // Try to sync immediately if online
    if (get().isOnline) {
      setTimeout(() => {
        get().syncQueue();
      }, 100);
    }
  },

  removeFromQueue: (eventId: string) => {
    set(state => ({
      queuedEvents: state.queuedEvents.filter(event => event.id !== eventId)
    }));
    offlineService.removeEvent(eventId);
  },

  markAsSynced: (eventId: string) => {
    set(state => ({
      queuedEvents: state.queuedEvents.map(event => 
        event.id === eventId ? { ...event, synced: true } : event
      )
    }));
    offlineService.markEventSynced(eventId);
  },

  syncQueue: async () => {
    if (get().isSyncing || !get().isOnline) {
      return;
    }

    const pendingEvents = get().getPendingEvents();
    if (pendingEvents.length === 0) {
      return;
    }

    set({ isSyncing: true });

    try {
      for (const event of pendingEvents) {
        try {
          await offlineService.syncEvent(event);
          get().markAsSynced(event.id);
        } catch (error) {
          console.error(`Failed to sync event ${event.id}:`, error);
          // Continue with other events
        }
      }
      
      set({ lastSyncAt: new Date() });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      set({ isSyncing: false });
    }
  },

  clearQueue: () => {
    set({ queuedEvents: [] });
    offlineService.clearEvents();
  },

  getQueueSize: () => {
    return get().queuedEvents.length;
  },

  getPendingEvents: () => {
    return get().queuedEvents.filter(event => !event.synced);
  }
}));

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false);
  });
}