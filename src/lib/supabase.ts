// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with TypeScript types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // More secure auth flow
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Optimize for RFID scanning
    }
  }
})

// Helper function to get current user with organization
export async function getCurrentUserWithOrg() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { user: null, profile: null, organization: null, error: authError }
  }

  // Get user profile with organization (specify exact relationship to avoid PGRST201)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations!profiles_organization_id_fkey(*)
    `)
    .eq('id', user.id)
    .single()

  return {
    user,
    profile,
    organization: profile?.organization || null,
    error: profileError
  }
}

// Helper function for role-based access control
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'staff': 1,
    'manager': 2, 
    'company_admin': 3,
    'super_admin': 4
  }
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}