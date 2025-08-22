import { useEffect, useState } from 'react'
import { leaderboard } from '../api/client'

interface LeaderboardProps {
  onClose: () => void
}

interface LeaderboardEntry {
  rank: number
  displayName: string
  score: number
  waveReached: number
  mode: string
  createdAt: string
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [mode, setMode] = useState<string>('normal')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadLeaderboard()
  }, [mode])
  
  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const data = await leaderboard.get(mode)
      setEntries(data.leaderboard)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setMode('normal')}
              className={`px-3 py-1 rounded ${mode === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Normal
            </button>
            <button
              onClick={() => setMode('hard')}
              className={`px-3 py-1 rounded ${mode === 'hard' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Hard
            </button>
            <button
              onClick={() => setMode('endless')}
              className={`px-3 py-1 rounded ${mode === 'endless' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Endless
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No scores yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Player</th>
                  <th className="text-right p-2">Score</th>
                  <th className="text-right p-2">Wave</th>
                  <th className="text-right p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.rank} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && entry.rank}
                    </td>
                    <td className="p-2">{entry.displayName}</td>
                    <td className="text-right p-2 font-mono">{entry.score.toLocaleString()}</td>
                    <td className="text-right p-2">{entry.waveReached}</td>
                    <td className="text-right p-2 text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  )
}