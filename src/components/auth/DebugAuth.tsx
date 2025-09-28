import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export function DebugAuth() {
  const { user, profile, organization, loading, session } = useAuth()

  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...')
      const { data, error } = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      })
      console.log('✅ Supabase connection test:', { data, error })
      alert('Supabase connection test completed - check console')
    } catch (err) {
      console.error('❌ Supabase connection failed:', err)
      alert('Supabase connection failed - check console')
    }
  }

  const clearAuthAndReload = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  const forceReloadAuth = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>🔧 Auth Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
            </div>
            <div>
              <strong>User:</strong> {user ? '✅ Authenticated' : '❌ None'}
            </div>
            <div>
              <strong>Profile:</strong> {profile ? '✅ Loaded' : '❌ None'}
            </div>
            <div>
              <strong>Organization:</strong> {organization ? '✅ Loaded' : '❌ None'}
            </div>
          </div>

          {user && (
            <div className="bg-green-50 p-3 rounded border text-sm">
              <strong>User Info:</strong><br />
              Email: {user.email}<br />
              Role: {profile?.role || 'No role'}<br />
              Org: {organization?.name || 'No organization'}
            </div>
          )}

          {session && (
            <div className="bg-blue-50 p-3 rounded border text-sm">
              <strong>Session:</strong> Valid until{' '}
              {new Date((session as any).expires_at * 1000).toLocaleString()}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={forceReloadAuth} variant="outline">
              🔄 Reload Auth
            </Button>
            <Button onClick={clearAuthAndReload} variant="destructive">
              🧹 Clear All & Reload
            </Button>
            <Button onClick={testSupabaseConnection} variant="secondary">
              🔗 Test Supabase
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Access this by adding `/debug-auth` to your URL
          </div>
        </CardContent>
      </Card>
    </div>
  )
}