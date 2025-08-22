import { useGameStore } from '../state/gameStore'
import { GameEngine } from '../game/GameEngine'

interface HUDProps {
  onExit: () => void
  engine: GameEngine | null
}

export function HUD({ onExit, engine }: HUDProps) {
  const gameState = useGameStore((state) => state.gameState)
  
  console.log('HUD render - engine:', !!engine, 'gameState:', !!gameState)
  
  if (!gameState) {
    return (
      <div className="bg-red-800 text-white p-4 flex items-center justify-between">
        <div>⚠️ Game State Not Available</div>
        <button onClick={onExit} className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition">
          Exit
        </button>
      </div>
    )
  }
  
  const handlePause = () => {
    console.log('HUD handlePause clicked, engine:', !!engine)
    if (engine) {
      engine.setPaused(!gameState.isPaused)
    }
  }
  
  const handleSpeed = () => {
    console.log('HUD handleSpeed clicked, engine:', !!engine)
    if (engine) {
      const newSpeed = gameState.speed === 1 ? 2 : 1
      engine.setSpeed(newSpeed)
    }
  }
  
  const handleNextWave = () => {
    console.log('HUD handleNextWave clicked, engine:', !!engine)
    if (engine) {
      engine.startWave()
    }
  }
  
  const handleResetView = () => {
    console.log('HUD handleResetView clicked, engine:', !!engine)
    if (engine) {
      // Reset zoom and pan
      engine.app.stage.scale.set(1)
      engine.app.stage.x = 0
      engine.app.stage.y = 0
    }
  }
  
  const isWaveComplete = engine ? engine.waveManager.isWaveComplete() : false
  const canStartWave = engine && (gameState.wave === 0 || isWaveComplete)
  console.log('HUD canStartWave:', canStartWave, 'wave:', gameState.wave, 'engine exists:', !!engine, 'isWaveComplete:', isWaveComplete)
  
  return (
    <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">💰</span>
          <span className="font-bold">{gameState.cash}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-red-400">❤️</span>
          <span className="font-bold">{gameState.lives}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-blue-400">🌊</span>
          <span className="font-bold">Wave {gameState.wave}/20</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-green-400">⭐</span>
          <span className="font-bold">{gameState.score}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {canStartWave && gameState.wave < 20 && (
          <button
            onClick={handleNextWave}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded transition font-bold"
          >
            {gameState.wave === 0 ? 'Start Game!' : 'Next Wave'}
          </button>
        )}
        
        <button
          onClick={handlePause}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded transition"
        >
          {gameState.isPaused ? '▶️' : '⏸️'}
        </button>
        
        <button
          onClick={handleSpeed}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded transition"
        >
          {gameState.speed}x
        </button>
        
        <button
          onClick={handleResetView}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded transition"
          title="Reset zoom and pan"
        >
          🔄
        </button>
        
        <button
          onClick={onExit}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded transition"
        >
          Exit
        </button>
      </div>
    </div>
  )
}