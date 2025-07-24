/**
 * RFID Error Boundary Component
 * 
 * Specialized error boundary for RFID-related operations that provides
 * contextual error messages and recovery options for hardware issues.
 */

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  AlertTriangle,
  RefreshCw,
  Wifi,
  Settings,
  ExternalLink
} from 'lucide-react'

interface RFIDErrorBoundaryState {
  hasError: boolean
  errorType: 'connection' | 'hardware' | 'permission' | 'unknown'
  errorMessage: string
  errorStack?: string
}

interface RFIDErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

/**
 * RFID-specific error boundary with hardware-aware error handling
 */
export class RFIDErrorBoundary extends Component<RFIDErrorBoundaryProps, RFIDErrorBoundaryState> {
  constructor(props: RFIDErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorType: 'unknown',
      errorMessage: '',
      errorStack: undefined
    }
  }

  static getDerivedStateFromError(error: Error): RFIDErrorBoundaryState {
    const errorMessage = error.message.toLowerCase()
    
    // Categorize RFID-specific errors
    let errorType: RFIDErrorBoundaryState['errorType'] = 'unknown'
    
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      errorType = 'connection'
    } else if (errorMessage.includes('hardware') || errorMessage.includes('device') || errorMessage.includes('rfid')) {
      errorType = 'hardware'
    } else if (errorMessage.includes('permission') || errorMessage.includes('access')) {
      errorType = 'permission'
    }

    return {
      hasError: true,
      errorType,
      errorMessage: error.message,
      errorStack: error.stack
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('RFID Error Boundary caught an error:', {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
  }

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      errorType: 'unknown',
      errorMessage: '',
      errorStack: undefined
    })
    
    // Call optional reset callback
    this.props.onReset?.()
  }

  /**
   * Get error-specific UI content
   */
  getErrorContent() {
    const { errorType } = this.state

    switch (errorType) {
      case 'connection':
        return {
          title: 'RFID Connection Error',
          description: 'Unable to connect to the RFID reader. Please check your hardware connection.',
          suggestions: [
            'Ensure the RFD40 sled is properly attached',
            'Check USB/Bluetooth connection',
            'Verify the device is powered on',
            'Try reconnecting the hardware'
          ],
          actions: [
            { label: 'Retry Connection', icon: Wifi, primary: true },
            { label: 'Check Settings', icon: Settings, primary: false }
          ]
        }

      case 'hardware':
        return {
          title: 'RFID Hardware Error',
          description: 'There was a problem with the RFID hardware or drivers.',
          suggestions: [
            'Ensure you are using Zebra Enterprise Browser',
            'Verify RFID permissions are enabled',
            'Check that RFD40/RFD90 drivers are installed',
            'Restart the Enterprise Browser application'
          ],
          actions: [
            { label: 'Reload Page', icon: RefreshCw, primary: true },
            { label: 'Check Documentation', icon: ExternalLink, primary: false }
          ]
        }

      case 'permission':
        return {
          title: 'RFID Permission Error',
          description: 'The application does not have permission to access RFID hardware.',
          suggestions: [
            'Enable RFID permissions in Enterprise Browser',
            'Check application configuration settings',
            'Verify you have administrator privileges',
            'Contact your system administrator'
          ],
          actions: [
            { label: 'Check Settings', icon: Settings, primary: true },
            { label: 'Reload Page', icon: RefreshCw, primary: false }
          ]
        }

      default:
        return {
          title: 'RFID System Error',
          description: 'An unexpected error occurred with the RFID system.',
          suggestions: [
            'Try refreshing the page',
            'Check your network connection',
            'Verify hardware is functioning properly',
            'Contact technical support if the issue persists'
          ],
          actions: [
            { label: 'Reload Page', icon: RefreshCw, primary: true },
            { label: 'Reset Application', icon: Settings, primary: false }
          ]
        }
    }
  }

  /**
   * Handle action button clicks
   */
  handleAction = (actionLabel: string) => {
    switch (actionLabel) {
      case 'Retry Connection':
      case 'Reload Page':
        window.location.reload()
        break
        
      case 'Reset Application':
        // Clear any stored RFID state
        if (typeof window !== 'undefined' && window.localStorage) {
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.includes('rfid') || key.includes('scan')
          )
          keysToRemove.forEach(key => localStorage.removeItem(key))
        }
        this.handleReset()
        break
        
      case 'Check Settings':
        // In a real app, this might open a settings dialog
        alert('Please check your RFID settings in Enterprise Browser configuration.')
        break
        
      case 'Check Documentation':
        // Open Zebra documentation
        window.open('https://developer.zebra.com/products/rfid', '_blank')
        break
        
      default:
        this.handleReset()
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const errorContent = this.getErrorContent()

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              {errorContent.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Error Description */}
            <Alert className="border-destructive/50">
              <AlertDescription>
                {errorContent.description}
              </AlertDescription>
            </Alert>

            {/* Technical Details (collapsible) */}
            <details className="bg-muted/50 p-4 rounded-lg">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Technical Details
              </summary>
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <strong>Error Type:</strong> {this.state.errorType}
                </div>
                <div>
                  <strong>Message:</strong> {this.state.errorMessage}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date().toLocaleString()}
                </div>
                <div>
                  <strong>User Agent:</strong> {navigator.userAgent}
                </div>
                {this.state.errorStack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                      {this.state.errorStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {/* Troubleshooting Suggestions */}
            <div>
              <h4 className="font-medium mb-3">Troubleshooting Steps:</h4>
              <ul className="space-y-2 text-sm">
                {errorContent.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground font-mono text-xs mt-0.5">
                      {index + 1}.
                    </span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {errorContent.actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => this.handleAction(action.label)}
                  variant={action.primary ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Emergency Reset */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                If the problem persists, you can try resetting the RFID system:
              </p>
              <Button 
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset RFID System
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

/**
 * Higher-order component to wrap components with RFID error boundary
 */
export function withRFIDErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onReset?: () => void
) {
  return function WrappedComponent(props: P) {
    return (
      <RFIDErrorBoundary onReset={onReset}>
        <Component {...props} />
      </RFIDErrorBoundary>
    )
  }
}