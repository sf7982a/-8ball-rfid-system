import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, getCurrentUserWithOrg, hasPermission } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type Organization = Database['public']['Tables']['organizations']['Row']

interface AuthContextType {
  // Authentication state
  user: User | null
  session: Session | null
  profile: Profile | null
  organization: Organization | null

  // Loading states
  loading: boolean
  error: string | null

  // Actions
  signIn: (_email: string, _password: string) => Promise<{ error?: any }>
  signUp: (_email: string, _password: string, _metadata?: any) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (_updates: ProfileUpdate) => Promise<{ error?: any }>
  clearError: () => void

  // Permissions
  hasRole: (_role: string) => boolean
  canAccess: (_requiredRole: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Maximum retry attempts to prevent infinite loops
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Production-safe user data loading with retry logic
  const loadUserData = useCallback(async (attemptNumber = 0): Promise<boolean> => {
    if (attemptNumber >= MAX_RETRIES) {
      console.error('❌ Auth: Max retries exceeded, giving up')
      setError('Failed to load user data after multiple attempts')
      return false
    }

    try {
      console.log(`🔄 Auth: Loading user data (attempt ${attemptNumber + 1}/${MAX_RETRIES})`)

      const result = await getCurrentUserWithOrg()

      if (result.error) {
        console.warn('⚠️ Auth: Error loading user data:', result.error.message)

        // Handle different types of errors
        if (result.error.message?.includes('Profile not found')) {
          console.log('👤 Auth: User authenticated but no profile found - this is OK for new users')
          setProfile(null)
          setOrganization(null)
          setError('Profile setup required')
          return true // Still considered successful - user can create profile
        }

        if (result.error.message?.includes('organization')) {
          console.log('🏢 Auth: Organization not found - continuing without organization')
          setProfile(result.profile)
          setOrganization(null)
          setError(null) // This is not an error - users don't need organizations
          return true
        }

        // For other errors, retry if we haven't exceeded max attempts
        if (attemptNumber < MAX_RETRIES - 1) {
          console.log(`🔄 Auth: Retrying in ${RETRY_DELAY}ms...`)
          setTimeout(() => {
            loadUserData(attemptNumber + 1)
          }, RETRY_DELAY)
          return false
        } else {
          setError(`Authentication error: ${result.error.message}`)
          setProfile(null)
          setOrganization(null)
          return false
        }
      }

      // Success case
      console.log('✅ Auth: User data loaded successfully')
      console.log('👤 Profile:', !!result.profile)
      console.log('🏢 Organization:', !!result.organization)

      setProfile(result.profile)
      setOrganization(result.organization)
      setError(null)
      setRetryCount(0) // Reset retry count on success
      return true

    } catch (err: any) {
      console.error('💥 Auth: Exception loading user data:', err)

      // Don't retry on network/parse errors - these are usually temporary
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        setError('Network error - please check your connection')
      } else if (attemptNumber < MAX_RETRIES - 1) {
        console.log(`🔄 Auth: Retrying after exception in ${RETRY_DELAY}ms...`)
        setTimeout(() => {
          loadUserData(attemptNumber + 1)
        }, RETRY_DELAY)
        return false
      } else {
        setError('Failed to load user data')
      }

      setProfile(null)
      setOrganization(null)
      return false
    }
  }, [])

  // Initialize authentication - only run once
  useEffect(() => {
    let mounted = true
    let initAttempted = false

    const initializeAuth = async () => {
      if (initAttempted) return
      initAttempted = true

      try {
        console.log('🔍 Auth: Initializing authentication...')

        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('❌ Auth: Session initialization error:', error)
          setError(`Authentication error: ${error.message}`)
          setUser(null)
          setSession(null)
          setProfile(null)
          setOrganization(null)
        } else {
          console.log('✅ Auth: Session initialized:', !!session)
          setUser(session?.user ?? null)
          setSession(session)

          if (session?.user) {
            // Load user data but don't block on it
            const success = await loadUserData()
            if (!success) {
              console.warn('⚠️ Auth: User data loading failed, but user is still authenticated')
            }
          }
        }
      } catch (error: any) {
        console.error('💥 Auth: Initialization failed:', error)
        if (mounted) {
          setError('Authentication system unavailable')
        }
      } finally {
        if (mounted) {
          console.log('🏁 Auth: Initialization complete')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, []) // Remove loadUserData from deps to prevent infinite loops

  // Auth state change listener - only run once
  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔐 Auth: State change event:', event)

        setUser(session?.user ?? null)
        setSession(session)
        setError(null) // Clear errors on auth state change

        if (session?.user && event !== 'TOKEN_REFRESHED') {
          console.log('👤 Auth: Loading user data after auth change...')
          await loadUserData()
        } else if (!session?.user) {
          console.log('👋 Auth: User signed out, clearing data')
          setProfile(null)
          setOrganization(null)
          setError(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove loadUserData from deps

  // Sign in with error handling
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      }

      return { error }
    } catch (err: any) {
      const errorMsg = 'Sign in failed - please try again'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign up with error handling
  const signUp = useCallback(async (email: string, password: string, metadata = {}) => {
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        setError(error.message)
      }

      return { error }
    } catch (err: any) {
      const errorMsg = 'Sign up failed - please try again'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    } finally {
      setLoading(false)
    }
  }, [])

  // Sign out with error handling
  const signOut = useCallback(async () => {
    try {
      console.log('👋 Auth: Signing out user')

      // Clear state immediately to prevent stale data
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setSession(null)
      setError(null)
      setRetryCount(0)

      await supabase.auth.signOut()
    } catch (error: any) {
      console.error('❌ Auth: Sign out error:', error)
      // Still clear state even if sign out fails
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setSession(null)
      setError(null)
    }
  }, [])

  // Update profile with error handling
  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user) {
      const error = 'No user logged in'
      setError(error)
      return { error }
    }

    try {
      setError(null)

      // Type assertion to work around Supabase typing issue
      const profilesTable = supabase.from('profiles') as any
      const { error } = await profilesTable
        .update(updates)
        .eq('id', user.id)

      if (error) {
        setError(error.message)
        return { error }
      }

      if (profile) {
        setProfile({ ...profile, ...updates } as Profile)
      }

      return { error: null }
    } catch (err: any) {
      const errorMsg = 'Failed to update profile'
      setError(errorMsg)
      return { error: { message: errorMsg } }
    }
  }, [user, profile])

  // Check if user has specific role (graceful fallback)
  const hasRole = useCallback((role: string) => {
    if (!profile?.role) {
      console.warn('⚠️ Auth: No profile role available for role check')
      return false
    }
    return profile.role === role
  }, [profile?.role])

  // Check if user can access resource (graceful fallback)
  const canAccess = useCallback((requiredRole: string) => {
    if (!profile?.role) {
      console.warn('⚠️ Auth: No profile role available for access check')
      return false
    }
    try {
      return hasPermission(profile.role, requiredRole)
    } catch (err) {
      console.error('❌ Auth: Permission check failed:', err)
      return false
    }
  }, [profile?.role])

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    profile,
    organization,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
    hasRole,
    canAccess
  }), [
    user,
    session,
    profile,
    organization,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
    hasRole,
    canAccess
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}