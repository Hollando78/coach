import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameEngine, GameState } from '../game/GameEngine'
import { useGameStore } from '../state/gameStore'
import { HUD } from '../ui/HUD'
import { TowerBar } from '../ui/TowerBar'
import { GameOverModal } from '../ui/GameOverModal'
import { ConsoleDisplay } from '../ui/ConsoleDisplay'
import { save, score } from '../api/client'

export function Game() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  
  const user = useGameStore((state) => state.user)
  const setGameState = useGameStore((state) => state.setGameState)
  
  const [showGameOver, setShowGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [engineReady, setEngineReady] = useState(false)
  const [showTowers, setShowTowers] = useState(true)
  
  useEffect(() => {
    
    if (!containerRef.current) {
      return
    }
    
    let engine: GameEngine
    try {
      engine = new GameEngine(containerRef.current)
      engineRef.current = engine
    } catch (error) {
      return
    }
    
    // Set up callbacks
    console.log('Setting up onStateChange callback')
    engine.onStateChange = (state: GameState) => {
      console.log('onStateChange received:', state)
      setGameState(state)
      
      // Auto-save between waves if logged in
      if (user && engine.waveManager.isWaveComplete()) {
        save.post({
          gameState: {
            wave: state.wave,
            lives: state.lives,
            cash: state.cash,
            towers: engine.towers.map(t => ({
              x: t.gridX,
              y: t.gridY,
              type: t.data.id,
              level: t.level,
            })),
            creeps: [],
            seed: state.seed,
            timestamp: Date.now(),
          },
        }).catch(() => {})
      }
    }
    
    const startTime = Date.now()
    
    engine.onGameOver = () => {
      setFinalScore(engine.state.score)
      setShowGameOver(true)
      
      // Submit score
      score.submit({
        score: engine.state.score,
        mode: 'normal',
        waveReached: engine.state.wave,
        durationMs: Date.now() - startTime,
        seed: engine.state.seed,
      }).catch(() => {})
    }
    
    // Manually trigger initial state update now that callbacks are set
    console.log('Triggering initial state update')
    engine.updateState()
    
    console.log('Engine setup complete, engineRef set to:', !!engine)
    setEngineReady(true)
    
    // Load save if available
    if (user) {
      save.get().then(() => {
        // TODO: Restore game state from save
      }).catch(() => {
        // No save or error
      })
    }
    
    // Handle tower placement and mobile controls
    let isDragging = false
    let lastPanPoint = { x: 0, y: 0 }
    let scale = 1
    let panX = 0
    let panY = 0
    let initialPinchDistance: number | null = null
    let initialScale = 1
    
    const handleCanvasInteraction = (event: MouseEvent | TouchEvent) => {
      event.preventDefault()
      
      const currentSelectedTower = useGameStore.getState().selectedTower
      
      // Handle tower placement on single tap/click
      if (!isDragging && currentSelectedTower && engine) {
        const rect = (engine.app.view as HTMLCanvasElement).getBoundingClientRect()
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
        
        // Account for current pan and zoom
        const x = Math.floor(((clientX - rect.left) / scale - panX) / engine.gridSize)
        const y = Math.floor(((clientY - rect.top) / scale - panY) / engine.gridSize)
        
        engine.placeTower(currentSelectedTower, x, y)
      }
    }
    
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        lastPanPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      }
    }
    
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      
      if (event.touches.length === 1) {
        // Single finger pan
        const touch = event.touches[0]
        const deltaX = touch.clientX - lastPanPoint.x
        const deltaY = touch.clientY - lastPanPoint.y
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true
          panX += deltaX / scale
          panY += deltaY / scale
          
          // Constrain pan to keep game visible
          const maxPan = 100 * (1 - scale)
          panX = Math.max(-maxPan, Math.min(maxPan, panX))
          panY = Math.max(-maxPan, Math.min(maxPan, panY))
          
          // Apply transform
          engine.app.stage.x = panX
          engine.app.stage.y = panY
          
          lastPanPoint = { x: touch.clientX, y: touch.clientY }
        }
      } else if (event.touches.length === 2) {
        // Two finger pinch zoom
        isDragging = true
        const touch1 = event.touches[0]
        const touch2 = event.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        // Store initial distance on first pinch
        if (!initialPinchDistance) {
          initialPinchDistance = distance
          initialScale = scale
        } else {
          const newScale = Math.max(0.3, Math.min(2, initialScale * (distance / initialPinchDistance)))
          scale = newScale
          engine.app.stage.scale.set(scale)
          
          // Constrain pan when zoomed out to keep game visible
          const maxPan = 100 * (1 - scale)
          panX = Math.max(-maxPan, Math.min(maxPan, panX))
          panY = Math.max(-maxPan, Math.min(maxPan, panY))
          engine.app.stage.x = panX
          engine.app.stage.y = panY
        }
      }
    }
    
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        // Reset dragging state after a short delay to allow tap detection
        setTimeout(() => { isDragging = false }, 100)
        initialPinchDistance = null
      }
    }
    
    const canvas = engine.app.view as HTMLCanvasElement
    canvas.addEventListener('click', handleCanvasInteraction)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      canvas.removeEventListener('click', handleCanvasInteraction)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      engine.destroy()
      setEngineReady(false)
    }
  }, [])
  
  const handleExit = () => {
    navigate('/')
  }
  
  const handleRestart = () => {
    setShowGameOver(false)
    if (containerRef.current && engineRef.current) {
      engineRef.current.destroy()
      
      const engine = new GameEngine(containerRef.current)
      engineRef.current = engine
      
      engine.onStateChange = (state: GameState) => {
        setGameState(state)
      }
      
      engine.onGameOver = () => {
        setFinalScore(engine.state.score)
        setShowGameOver(true)
      }
    }
  }
  
  return (
    <div className="game-container">
      <div className="game-wrapper">
        <HUD onExit={handleExit} engine={engineReady ? engineRef.current : null} />
        <div className="flex relative">
          <div ref={containerRef} />
          
          {/* Mobile Tower Toggle Button */}
          <button
            onClick={() => setShowTowers(!showTowers)}
            className="fixed bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full shadow-lg z-40 md:hidden"
          >
            {showTowers ? '🏰❌' : '🏰'}
          </button>
          
          {/* Tower Bar */}
          <div className={`
            ${showTowers ? 'block' : 'hidden'} 
            md:block
            fixed md:relative 
            top-0 right-0 
            h-full md:h-auto 
            w-64 md:w-48 
            bg-white md:bg-gray-100 
            shadow-lg md:shadow-none 
            z-30
            overflow-y-auto
          `}>
            <TowerBar />
          </div>
          
          {/* Mobile Backdrop */}
          {showTowers && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setShowTowers(false)}
            />
          )}
        </div>
      </div>
      
      {showGameOver && (
        <GameOverModal
          score={finalScore}
          wave={engineRef.current?.state.wave || 0}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
      
      <ConsoleDisplay />
    </div>
  )
}