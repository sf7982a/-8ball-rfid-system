import { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_error: Error): State {
    return { hasError: true, error: _error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Chart Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Something went wrong while rendering this chart. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Invalid or missing data</li>
              <li>Network connectivity issues</li>
              <li>Temporary system problem</li>
            </ul>
            <div className="flex space-x-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm font-medium cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Specialized Error Boundary for Charts
interface ChartErrorBoundaryProps {
  children: ReactNode
  chartName?: string
}

export function ChartErrorBoundary({ children, chartName = "Chart" }: ChartErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-center h-96 text-center">
            <div className="space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-destructive">{chartName} Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Unable to load chart data. Please refresh the page or try again later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
      onError={(error, errorInfo) => {
        // In production, you'd want to log this to an error reporting service
        console.error(`Chart Error in ${chartName}:`, error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}