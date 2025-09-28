// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced environment variable validation
if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
  throw new Error('VITE_SUPABASE_URL is required and must be a valid URL')
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
  throw new Error('VITE_SUPABASE_ANON_KEY is required and must be a valid key')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch {
  throw new Error('VITE_SUPABASE_URL must be a valid URL format')
}

// Validate Supabase URL format
if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
  console.warn('Warning: VITE_SUPABASE_URL does not appear to be a standard Supabase URL')
}

// Validate anon key format (basic check)
if (supabaseAnonKey.length < 20) {
  throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)')
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
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        user: null,
        profile: null,
        organization: null,
        error: userError || new Error('No authenticated user')
      }
    }

    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        user,
        profile: null,
        organization: null,
        error: profileError || new Error('Profile not found')
      }
    }

    // Step 2: Get organization if profile has organization_id
    let organization = null
    if ((profile as any).organization_id) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', (profile as any).organization_id)
        .single()

      if (!orgError) {
        organization = org
      }
    }

    return {
      user,
      profile,
      organization,
      error: null
    }
  } catch (error) {
    return {
      user: null,
      profile: null,
      organization: null,
      error: error instanceof Error ? error : new Error('Authentication failed')
    }
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