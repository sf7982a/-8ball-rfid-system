import { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from './database'

export type UserRole = 'super_admin' | 'company_admin' | 'manager' | 'staff'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']

// Extended User type with additional properties
export interface ExtendedUser extends SupabaseUser {
  fullName?: string
  organizationId?: string
  role?: UserRole
}

export interface AuthState {
  user: ExtendedUser | null
  organization: Organization | null
  isLoading: boolean
  error: Error | null
}