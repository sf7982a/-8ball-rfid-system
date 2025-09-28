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
  
  // Actions
  signIn: (_email: string, _password: string) => Promise<{ error?: any }>
  signUp: (_email: string, _password: string, _metadata?: any) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (_updates: ProfileUpdate) => Promise<{ error?: any }>
  
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

  // Simplified user data loading
  const loadUserData = useCallback(async () => {
    try {
      const { profile, organization, error } = await getCurrentUserWithOrg()

      if (error) {
        setProfile(null)
        setOrganization(null)
        return
      }

      setProfile(profile)
      setOrganization(organization)
    } catch (err) {
      setProfile(null)
      setOrganization(null)
    }
  }, [])

  // Simple initial session load
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('🔍 Auth: Loading session...')
        const { data: { session } } = await supabase.auth.getSession()

        console.log('✅ Auth: Session loaded:', !!session)
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          console.log('👤 Auth: Loading user data...')
          await loadUserData()
        }

        console.log('🏁 Auth: Loading complete')
      } catch (error) {
        console.error('💥 Auth: Load session failed:', error)
        // Don't fail completely on error - still set loading to false
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await loadUserData()
        } else {
          setProfile(null)
          setOrganization(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUserData])

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
  const updateProfile = useCallback(async (updates: ProfileUpdate) => {
    if (!user) return { error: 'No user logged in' }

    // Type assertion to work around Supabase typing issue
    const profilesTable = supabase.from('profiles') as any
    const { error } = await profilesTable
      .update(updates)
      .eq('id', user.id)

    if (!error && profile) {
      setProfile({ ...profile, ...updates } as Profile)
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