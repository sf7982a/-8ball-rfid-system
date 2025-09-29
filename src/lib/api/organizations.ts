import { supabase } from '../supabase'
import type { Database } from '../../types/database'

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export interface OrganizationStats {
  totalUsers: number
  totalBottles: number
  totalLocations: number
  activityLogs: number
}

export class OrganizationService {
  static async getAll() {
    return getAllOrganizations()
  }

  static async getById(id: string) {
    return getOrganizationById(id)
  }

  static async create(org: OrganizationInsert) {
    return createOrganization(org)
  }

  static async update(id: string, updates: OrganizationUpdate) {
    return updateOrganization(id, updates)
  }

  static async delete(id: string) {
    return deleteOrganization(id)
  }

  static async getStats(id: string) {
    return getOrganizationStats(id)
  }
}

export async function getAllOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getOrganizationById(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createOrganization(organization: OrganizationInsert) {
  const { data, error } = await supabase
    .from('organizations')
    .insert(organization)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateOrganization(id: string, updates: OrganizationUpdate) {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteOrganization(id: string) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getOrganizationStats(organizationId: string) {
  // Placeholder for organization statistics
  return {
    totalUsers: 0,
    totalBottles: 0,
    totalLocations: 0,
    activityLogs: 0
  }
}