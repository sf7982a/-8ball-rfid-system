import React, { createContext, useContext, useEffect, useState } from 'react'
import { Organization } from '@/types/auth'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  isLoading: boolean
  switchOrganization: (_organizationId: string) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { profile, organization } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadAllOrganizations()
    } else if (organization) {
      setOrganizations([organization])
    }
  }, [profile, organization])

  const loadAllOrganizations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (error) throw error

      setOrganizations(data)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchOrganization = async (organizationId: string) => {
    // This would typically update the user's current organization in the backend
    // For now, we'll just find and set it locally
    console.log('Switching to organization:', organizationId)
  }

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization: organization,
        organizations,
        isLoading,
        switchOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = () => {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}