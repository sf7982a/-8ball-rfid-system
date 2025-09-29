import type { Bottle, BottleWithLocation, BottleFilters, BottleSortConfig, Location, Tier } from '../../types/inventory'
import { supabase } from '../supabase'

// Convert size string (e.g., "750ml", "1L") to numeric ml value
function parseSize(sizeStr: string): number {
  if (!sizeStr) return 750 // default to 750ml
  
  const lowerSize = sizeStr.toLowerCase()
  
  // Extract numeric value
  const match = lowerSize.match(/(\d+(?:\.\d+)?)\s*(ml|l|oz|cl)?/)
  if (!match) return 750
  
  const value = parseFloat(match[1])
  const unit = match[2] || 'ml'
  
  // Convert to ml
  switch (unit) {
    case 'l': return value * 1000
    case 'cl': return value * 10
    case 'oz': return Math.round(value * 29.5735) // fluid ounces to ml
    case 'ml':
    default: return value
  }
}

export class BottleService {
  static async getBottles(
    organizationId: string,
    filters: BottleFilters = {},
    sort: BottleSortConfig = { field: 'createdAt', direction: 'desc' },
    page = 1,
    limit = 50
  ): Promise<{ bottles: BottleWithLocation[], total: number }> {
    let query = supabase
      .from('bottles')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('organization_id', organizationId)

    // Apply filters
    if (filters.search) {
      query = query.or(`brand.ilike.%${filters.search}%,product.ilike.%${filters.search}%,rfid_tag.ilike.%${filters.search}%`)
    }

    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.locationId) {
      if (filters.locationId === 'unassigned') {
        query = query.is('location_id', null)
      } else {
        query = query.eq('location_id', filters.locationId)
      }
    }

    // Apply sorting
    const orderColumn = sort.field === 'createdAt' ? 'created_at' : 
                       sort.field === 'updatedAt' ? 'updated_at' : sort.field
    query = query.order(orderColumn, { ascending: sort.direction === 'asc' })

    // Get count for pagination
    const { count } = await supabase
      .from('bottles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bottles:', error)
      throw error
    }

    // Transform database rows to match our types
    const bottles: BottleWithLocation[] = (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      locationId: row.location_id,
      rfidTag: row.rfid_tag,
      brand: row.brand,
      product: row.product,
      type: row.type,
      size: row.size,
      costPrice: row.cost_price,
      retailPrice: row.retail_price,
      currentQuantity: row.current_quantity,
      status: row.status,
      lastScanned: row.last_scanned ? new Date(row.last_scanned) : null,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      location: row.location ? {
        id: row.location.id,
        organizationId: row.location.organization_id,
        name: row.location.name,
        code: row.location.code,
        settings: row.location.settings,
        isActive: row.location.is_active,
        createdAt: new Date(row.location.created_at),
        updatedAt: new Date(row.location.updated_at)
      } : null
    }))

    return { bottles, total: count || 0 }
  }

  static async getBottle(id: string, organizationId: string): Promise<BottleWithLocation | null> {
    const { data, error } = await supabase
      .from('bottles')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching bottle:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      locationId: data.location_id,
      rfidTag: data.rfid_tag,
      brand: data.brand,
      product: data.product,
      type: data.type,
      size: data.size,
      costPrice: data.cost_price,
      retailPrice: data.retail_price,
      currentQuantity: data.current_quantity,
      status: data.status,
      lastScanned: data.last_scanned ? new Date(data.last_scanned) : null,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      location: data.location ? {
        id: data.location.id,
        organizationId: data.location.organization_id,
        name: data.location.name,
        code: data.location.code,
        settings: data.location.settings,
        isActive: data.location.is_active,
        createdAt: new Date(data.location.created_at),
        updatedAt: new Date(data.location.updated_at)
      } : null
    }
  }

  static async createBottle(organizationId: string, bottleData: any): Promise<Bottle> {
    // Get default tier_id if not provided
    let tierId = bottleData.tierId
    if (!tierId) {
      const defaultTier = await TierService.getDefaultTier()
      tierId = defaultTier?.id
    }

    if (!tierId) {
      throw new Error('Unable to determine tier for bottle. Please contact support.')
    }

    const { data, error } = await supabase
      .from('bottles')
      .insert({
        organization_id: organizationId,
        location_id: bottleData.locationId || null,
        tier_id: tierId,
        rfid_tag: bottleData.rfidTag,
        brand: bottleData.brand,
        product: bottleData.product,
        type: bottleData.type,
        size: bottleData.size,
        size_ml: parseSize(bottleData.size),
        cost_price: bottleData.costPrice,
        retail_price: bottleData.retailPrice,
        current_quantity: bottleData.currentQuantity || '1.00',
        status: bottleData.status || 'active',
        metadata: bottleData.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bottle:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      locationId: data.location_id,
      rfidTag: data.rfid_tag,
      brand: data.brand,
      product: data.product,
      type: data.type,
      size: data.size,
      costPrice: data.cost_price,
      retailPrice: data.retail_price,
      currentQuantity: data.current_quantity,
      status: data.status,
      lastScanned: data.last_scanned ? new Date(data.last_scanned) : null,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async createBottlesBulk(organizationId: string, bottlesData: any[]): Promise<Bottle[]> {
    // Get default tier if needed
    const defaultTier = await TierService.getDefaultTier()
    if (!defaultTier) {
      throw new Error('Unable to determine default tier for bottles. Please contact support.')
    }

    const insertData = bottlesData.map(bottleData => ({
      organization_id: organizationId,
      location_id: bottleData.locationId || null,
      tier_id: bottleData.tierId || defaultTier.id,
      rfid_tag: bottleData.rfidTag,
      brand: bottleData.brand,
      product: bottleData.product,
      type: bottleData.type,
      size: bottleData.size,
      size_ml: parseSize(bottleData.size),
      cost_price: bottleData.costPrice,
      retail_price: bottleData.retailPrice,
      current_quantity: bottleData.currentQuantity || '1.00',
      status: bottleData.status || 'active',
      metadata: bottleData.metadata || {}
    }))

    const { data, error } = await supabase
      .from('bottles')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Error creating bottles in bulk:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      locationId: row.location_id,
      rfidTag: row.rfid_tag,
      brand: row.brand,
      product: row.product,
      type: row.type,
      size: row.size,
      costPrice: row.cost_price,
      retailPrice: row.retail_price,
      currentQuantity: row.current_quantity,
      status: row.status,
      lastScanned: row.last_scanned ? new Date(row.last_scanned) : null,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  static async updateBottle(id: string, organizationId: string, updates: any): Promise<Bottle | null> {
    const updateData: any = {}
    
    if (updates.locationId !== undefined) updateData.location_id = updates.locationId
    if (updates.brand) updateData.brand = updates.brand
    if (updates.product) updateData.product = updates.product
    if (updates.type) updateData.type = updates.type
    if (updates.size) {
      updateData.size = updates.size
      updateData.size_ml = parseSize(updates.size)
    }
    if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice
    if (updates.retailPrice !== undefined) updateData.retail_price = updates.retailPrice
    if (updates.currentQuantity !== undefined) updateData.current_quantity = updates.currentQuantity
    if (updates.status) updateData.status = updates.status
    if (updates.lastScanned !== undefined) updateData.last_scanned = updates.lastScanned?.toISOString()
    if (updates.metadata) updateData.metadata = updates.metadata

    const { data, error } = await supabase
      .from('bottles')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error updating bottle:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      locationId: data.location_id,
      rfidTag: data.rfid_tag,
      brand: data.brand,
      product: data.product,
      type: data.type,
      size: data.size,
      costPrice: data.cost_price,
      retailPrice: data.retail_price,
      currentQuantity: data.current_quantity,
      status: data.status,
      lastScanned: data.last_scanned ? new Date(data.last_scanned) : null,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async deleteBottle(id: string, organizationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('bottles')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting bottle:', error)
      throw error
    }

    return true
  }

  static async isRfidTagUnique(rfidTag: string, organizationId: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('bottles')
      .select('id')
      .eq('rfid_tag', rfidTag)
      .eq('organization_id', organizationId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking RFID tag uniqueness:', error)
      throw error
    }

    return (data || []).length === 0
  }

  static async getBottlesByLocation(locationId: string, organizationId: string): Promise<Bottle[]> {
    const { data, error } = await supabase
      .from('bottles')
      .select('*')
      .eq('location_id', locationId)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching bottles by location:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      locationId: row.location_id,
      rfidTag: row.rfid_tag,
      brand: row.brand,
      product: row.product,
      type: row.type,
      size: row.size,
      costPrice: row.cost_price,
      retailPrice: row.retail_price,
      currentQuantity: row.current_quantity,
      status: row.status,
      lastScanned: row.last_scanned ? new Date(row.last_scanned) : null,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  static async getInventoryStats(organizationId: string) {
    const { data, error } = await supabase
      .from('bottles')
      .select('status')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching inventory stats:', error)
      throw error
    }

    const bottles = data || []
    const stats = {
      total: bottles.length,
      active: bottles.filter(b => b.status === 'active').length,
      depleted: bottles.filter(b => b.status === 'depleted').length,
      missing: bottles.filter(b => b.status === 'missing').length,
      damaged: bottles.filter(b => b.status === 'damaged').length
    }
    return stats
  }
}

export class LocationService {
  static async getLocations(organizationId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching locations:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      code: row.code,
      settings: row.settings,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }))
  }

  static async createLocation(organizationId: string, locationData: any): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        organization_id: organizationId,
        name: locationData.name,
        code: locationData.code,
        settings: locationData.settings || {},
        is_active: locationData.isActive !== false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      code: data.code,
      settings: data.settings,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async updateLocation(id: string, organizationId: string, updates: any): Promise<Location | null> {
    const updateData: any = {}
    
    if (updates.name) updateData.name = updates.name
    if (updates.code) updateData.code = updates.code
    if (updates.settings) updateData.settings = updates.settings
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error updating location:', error)
      throw error
    }

    return {
      id: data.id,
      organizationId: data.organization_id,
      name: data.name,
      code: data.code,
      settings: data.settings,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  static async deleteLocation(id: string, organizationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error deleting location:', error)
      throw error
    }

    return true
  }
}

export class TierService {
  static async getTiers(): Promise<Tier[]> {
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Error fetching tiers:', error)
      throw error
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      description: row.description,
      sort_order: row.sort_order
    }))
  }

  static async getDefaultTier(): Promise<Tier | null> {
    // Default to 'call' tier which is the most common
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .eq('name', 'call')
      .single()

    if (error) {
      console.error('Error fetching default tier:', error)
      // Fallback: get any tier
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tiers')
        .select('*')
        .order('sort_order')
        .limit(1)
        .single()

      if (fallbackError) {
        console.error('Error fetching fallback tier:', fallbackError)
        return null
      }

      return fallbackData ? {
        id: fallbackData.id,
        name: fallbackData.name,
        display_name: fallbackData.display_name,
        description: fallbackData.description,
        sort_order: fallbackData.sort_order
      } : null
    }

    return {
      id: data.id,
      name: data.name,
      display_name: data.display_name,
      description: data.description,
      sort_order: data.sort_order
    }
  }
}