import { useState } from 'react'
import { useConsoleLogger } from '../hooks/useConsoleLogger'

export function ConsoleDisplay() {
  const { logs, clearLogs } = useConsoleLogger()
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded shadow-lg z-50"
      >
        📱 Console
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 max-w-[90vw] bg-gray-900 text-green-400 rounded shadow-lg z-50 font-mono text-xs">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t">
        <span className="font-bold">📱 Mobile Console</span>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-yellow-400 hover:text-yellow-300"
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button
            onClick={clearLogs}
            className="text-blue-400 hover:text-blue-300"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ❌
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-500">No console messages yet...</div>
          ) : (
            logs.map((log, i) => {
              const time = new Date(log.timestamp).toLocaleTimeString()
              const colorClass = {
                log: 'text-green-400',
                warn: 'text-yellow-400',
                error: 'text-red-400'
              }[log.level]
              
              return (
                <div key={i} className={`${colorClass} break-words`}>
                  <span className="text-gray-500">[{time}]</span>{' '}
                  {log.message}
                  {log.data && (
                    <div className="ml-4 text-gray-400 text-xs">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}