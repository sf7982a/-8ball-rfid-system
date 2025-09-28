import React from 'react'
import { AlertTriangle, User, Building, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useAuth } from '../../contexts/AuthContext'

interface DashboardFallbackProps {
  error?: string | null
  showProfileSetup?: boolean
  showOrganizationMissing?: boolean
}

export function DashboardFallback({
  error,
  showProfileSetup = false,
  showOrganizationMissing = false
}: DashboardFallbackProps) {
  const { user, clearError, signOut } = useAuth()

  const handleRetry = () => {
    clearError()
    window.location.reload()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <User className="h-5 w-5" />
              Profile Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Welcome! Your account needs a profile to access the dashboard.</p>
              <p className="mt-2">User: <strong>{user?.email}</strong></p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.href = '/settings'}
                className="w-full"
              >
                Set Up Profile
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showOrganizationMissing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Building className="h-5 w-5" />
              Limited Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Your account isn't associated with an organization yet.</p>
              <p className="mt-2">Contact your administrator to be added to an organization for full access.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => window.location.href = '/settings'}
                className="w-full"
              >
                View Settings
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>Unable to load the dashboard.</p>
              <p className="mt-2 text-xs bg-red-50 p-2 rounded">{error}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Generic loading fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">This is taking longer than expected</p>

          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}