# Production Authentication Configuration

This guide provides the optimized authentication setup for production deployment, removing development refresh issues and ensuring secure, fast authentication.

## Production AuthContext Optimizations

### Remove Development-Only Auth Refresh

Update your `AuthContext.tsx` to remove development-specific auto-refresh logic:

```typescript
// In src/contexts/AuthContext.tsx
useEffect(() => {
  let mounted = true

  // Get initial session
  const initializeAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setSession(null)
        setProfile(null)
        setOrganization(null)
      } else {
        setUser(session?.user ?? null)
        setSession(session)

        if (session?.user) {
          await loadUserData()
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }

  initializeAuth()

  // Set up auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (!mounted) return

      console.log('🔐 Auth event:', event)

      setUser(session?.user ?? null)
      setSession(session)

      if (session?.user) {
        await loadUserData()
      } else {
        setProfile(null)
        setOrganization(null)
      }

      setLoading(false)
    }
  )

  // REMOVE THIS DEVELOPMENT-ONLY BLOCK IN PRODUCTION:
  // Only enable auto-refresh in development
  // if (import.meta.env.DEV) {
  //   const refreshInterval = setInterval(async () => {
  //     // Development refresh logic
  //   }, 30000)
  //   return () => clearInterval(refreshInterval)
  // }

  return () => {
    mounted = false
    subscription.unsubscribe()
  }
}, [loadUserData])
```

## Supabase Production Auth Settings

### 1. Authentication Configuration

In your Supabase dashboard > Authentication > Settings:

```bash
# Site URL (your production domain)
Site URL: https://your-domain.vercel.app

# Additional Redirect URLs
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app/login
https://your-domain.vercel.app/dashboard
https://your-domain.vercel.app/

# JWT Settings
JWT expiry: 3600 (1 hour)
Refresh token rotation: Enabled
Reuse interval: 10 (seconds)
```

### 2. Email Templates (Production)

Update email templates for production:

```html
<!-- Confirmation Email Template -->
<h2>Welcome to 8Ball RFID</h2>
<p>Click the link below to confirm your account:</p>
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">
  Confirm Account
</a>

<!-- Password Reset Template -->
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">
  Reset Password
</a>
```

### 3. Security Policies

Enable these security features:

```sql
-- Row Level Security (already implemented)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;

-- Additional security policies for production
CREATE POLICY "Users can only see their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Organization members can see organization data" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
    )
  );
```

## Environment Variables for Auth

### Required Production Variables

```bash
# Supabase Auth Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application URLs
VITE_APP_URL=https://your-domain.vercel.app

# Security Settings
VITE_DEBUG_MODE=false
VITE_SHOW_DEBUG_AUTH=false
VITE_VERBOSE_LOGGING=false

# Session Management
VITE_SESSION_TIMEOUT=3600000
VITE_REFRESH_THRESHOLD=300000
```

## Production Auth Flow

### 1. Login Process
```typescript
// Optimized sign-in for production
const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Log error for monitoring (without sensitive data)
      console.error('Sign in failed:', error.message)
      return { error }
    }

    // Success - AuthContext will handle state updates
    return { error: null }
  } catch (error) {
    console.error('Sign in exception:', error)
    return { error: { message: 'Network error. Please try again.' } }
  }
}
```

### 2. Session Management
```typescript
// Production session validation
const validateSession = useCallback(async () => {
  if (!session) return false

  const now = new Date().getTime()
  const sessionExpiry = session.expires_at ? session.expires_at * 1000 : now

  // Check if session is about to expire (5 minutes before)
  if (sessionExpiry - now < 300000) {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh failed:', error)
        await signOut()
        return false
      }
      return true
    } catch (error) {
      console.error('Session validation failed:', error)
      return false
    }
  }

  return true
}, [session, signOut])
```

### 3. Error Handling
```typescript
// Production error handling
const handleAuthError = (error: any) => {
  // Remove sensitive information
  const sanitizedError = {
    message: error.message || 'Authentication failed',
    // Don't expose internal error details in production
  }

  // Log for monitoring (use your monitoring service)
  if (import.meta.env.PROD) {
    // Send to error tracking service (Sentry, etc.)
    console.error('Auth error:', sanitizedError)
  }

  return sanitizedError
}
```

## Performance Optimizations

### 1. Reduce Auth API Calls
```typescript
// Cache auth state to reduce API calls
const useAuthCache = () => {
  const cacheKey = 'auth_state'
  const cacheDuration = 5 * 60 * 1000 // 5 minutes

  const getCachedAuth = () => {
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > cacheDuration) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return data
  }

  const setCachedAuth = (data: any) => {
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  }

  return { getCachedAuth, setCachedAuth }
}
```

### 2. Lazy Load Auth Data
```typescript
// Only load user data when needed
const useAuthData = () => {
  const [authData, setAuthData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadAuthData = useCallback(async () => {
    if (authData) return authData // Already loaded

    setLoading(true)
    try {
      const { profile, organization } = await getCurrentUserWithOrg()
      const data = { profile, organization }
      setAuthData(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [authData])

  return { authData, loading, loadAuthData }
}
```

## Security Hardening

### 1. Content Security Policy
Add to your `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://your-project.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://your-project.supabase.co wss://your-project.supabase.co;
  font-src 'self' data:;
">
```

### 2. Remove Debug Components
Ensure debug components are not included in production builds:

```typescript
// In App.tsx - remove or conditionally render
{import.meta.env.DEV && (
  <Route path="/debug-auth" element={<DebugAuth />} />
)}
```

### 3. Production Route Guards
```typescript
// Enhanced route protection for production
const ProtectedRoute = ({ children, requiredRole }: {
  children: React.ReactNode
  requiredRole?: string
}) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasPermission(profile.role, requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

## Monitoring & Alerts

### 1. Auth Metrics to Track
- Login success/failure rates
- Session duration
- Password reset requests
- Failed authentication attempts
- Token refresh failures

### 2. Error Tracking
```typescript
// Send auth errors to monitoring service
const trackAuthEvent = (event: string, metadata?: any) => {
  if (import.meta.env.PROD) {
    // Replace with your monitoring service
    // analytics.track('auth_event', { event, ...metadata })
  }
}
```

This production authentication setup will ensure:
- ✅ No development refresh issues
- ✅ Secure session management
- ✅ Optimized performance
- ✅ Proper error handling
- ✅ Security hardening

Your authentication will now match the performance of your 0.085ms database optimization!