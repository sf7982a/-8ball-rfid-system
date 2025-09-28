import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  retryCount: number
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 Auth Error Boundary caught error:', error)
    console.error('📍 Error info:', errorInfo)

    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    })

    // Report to error monitoring service in production
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo)
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Replace with your error monitoring service (Sentry, etc.)
    console.error('📊 Reporting error to monitoring service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`🔄 Auth Error Boundary: Retrying (${this.state.retryCount + 1}/${this.maxRetries})`)
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private handleGoHome = () => {
    // Clear error state and navigate to home
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })

    // Clear any auth state and redirect
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/login'
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Something went wrong with the authentication system.</p>
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">
                      Technical details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {this.state.retryCount < this.maxRetries ? (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    Maximum retry attempts reached
                  </p>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <div className="text-xs text-gray-400 text-center">
                If this problem persists, please contact support.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with auth error boundary
export const withAuthErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WithAuthErrorBoundaryComponent = (props: P) => (
    <AuthErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </AuthErrorBoundary>
  )

  WithAuthErrorBoundaryComponent.displayName =
    `withAuthErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithAuthErrorBoundaryComponent
}