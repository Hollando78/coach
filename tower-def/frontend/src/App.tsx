import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { MainMenu } from './routes/MainMenu'
import { Game } from './routes/Game'
import { useGameStore } from './state/gameStore'
import { auth } from './api/client'
import { ErrorBoundary } from './ui/ErrorBoundary'

export function App() {
  const setUser = useGameStore((state) => state.setUser)
  const setAccessToken = useGameStore((state) => state.setAccessToken)
  
  useEffect(() => {
    
    // Try to restore session
    auth.me().then((user) => {
      setUser(user)
    }).catch(() => {
    })
  }, [setUser, setAccessToken])
  
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<Game />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}