import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, getCurrentUserWithOrg, hasPermission } from '../lib/supabase'
import type { Database } from '../types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']

interface AuthContextType {
  // Authentication state
  user: User | null
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  
  // Loading states
  loading: boolean
  
  // Actions
  signIn: (_email: string, _password: string) => Promise<{ error?: any }>
  signUp: (_email: string, _password: string, _metadata?: any) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (_updates: Partial<Profile>) => Promise<{ error?: any }>
  
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
  const [initialized, setInitialized] = useState(false)

  // Load user profile and organization data
  const loadUserData = useCallback(async (authUser: User) => {
    setUser(authUser)
    
    try {
      const { profile, organization, error } = await getCurrentUserWithOrg()
      
      if (error) {
        console.error('Error loading user data:', error)
        setProfile(null)
        setOrganization(null)
        return
      }
      
      setProfile(profile)
      setOrganization(organization)
    } catch (err) {
      console.error('Exception loading user data:', err)
      setProfile(null)
      setOrganization(null)
    }
  }, [])

  // Load initial auth state
  useEffect(() => {
    let mounted = true
    
    async function getInitialSession() {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!mounted) return
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      setSession(session)
      
      if (session?.user) {
        await loadUserData(session.user)
      }
      
      if (mounted) {
        setLoading(false)
        setInitialized(true)
      }
    }

    getInitialSession()
    
    return () => {
      mounted = false
    }
  }, []) // Remove loadUserData dependency

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process auth changes after initial load to prevent loops
        if (!initialized) return
        
        console.log('Auth state change:', event, session?.user?.id)
        setSession(session)
        
        if (session?.user) {
          setUser(session.user)
          // Try to load profile data, but don't block on it
          loadUserData(session.user).catch(console.error)
        } else {
          setUser(null)
          setProfile(null)
          setOrganization(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [initialized]) // Only depend on initialized state

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { error }
  }, [])

  // Sign up
  const signUp = useCallback(async (email: string, password: string, metadata = {}) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    return { error }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    console.log('Signing out user')
    // Clear state immediately to prevent stale data
    setUser(null)
    setProfile(null)
    setOrganization(null)
    setSession(null)
    
    await supabase.auth.signOut()
  }, [])

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (!error && profile) {
      setProfile({ ...profile, ...updates })
    }
    
    return { error }
  }, [user, profile])

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return profile?.role === role
  }, [profile?.role])

  // Check if user can access resource (role hierarchy)
  const canAccess = useCallback((requiredRole: string) => {
    if (!profile?.role) return false
    return hasPermission(profile.role, requiredRole)
  }, [profile?.role])

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    profile,
    organization,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    canAccess
  }), [
    user,
    session, 
    profile,
    organization,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
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