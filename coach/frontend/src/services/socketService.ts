import { io, Socket } from 'socket.io-client';
import { useMatchStore } from '../stores/matchStore';
import { useAuthStore } from '../stores/authStore';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    // Don't connect if not authenticated
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || !auth.user) {
      console.log('Socket connection skipped - user not authenticated');
      return;
    }

    if (this.socket && this.isConnected) {
      return;
    }

    const socketURL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    
    this.socket = io(socketURL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'] // Try websocket first, fall back to polling
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, try to reconnect
        console.log('Server disconnected the client, attempting to reconnect...');
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      this.reconnectAttempts++;
      
      if (error.message === 'Authentication error') {
        console.error('Socket.IO authentication failed. Please ensure you are logged in.');
        
        // If auth fails, check if user is still authenticated
        const auth = useAuthStore.getState();
        if (!auth.isAuthenticated) {
          console.log('User is not authenticated, stopping reconnection attempts');
          this.socket?.disconnect();
        }
      } else {
        console.error(`Socket.IO connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Please refresh the page.');
          this.socket?.disconnect();
        }
      }
    });

    // Match events
    this.socket.on('match:started', (data) => {
      console.log('Match started:', data);
      // Update match store if needed
    });

    this.socket.on('match:stopped', (data) => {
      console.log('Match stopped:', data);
      // Update match store if needed
    });

    this.socket.on('match:updated', (data) => {
      console.log('Match updated:', data);
      if (data.currentMinute !== undefined) {
        useMatchStore.getState().updateCurrentMinute(data.currentMinute);
      }
    });

    this.socket.on('substitution:made', (data) => {
      console.log('Substitution made:', data);
      useMatchStore.getState().addSubstitution(data.substitution);
    });

    this.socket.on('goal:scored', (data) => {
      console.log('Goal scored:', data);
      useMatchStore.getState().addGoal(data.goal);
    });

    this.socket.on('timer:tick', (data) => {
      useMatchStore.getState().updateCurrentMinute(data.minute);
    });

    this.socket.on('formation:updated', (data) => {
      console.log('Formation updated:', data);
      // Handle formation updates
    });

    this.socket.on('assignments:updated', (data) => {
      console.log('Assignments updated:', data);
      // Handle assignment updates
    });

    this.socket.on('notes:updated', (data) => {
      console.log('Notes updated:', data);
      // Handle notes updates
    });

    this.socket.on('user:joined', (data) => {
      console.log('User joined:', data);
    });

    this.socket.on('user:left', (data) => {
      console.log('User left:', data);
    });
  }

  // Match room management
  joinMatch(matchId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:join', { matchId });
    }
  }

  leaveMatch(matchId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:leave', { matchId });
    }
  }

  // Live match updates
  updateMatch(matchId: string, currentMinute: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:update', { matchId, currentMinute });
    }
  }

  sendTimerTick(matchId: string, minute: number) {
    if (this.socket && this.isConnected) {
      this.socket.emit('timer:tick', { matchId, minute });
    }
  }

  updateFormation(matchId: string, formation: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('formation:update', { matchId, formation });
    }
  }

  updateAssignments(matchId: string, assignments: any[]) {
    if (this.socket && this.isConnected) {
      this.socket.emit('assignments:update', { matchId, assignments });
    }
  }

  updateNotes(matchId: string, notes: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('notes:update', { matchId, notes });
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Reconnect after authentication
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.connect();
    }, 500); // Small delay to ensure clean disconnect
  }
}

export const socketService = new SocketService();