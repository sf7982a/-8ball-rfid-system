import type { Bottle, BottleWithLocation, BottleFilters, BottleSortConfig, Location } from '../../types/inventory'
import { supabase } from '../supabase'
import { validateData, createBottleSchema, updateBottleSchema, bottleFiltersSchema, paginationSchema } from '../validation/schemas'

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

// Helper function to get a default tier_id
async function getDefaultTierId(): Promise<string | null> {
  // Try different possible table names for tiers
  const possibleTableNames = ['bottle_tiers', 'tiers', 'product_tiers', 'item_tiers']

  for (const tableName of possibleTableNames) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)
        .single()

      if (!error && data) {
        return data.id
      }
    } catch (error) {
      // Silently continue to next table name (expected for non-existent tables)
    }
  }

  // If no tier tables found, try to get an existing tier_id from an existing bottle
  try {
    const { data, error } = await supabase
      .from('bottles')
      .select('tier_id')
      .not('tier_id', 'is', null)
      .limit(1)
      .single()

    if (!error && data && data.tier_id) {
      console.log('Found existing tier_id from existing bottle:', data.tier_id)
      return data.tier_id
    }
  } catch (error) {
    console.log('Could not find existing tier_id from bottles')
  }

  return null
}

export class BottleService {
  static async getBottles(
    organizationId: string,
    filters: BottleFilters = {},
    sort: BottleSortConfig = { field: 'createdAt', direction: 'desc' },
    page = 1,
    limit = 50
  ): Promise<{ bottles: BottleWithLocation[], total: number }> {
    // Validate organization ID
    if (!organizationId || typeof organizationId !== 'string') {
      throw new Error('Valid organization ID is required')
    }

    // Validate filters
    const filtersValidation = validateData(bottleFiltersSchema, filters)
    if (!filtersValidation.success) {
      throw new Error(`Invalid filters: ${filtersValidation.error}`)
    }

    // Validate pagination
    const paginationValidation = validateData(paginationSchema, { page, limit })
    if (!paginationValidation.success) {
      throw new Error(`Invalid pagination: ${paginationValidation.error}`)
    }

    const validatedFilters = filtersValidation.data
    const validatedPagination = paginationValidation.data
    let query = supabase
      .from('bottles')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('organization_id', organizationId)

    // Apply filters using validated data
    if (validatedFilters.search) {
      // Escape special characters and use proper parameter binding to prevent SQL injection
      const escapedSearch = validatedFilters.search.replace(/[%_\\]/g, '\\$&')
      query = query.or(`brand.ilike.%${escapedSearch}%,product.ilike.%${escapedSearch}%,rfid_tag.ilike.%${escapedSearch}%`)
    }

    if (validatedFilters.type) {
      query = query.eq('type', validatedFilters.type)
    }

    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    if (validatedFilters.locationId) {
      if (validatedFilters.locationId === 'unassigned') {
        query = query.is('location_id', null)
      } else {
        query = query.eq('location_id', validatedFilters.locationId)
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

    // Apply pagination using validated data
    const validPage = validatedPagination.page || 1
    const validLimit = validatedPagination.limit || 50
    const offset = (validPage - 1) * validLimit
    query = query.range(offset, offset + validLimit - 1)

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
      tier: row.tier_id, // map tier_id to tier
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
      tier: data.tier_id, // map tier_id to tier
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
    // Validate organization ID
    if (!organizationId || typeof organizationId !== 'string') {
      throw new Error('Valid organization ID is required')
    }

    // Validate bottle data
    const validation = validateData(createBottleSchema, bottleData)
    if (!validation.success) {
      throw new Error(`Invalid bottle data: ${validation.error}`)
    }

    const validatedData = validation.data
    // Get a default tier_id if none provided
    const tierId = validatedData.tier || await getDefaultTierId()

    if (!tierId) {
      throw new Error('No tier_id provided and no default tier available. Please ensure tiers are configured in the database.')
    }

    const { data, error } = await supabase
      .from('bottles')
      .insert({
        organization_id: organizationId,
        location_id: validatedData.locationId || null,
        rfid_tag: validatedData.rfidTag,
        brand: validatedData.brand,
        product: validatedData.product,
        type: validatedData.type,
        tier_id: tierId,
        size: validatedData.size,
        size_ml: parseSize(validatedData.size),
        cost_price: validatedData.costPrice || null,
        retail_price: validatedData.retailPrice || null,
        current_quantity: (validatedData.currentQuantity || 1.0).toString(),
        status: validatedData.status,
        metadata: {}
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
      tier: data.tier_id, // map tier_id to tier
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
    // Get a default tier_id for bottles that don't have one
    const defaultTierId = await getDefaultTierId()

    if (!defaultTierId) {
      throw new Error('No default tier available for bulk creation. Please ensure tiers are configured in the database.')
    }

    const insertData = bottlesData.map(bottleData => ({
      organization_id: organizationId,
      location_id: bottleData.locationId || null,
      rfid_tag: bottleData.rfidTag,
      brand: bottleData.brand,
      product: bottleData.product,
      type: bottleData.type,
      tier_id: bottleData.tierId || defaultTierId,
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
      tier: data.tier_id, // map tier_id to tier
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
    if (updates.tier !== undefined) updateData.tier_id = updates.tier
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
      tier: data.tier_id, // map tier_id to tier
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
      tier: data.tier_id, // map tier_id to tier
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