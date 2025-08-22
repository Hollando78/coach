import { create } from 'zustand'
import { GameState } from '../game/GameEngine'

interface User {
  id: string
  email: string
  displayName: string
}

interface GameStore {
  // Auth
  user: User | null
  accessToken: string | null
  
  // Game
  gameState: GameState | null
  selectedTower: string | null
  
  // UI
  showLeaderboard: boolean
  showSettings: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setGameState: (state: GameState) => void
  setSelectedTower: (towerId: string | null) => void
  setShowLeaderboard: (show: boolean) => void
  setShowSettings: (show: boolean) => void
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  user: null,
  accessToken: null,
  gameState: null,
  selectedTower: null,
  showLeaderboard: false,
  showSettings: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setGameState: (gameState) => set({ gameState }),
  setSelectedTower: (selectedTower) => set({ selectedTower }),
  setShowLeaderboard: (showLeaderboard) => set({ showLeaderboard }),
  setShowSettings: (showSettings) => set({ showSettings }),
}))