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
    console.log('🔍 Supabase: Getting current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('❌ Supabase: User auth error:', userError.message)
      return {
        user: null,
        profile: null,
        organization: null,
        error: userError
      }
    }

    if (!user) {
      console.log('👤 Supabase: No authenticated user found')
      return {
        user: null,
        profile: null,
        organization: null,
        error: new Error('No authenticated user')
      }
    }

    console.log('✅ Supabase: User authenticated:', user.email)

    // Step 1: Get user profile with graceful error handling
    console.log('👤 Supabase: Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('⚠️ Supabase: Profile fetch error:', profileError.message)

      // Differentiate between "not found" and other errors
      if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
        return {
          user,
          profile: null,
          organization: null,
          error: new Error('Profile not found')
        }
      } else {
        return {
          user,
          profile: null,
          organization: null,
          error: profileError
        }
      }
    }

    if (!profile) {
      console.log('👤 Supabase: Profile data is null')
      return {
        user,
        profile: null,
        organization: null,
        error: new Error('Profile not found')
      }
    }

    console.log('✅ Supabase: Profile loaded:', profile.email || 'no email')

    // Step 2: Get organization if profile has organization_id (graceful handling)
    let organization = null
    const organizationId = (profile as any).organization_id

    if (organizationId) {
      console.log('🏢 Supabase: Fetching organization:', organizationId)

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (orgError) {
        console.warn('⚠️ Supabase: Organization fetch error:', orgError.message)
        // Don't treat missing organization as a fatal error
        // User can still use the app without organization
      } else if (org) {
        console.log('✅ Supabase: Organization loaded:', org.name || 'unnamed')
        organization = org
      } else {
        console.log('🏢 Supabase: Organization not found, continuing without it')
      }
    } else {
      console.log('🏢 Supabase: No organization_id in profile, continuing without organization')
    }

    return {
      user,
      profile,
      organization,
      error: null
    }
  } catch (error: any) {
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