import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Loader2, Clock, RefreshCw } from 'lucide-react'

interface LoadingWithTimeoutProps {
  message?: string
  timeout?: number // in milliseconds
  onTimeout?: () => void
  onRetry?: () => void
  showRetry?: boolean
}

export function LoadingWithTimeout({
  message = "Loading...",
  timeout = 15000, // 15 seconds default
  onTimeout,
  onRetry,
  showRetry = true
}: LoadingWithTimeoutProps) {
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [timeLeft, setTimeLeft] = useState(Math.ceil(timeout / 1000))

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true)
      onTimeout?.()
    }, timeout)

    const intervalId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [timeout, onTimeout])

  if (hasTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Taking longer than expected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              The application is taking longer to load than usual. This might be due to a slow network connection or temporary service issues.
            </p>

            <div className="space-y-3">
              {showRetry && onRetry && (
                <Button onClick={onRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {message}
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Please wait while we set everything up for you.
          </p>

          {timeLeft > 0 && (
            <div className="text-xs text-gray-500">
              Timeout in {timeLeft}s
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default LoadingWithTimeout