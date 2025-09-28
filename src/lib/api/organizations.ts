import { supabase } from '../supabase'

// Emergency bypass flag - set to true if Supabase database calls are hanging
const USE_EMERGENCY_BYPASS = true

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  website?: string
  phone?: string
  address?: string
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  tier: 'trial' | 'basic' | 'premium' | 'enterprise'
  trial_duration_days?: number
  max_users?: number
  max_locations?: number
  storage_limit_gb?: number
  features: Record<string, boolean>
  settings: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CreateOrganizationData {
  name: string
  slug: string
  description?: string
  website?: string
  phone?: string
  address?: string
  tier: 'trial' | 'basic' | 'premium' | 'enterprise'
  trial_duration_days?: number
  max_users?: number
  max_locations?: number
  storage_limit_gb?: number
  features?: Record<string, boolean>
  settings?: Record<string, any>

  // Admin user data
  admin_email: string
  admin_first_name: string
  admin_last_name: string
  admin_phone?: string
  send_welcome_email?: boolean
}

export interface OrganizationStats {
  user_count: number
  bottles_tracked: number
  monthly_scans: number
  storage_used_mb: number
  last_activity: string
}

export class OrganizationService {
  // Mock data storage for emergency bypass
  private static mockOrganizations: (Organization & OrganizationStats)[] = [
    {
      id: '7e4c68fd-f6a8-4aa6-97a1-aa38711aafd2',
      name: '8Ball RFID Demo',
      slug: '8ball-demo',
      description: 'Demo organization for testing',
      website: 'https://8ball-rfid.com',
      phone: '+1 (555) 123-4567',
      address: '123 Demo Street, Demo City, DC 12345',
      status: 'active',
      tier: 'enterprise',
      trial_duration_days: 14,
      max_users: 50,
      max_locations: 20,
      storage_limit_gb: 100,
      features: {
        rfid_scanning: true,
        pos_integrations: true,
        theft_detection: true,
        analytics_dashboard: true,
        bulk_operations: true,
        api_access: true,
        custom_branding: true,
        advanced_reports: true
      },
      settings: {
        created_by: '4e8dbe23-af70-43f7-a389-91a52c3ba66e'
      },
      created_at: '2025-09-26T19:26:21.107183+00:00',
      updated_at: '2025-09-26T19:26:21.107183+00:00',
      created_by: '4e8dbe23-af70-43f7-a389-91a52c3ba66e',
      user_count: 1,
      bottles_tracked: 0,
      monthly_scans: 0,
      storage_used_mb: 0,
      last_activity: '2025-09-26T20:00:00.000Z'
    }
  ]

  private static getMockOrganizations(): (Organization & OrganizationStats)[] {
    return [...this.mockOrganizations]
  }

  private static createMockOrganization(data: CreateOrganizationData): Organization {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      website: data.website || '',
      phone: data.phone || '',
      address: data.address || '',
      status: data.tier === 'trial' ? 'trial' : 'active',
      tier: data.tier,
      trial_duration_days: data.trial_duration_days || 14,
      max_users: data.max_users || 5,
      max_locations: data.max_locations || 3,
      storage_limit_gb: data.storage_limit_gb || 1,
      features: data.features || {
        rfid_scanning: true,
        pos_integrations: true,
        theft_detection: false,
        analytics_dashboard: true,
        bulk_operations: false,
        api_access: false,
        custom_branding: false,
        advanced_reports: false
      },
      settings: data.settings || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '4e8dbe23-af70-43f7-a389-91a52c3ba66e'
    }

    // Add to mock storage
    this.mockOrganizations.push({
      ...newOrg,
      user_count: 1,
      bottles_tracked: 0,
      monthly_scans: 0,
      storage_used_mb: 0,
      last_activity: new Date().toISOString()
    })

    return newOrg
  }

  private static deleteMockOrganization(id: string): void {
    this.mockOrganizations = this.mockOrganizations.filter(org => org.id !== id)
  }
  /**
   * Get all organizations with statistics
   */
  static async getOrganizations(): Promise<(Organization & OrganizationStats)[]> {
    try {
      // Emergency bypass for Supabase database issues
      if (USE_EMERGENCY_BYPASS) {
        console.log('🚨 OrganizationService.getOrganizations: Using emergency bypass')
        return this.getMockOrganizations()
      }

      // Get basic organization data
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Get user counts for each organization
      const { data: userCounts, error: userError } = await supabase
        .from('profiles')
        .select('organization_id')
        .not('organization_id', 'is', null)

      if (userError) throw userError

      // Get bottle counts for each organization
      const { data: bottleCounts, error: bottleError } = await supabase
        .from('bottles')
        .select('organization_id')

      if (bottleError) throw bottleError

      // Get scan activity (this would need an activity/scans table)
      // For now, we'll use mock data for scans

      // Aggregate statistics
      const userCountMap = userCounts.reduce((acc: Record<string, number>, profile: any) => {
        acc[profile.organization_id] = (acc[profile.organization_id] || 0) + 1
        return acc
      }, {})

      const bottleCountMap = bottleCounts.reduce((acc: Record<string, number>, bottle: any) => {
        acc[bottle.organization_id] = (acc[bottle.organization_id] || 0) + 1
        return acc
      }, {})

      // Transform and combine data
      const organizationsWithStats = orgs.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.settings?.description || '',
        website: org.settings?.website || '',
        phone: org.settings?.phone || '',
        address: org.settings?.address || '',
        status: (org.settings?.status || 'active') as 'trial' | 'active' | 'suspended' | 'cancelled',
        tier: (org.settings?.tier || 'trial') as 'trial' | 'basic' | 'premium' | 'enterprise',
        trial_duration_days: org.settings?.trial_duration_days || 14,
        max_users: org.settings?.max_users || 5,
        max_locations: org.settings?.max_locations || 3,
        storage_limit_gb: org.settings?.storage_limit_gb || 1,
        features: org.settings?.features || {
          rfid_scanning: true,
          pos_integrations: true,
          theft_detection: false,
          analytics_dashboard: true,
          bulk_operations: false,
          api_access: false,
          custom_branding: false,
          advanced_reports: false
        },
        settings: org.settings || {},
        created_at: org.created_at,
        updated_at: org.updated_at,
        created_by: org.settings?.created_by,

        // Statistics
        user_count: userCountMap[org.id] || 0,
        bottles_tracked: bottleCountMap[org.id] || 0,
        monthly_scans: Math.floor(Math.random() * 10000), // Mock data for now
        storage_used_mb: Math.floor(Math.random() * 100), // Mock data for now
        last_activity: org.updated_at
      }))

      return organizationsWithStats

    } catch (error) {
      console.error('Error fetching organizations:', error)
      throw error
    }
  }

  /**
   * Create a new organization with admin user
   */
  static async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      // Emergency bypass for Supabase database issues
      if (USE_EMERGENCY_BYPASS) {
        console.log('🚨 OrganizationService.createOrganization: Using emergency bypass')
        return this.createMockOrganization(data)
      }

      // Check if slug is unique
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (existingOrg) {
        throw new Error('Organization slug already exists')
      }

      // Create organization
      const orgSettings = {
        description: data.description,
        website: data.website,
        phone: data.phone,
        address: data.address,
        status: data.tier === 'trial' ? 'trial' : 'active',
        tier: data.tier,
        trial_duration_days: data.trial_duration_days || 14,
        max_users: data.max_users || 5,
        max_locations: data.max_locations || 3,
        storage_limit_gb: data.storage_limit_gb || 1,
        features: data.features || {
          rfid_scanning: true,
          pos_integrations: true,
          theft_detection: false,
          analytics_dashboard: true,
          bulk_operations: false,
          api_access: false,
          custom_branding: false,
          advanced_reports: false
        },
        ...data.settings
      }

      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          settings: orgSettings
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Create admin user profile
      // Note: In a real app, you'd also need to create the auth user
      // This is just creating the profile assuming auth user exists

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: data.admin_email,
          first_name: data.admin_first_name,
          last_name: data.admin_last_name,
          role: 'company_admin',
          organization_id: newOrg.id
        })

      if (profileError) {
        console.warn('Failed to create admin profile:', profileError)
        // Don't throw error as organization was created successfully
      }

      // Send welcome email if requested
      if (data.send_welcome_email) {
        // Implement email sending logic here
      }

      return {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        description: orgSettings.description || '',
        website: orgSettings.website || '',
        phone: orgSettings.phone || '',
        address: orgSettings.address || '',
        status: orgSettings.status as 'trial' | 'active' | 'suspended' | 'cancelled',
        tier: orgSettings.tier,
        trial_duration_days: orgSettings.trial_duration_days,
        max_users: orgSettings.max_users,
        max_locations: orgSettings.max_locations,
        storage_limit_gb: orgSettings.storage_limit_gb,
        features: orgSettings.features,
        settings: newOrg.settings,
        created_at: newOrg.created_at,
        updated_at: newOrg.updated_at
      }

    } catch (error) {
      console.error('Error creating organization:', error)
      throw error
    }
  }

  /**
   * Update an organization
   */
  static async updateOrganization(id: string, updates: Partial<CreateOrganizationData>): Promise<Organization> {
    try {
      // Get current organization
      const { data: currentOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Merge updates with existing settings
      const updatedSettings = {
        ...currentOrg.settings,
        description: updates.description ?? currentOrg.settings?.description,
        website: updates.website ?? currentOrg.settings?.website,
        phone: updates.phone ?? currentOrg.settings?.phone,
        address: updates.address ?? currentOrg.settings?.address,
        tier: updates.tier ?? currentOrg.settings?.tier,
        trial_duration_days: updates.trial_duration_days ?? currentOrg.settings?.trial_duration_days,
        max_users: updates.max_users ?? currentOrg.settings?.max_users,
        max_locations: updates.max_locations ?? currentOrg.settings?.max_locations,
        storage_limit_gb: updates.storage_limit_gb ?? currentOrg.settings?.storage_limit_gb,
        features: updates.features ?? currentOrg.settings?.features,
        ...updates.settings
      }

      const { data: updatedOrg, error: updateError } = await supabase
        .from('organizations')
        .update({
          name: updates.name ?? currentOrg.name,
          slug: updates.slug ?? currentOrg.slug,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        id: updatedOrg.id,
        name: updatedOrg.name,
        slug: updatedOrg.slug,
        description: updatedSettings.description || '',
        website: updatedSettings.website || '',
        phone: updatedSettings.phone || '',
        address: updatedSettings.address || '',
        status: updatedSettings.status || 'active',
        tier: updatedSettings.tier || 'trial',
        trial_duration_days: updatedSettings.trial_duration_days || 14,
        max_users: updatedSettings.max_users || 5,
        max_locations: updatedSettings.max_locations || 3,
        storage_limit_gb: updatedSettings.storage_limit_gb || 1,
        features: updatedSettings.features || {},
        settings: updatedOrg.settings,
        created_at: updatedOrg.created_at,
        updated_at: updatedOrg.updated_at
      }

    } catch (error) {
      console.error('Error updating organization:', error)
      throw error
    }
  }

  /**
   * Delete an organization and all associated data
   */
  static async deleteOrganization(id: string): Promise<void> {
    try {
      // Emergency bypass for Supabase database issues
      if (USE_EMERGENCY_BYPASS) {
        console.log('🚨 OrganizationService.deleteOrganization: Using emergency bypass')
        this.deleteMockOrganization(id)
        return
      }

      // In a real implementation, you'd want to do this in a transaction
      // and possibly soft-delete with cleanup jobs

      // Delete associated data first (cascade should handle this, but being explicit)
      await supabase.from('bottles').delete().eq('organization_id', id)
      await supabase.from('locations').delete().eq('organization_id', id)
      await supabase.from('profiles').delete().eq('organization_id', id)

      // Delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error

    } catch (error) {
      console.error('Error deleting organization:', error)
      throw error
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganization(id: string): Promise<Organization | null> {
    try {
      // Emergency bypass for Supabase database issues
      if (USE_EMERGENCY_BYPASS) {
        console.log('🚨 OrganizationService.getOrganization: Using emergency bypass')
        const org = this.mockOrganizations.find(o => o.id === id)
        return org ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          website: org.website,
          phone: org.phone,
          address: org.address,
          status: org.status,
          tier: org.tier,
          trial_duration_days: org.trial_duration_days,
          max_users: org.max_users,
          max_locations: org.max_locations,
          storage_limit_gb: org.storage_limit_gb,
          features: org.features,
          settings: org.settings,
          created_at: org.created_at,
          updated_at: org.updated_at,
          created_by: org.created_by
        } : null
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.settings?.description || '',
        website: data.settings?.website || '',
        phone: data.settings?.phone || '',
        address: data.settings?.address || '',
        status: data.settings?.status || 'active',
        tier: data.settings?.tier || 'trial',
        trial_duration_days: data.settings?.trial_duration_days || 14,
        max_users: data.settings?.max_users || 5,
        max_locations: data.settings?.max_locations || 3,
        storage_limit_gb: data.settings?.storage_limit_gb || 1,
        features: data.settings?.features || {},
        settings: data.settings,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.settings?.created_by
      }

    } catch (error) {
      console.error('Error fetching organization:', error)
      throw error
    }
  }
}