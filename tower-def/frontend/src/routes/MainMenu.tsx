import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/gameStore'
import { auth } from '../api/client'
import { LoginModal } from '../ui/LoginModal'
import { Leaderboard } from '../ui/Leaderboard'

export function MainMenu() {
  const navigate = useNavigate()
  const user = useGameStore((state) => state.user)
  const setUser = useGameStore((state) => state.setUser)
  const setAccessToken = useGameStore((state) => state.setAccessToken)
  
  const [showLogin, setShowLogin] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  const handlePlay = () => {
    navigate('/game')
  }
  
  const handleLogout = async () => {
    try {
      await auth.logout()
      setUser(null)
      setAccessToken(null)
    } catch (error) {
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-purple-600">
          Doodle Tower Defence
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Defend your paper kingdom!
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handlePlay}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
          >
            Play
          </button>
          
          {user && (
            <button
              onClick={handlePlay}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Continue
            </button>
          )}
          
          <button
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Leaderboard
          </button>
          
          <div className="pt-4 border-t">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Welcome, <span className="font-semibold">{user.displayName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  )
}