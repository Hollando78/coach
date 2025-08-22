interface GameOverModalProps {
  score: number
  wave: number
  onRestart: () => void
  onExit: () => void
}

export function GameOverModal({ score, wave, onRestart, onExit }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-4 text-red-500">Game Over!</h2>
        
        <div className="text-center mb-6">
          <div className="text-2xl font-bold mb-2">Final Score: {score.toLocaleString()}</div>
          <div className="text-lg text-gray-600">Reached Wave {wave}</div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
          >
            Play Again
          </button>
          
          <button
            onClick={onExit}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}