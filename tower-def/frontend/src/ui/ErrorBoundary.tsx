import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-900 text-white p-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">🚨 Something went wrong!</h1>
            
            <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
              <h2 className="text-xl font-semibold mb-2">Error Details:</h2>
              <pre className="text-sm text-red-300 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <div className="bg-black bg-opacity-50 p-4 rounded-lg mb-4">
                <h2 className="text-xl font-semibold mb-2">Stack Trace:</h2>
                <pre className="text-sm text-gray-300 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold"
            >
              Reload Game
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}