// Debug utility to test authentication flow
import { supabase, getCurrentUserWithOrg } from '../lib/supabase'

export async function debugAuthFlow() {
  console.log('=== DEBUG AUTH FLOW ===')

  try {
    // Test 1: Basic Supabase connection
    console.log('1. Testing Supabase connection...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session result:', { session: !!session, error: sessionError })

    if (sessionError) {
      console.error('Session error:', sessionError)
      return { success: false, error: 'Session error' }
    }

    // Test 2: User authentication
    if (!session?.user) {
      console.log('2. No authenticated user found')
      return { success: true, error: 'No user session' }
    }


    // Test 3: User profile loading
    console.log('3. Testing getCurrentUserWithOrg...')
    const { user, profile, organization, error: profileError } = await getCurrentUserWithOrg()

    console.log('Profile result:', {
      user: !!user,
      profile: !!profile,
      organization: !!organization,
      error: profileError
    })

    if (profileError) {
      console.error('Profile error details:', profileError)
    }


    return {
      success: true,
      data: { user, profile, organization, error: profileError }
    }

  } catch (error) {
    console.error('Debug auth flow error:', error)
    return { success: false, error }
  }
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuthFlow = debugAuthFlow
}