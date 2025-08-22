import { useState, useEffect } from 'react'

interface LogEntry {
  timestamp: number
  level: 'log' | 'warn' | 'error'
  message: string
  data?: any
}

export function useConsoleLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (level: LogEntry['level'], message: string, data?: any) => {
      setLogs(prev => [...prev.slice(-49), {
        timestamp: Date.now(),
        level,
        message,
        data
      }])
    }

    console.log = (message: any, ...args: any[]) => {
      originalLog(message, ...args)
      addLog('log', String(message), args.length > 0 ? args : undefined)
    }

    console.warn = (message: any, ...args: any[]) => {
      originalWarn(message, ...args)
      addLog('warn', String(message), args.length > 0 ? args : undefined)
    }

    console.error = (message: any, ...args: any[]) => {
      originalError(message, ...args)
      addLog('error', String(message), args.length > 0 ? args : undefined)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  const clearLogs = () => setLogs([])

  return { logs, clearLogs }
}