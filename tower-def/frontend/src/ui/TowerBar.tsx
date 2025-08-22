import { useGameStore } from '../state/gameStore'
import towersData from '../game/content/towers.json'

export function TowerBar() {
  const gameState = useGameStore((state) => state.gameState)
  const selectedTower = useGameStore((state) => state.selectedTower)
  const setSelectedTower = useGameStore((state) => state.setSelectedTower)
  
  
  const towers = Object.entries(towersData).filter(([_, data]: [string, any]) => !data.isTrap)
  
  return (
    <div className="bg-gray-100 p-4 w-48">
      <h3 className="font-bold text-lg mb-4">Towers</h3>
      
      <div className="space-y-2">
        {towers.map(([id, data]) => {
          const canAfford = gameState ? gameState.cash >= data.cost : false
          const isSelected = selectedTower === id
          
          return (
            <button
              key={id}
              onClick={() => {
                const newSelection = isSelected ? null : id
                setSelectedTower(newSelection)
              }}
              disabled={!canAfford}
              className={`
                w-full p-2 rounded transition
                ${isSelected ? 'bg-blue-500 text-white' : 'bg-white'}
                ${canAfford ? 'hover:bg-blue-100' : 'opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="font-semibold">{data.name}</div>
              <div className="text-sm">${data.cost}</div>
              <div className="text-xs mt-1 opacity-75">{data.description}</div>
            </button>
          )
        })}
      </div>
      
      {selectedTower && (
        <div className="mt-4 p-2 bg-yellow-100 rounded">
          <p className="text-sm font-semibold">🎯 Tap game canvas to place tower!</p>
          <p className="text-xs mt-1">Selected: {selectedTower}</p>
          <p className="text-xs mt-1 text-gray-600">📱 Pan: 1 finger drag<br/>🔍 Zoom: 2 finger pinch</p>
        </div>
      )}
      
      {!selectedTower && gameState && (
        <div className="mt-4 p-2 bg-blue-100 rounded">
          <p className="text-sm">💡 Select a tower above, then tap the game to place it!</p>
          <p className="text-xs mt-1 text-gray-600">📱 Pan with 1 finger, zoom with 2 fingers</p>
        </div>
      )}
    </div>
  )
}