import { supabase } from '../supabase'

interface ScanSessionData {
  id: string
  organizationId: string
  locationId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  bottleCount: number
  scannedBottles: Array<{
    bottleId: string
    rfidTag: string
    isNew: boolean
    scannedAt: Date
  }>
}

export class ScanningService {

  static async createSession(data: {
    organizationId: string
    locationId: string
    userId: string
  }): Promise<ScanSessionData> {
    const { data: dbData, error } = await supabase
      .from('scan_sessions')
      .insert({
        organization_id: data.organizationId,
        location_id: data.locationId,
        user_id: data.userId,
        bottle_count: 0,
        metadata: { scannedBottles: [] }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scan session:', error)
      throw error
    }

    return {
      id: dbData.id,
      organizationId: dbData.organization_id,
      locationId: dbData.location_id,
      userId: dbData.user_id,
      startedAt: new Date(dbData.started_at),
      completedAt: dbData.completed_at ? new Date(dbData.completed_at) : undefined,
      bottleCount: dbData.bottle_count,
      scannedBottles: dbData.metadata?.scannedBottles || []
    }
  }

  static async updateSession(
    sessionId: string, 
    updates: Partial<ScanSessionData>
  ): Promise<ScanSessionData> {
    const updateData: any = {}
    
    if (updates.bottleCount !== undefined) updateData.bottle_count = updates.bottleCount
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt?.toISOString()
    if (updates.scannedBottles !== undefined) {
      updateData.metadata = { scannedBottles: updates.scannedBottles }
    }

    const { data, error } = await supabase
      .from('scan_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating scan session:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      locationId: data.location_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      bottleCount: data.bottle_count,
      scannedBottles: data.metadata?.scannedBottles || []
    }
  }

  static async completeSession(
    sessionId: string,
    scannedBottles: Array<{
      bottleId: string
      rfidTag: string
      isNew: boolean
      scannedAt: Date
    }>
  ): Promise<ScanSessionData> {
    const session = await this.updateSession(sessionId, {
      completedAt: new Date(),
      bottleCount: scannedBottles.length,
      scannedBottles
    })

    // Update last_scanned timestamp for all bottles in this session
    const bottleIds = scannedBottles.filter(b => !b.isNew).map(b => b.bottleId)
    if (bottleIds.length > 0) {
      await supabase
        .from('bottles')
        .update({ last_scanned: new Date().toISOString() })
        .in('id', bottleIds)
    }

    // Create activity log for the scan session
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: session.organizationId,
        user_id: session.userId,
        action: 'scan_session_completed',
        resource_type: 'scan_session',
        resource_id: sessionId,
        metadata: {
          location_id: session.locationId,
          bottle_count: scannedBottles.length,
          new_bottles: scannedBottles.filter(b => b.isNew).length
        }
      })

    return session
  }

  static async getSession(sessionId: string): Promise<ScanSessionData | null> {
    const { data, error } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching scan session:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      locationId: data.location_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      bottleCount: data.bottle_count,
      scannedBottles: data.metadata?.scannedBottles || []
    }
  }

  static async getSessionsByOrganization(organizationId: string): Promise<ScanSessionData[]> {
    const { data, error } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching scan sessions:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      locationId: row.location_id,
      userId: row.user_id,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      bottleCount: row.bottle_count,
      scannedBottles: row.metadata?.scannedBottles || []
    }))
  }

  static async updateBottleInventory(
    organizationId: string,
    locationId: string,
    scannedBottles: Array<{
      bottleId: string
      rfidTag: string
      isNew: boolean
      scannedAt: Date
    }>
  ): Promise<{
    updatedBottles: number
    newBottles: number
    errors: string[]
  }> {
    const knownBottles = scannedBottles.filter(b => !b.isNew)
    const unknownBottles = scannedBottles.filter(b => b.isNew)
    const errors: string[] = []

    // Update locations and timestamps for known bottles
    if (knownBottles.length > 0) {
      try {
        const { error } = await supabase
          .from('bottles')
          .update({ 
            location_id: locationId,
            last_scanned: new Date().toISOString()
          })
          .in('id', knownBottles.map(b => b.bottleId))
          .eq('organization_id', organizationId)

        if (error) {
          console.error('Error updating bottle locations:', error)
          errors.push('Failed to update some bottle locations')
        }
      } catch (err) {
        console.error('Error updating bottles:', err)
        errors.push('Failed to update bottle inventory')
      }
    }

    return {
      updatedBottles: knownBottles.length,
      newBottles: unknownBottles.length,
      errors
    }
  }

  static async processBulkInventoryAddition(
    organizationId: string,
    locationId: string,
    unknownTags: Array<{
      rfidTag: string
      scannedAt: Date
    }>
  ): Promise<{
    success: boolean
    processed: number
    errors: string[]
  }> {
    try {
      // Create activity log for bulk processing
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: 'system', // Would be actual user ID in real implementation
          action: 'bulk_inventory_processing',
          resource_type: 'bottles',
          metadata: {
            location_id: locationId,
            unknown_tags_count: unknownTags.length,
            tags: unknownTags.map(t => t.rfidTag)
          }
        })

      return {
        success: true,
        processed: unknownTags.length,
        errors: []
      }
    } catch (error) {
      console.error('Error processing bulk inventory addition:', error)
      return {
        success: false,
        processed: 0,
        errors: ['Failed to process bulk inventory addition']
      }
    }
  }
}