import { supabase } from '../supabase'
import type { BottleType } from '../../types/inventory'

export interface DashboardStats {
  totalBottles: number
  totalValue: number
  activeBottles: number
  lowStockCount: number
}

export interface LocationStats {
  locationId: string
  locationName: string
  locationCode: string
  bottleCount: number
  totalValue: number
  lowStockCount: number
}

export interface BrandStats {
  brand: string
  bottleCount: number
  totalValue: number
  locations: { name: string; count: number }[]
}

export interface TypeStats {
  type: BottleType
  bottleCount: number
  totalValue: number
  totalQuantity: number
}

export interface LowStockItem {
  id: string
  brand: string
  product: string
  type: BottleType
  currentQuantity: number
  locationName: string
  lastScanned: Date | null
}

interface BottleWithLocationInfo {
  current_quantity: string
  retail_price: string
  status: string
  location: {
    id: string
    name: string
    code: string
  } | null
}

interface BottleWithBrandInfo {
  brand: string
  current_quantity: string
  retail_price: string
  location: {
    name: string
  } | null
}

interface LowStockBottle {
  id: string
  brand: string
  product: string
  type: string
  current_quantity: string
  last_scanned: string | null
  location: {
    name: string
  } | null
}

export class DashboardService {
  static async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const { data, error } = await supabase
      .from('bottles')
      .select('current_quantity, retail_price, status')
      .eq('organization_id', organizationId)

    if (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }

    const bottles = data || []
    const activeBottles = bottles.filter(b => b.status === 'active')
    
    const totalBottles = bottles.length
    const totalValue = bottles.reduce((sum, bottle) => {
      const price = parseFloat(bottle.retail_price || '0')
      const quantity = parseFloat(bottle.current_quantity || '0')
      return sum + (price * quantity)
    }, 0)
    
    const lowStockCount = activeBottles.filter(b => parseFloat(b.current_quantity || '0') < 0.25).length

    return {
      totalBottles,
      totalValue,
      activeBottles: activeBottles.length,
      lowStockCount
    }
  }

  static async getLocationStats(organizationId: string): Promise<LocationStats[]> {
    const { data, error } = await supabase
      .from('bottles')
      .select(`
        current_quantity,
        retail_price,
        status,
        location:locations(id, name, code)
      `)
      .eq('organization_id', organizationId)
      .not('location_id', 'is', null)

    if (error) {
      console.error('Error fetching location stats:', error)
      throw error
    }

    const bottles = (data as unknown as BottleWithLocationInfo[]) || []
    const locationMap = new Map<string, LocationStats>()

    bottles.forEach(bottle => {
      if (!bottle.location) return

      const locationId = bottle.location.id
      const existing = locationMap.get(locationId) || {
        locationId,
        locationName: bottle.location.name,
        locationCode: bottle.location.code,
        bottleCount: 0,
        totalValue: 0,
        lowStockCount: 0
      }

      existing.bottleCount++
      
      const price = parseFloat(bottle.retail_price || '0')
      const quantity = parseFloat(bottle.current_quantity || '0')
      existing.totalValue += price * quantity
      
      if (bottle.status === 'active' && quantity < 0.25) {
        existing.lowStockCount++
      }

      locationMap.set(locationId, existing)
    })

    return Array.from(locationMap.values()).sort((a, b) => a.locationName.localeCompare(b.locationName))
  }

  static async getBrandStats(organizationId: string): Promise<BrandStats[]> {
    const { data, error } = await supabase
      .from('bottles')
      .select(`
        brand,
        current_quantity,
        retail_price,
        location:locations(name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching brand stats:', error)
      throw error
    }

    const bottles = (data as unknown as BottleWithBrandInfo[]) || []
    const brandMap = new Map<string, BrandStats>()

    bottles.forEach(bottle => {
      const brand = bottle.brand
      const existing = brandMap.get(brand) || {
        brand,
        bottleCount: 0,
        totalValue: 0,
        locations: []
      }

      existing.bottleCount++
      
      const price = parseFloat(bottle.retail_price || '0')
      const quantity = parseFloat(bottle.current_quantity || '0')
      existing.totalValue += price * quantity

      // Track locations for this brand
      const locationName = bottle.location ? bottle.location.name : 'Unassigned'
      const locationStat = existing.locations.find(l => l.name === locationName)
      if (locationStat) {
        locationStat.count++
      } else {
        existing.locations.push({ name: locationName, count: 1 })
      }

      brandMap.set(brand, existing)
    })

    return Array.from(brandMap.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 20) // Top 20 brands
  }

  static async getTypeStats(organizationId: string): Promise<TypeStats[]> {
    const { data, error } = await supabase
      .from('bottles')
      .select('type, current_quantity, retail_price')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching type stats:', error)
      throw error
    }

    const bottles = data || []
    const typeMap = new Map<string, TypeStats>()

    bottles.forEach(bottle => {
      const type = bottle.type
      const existing = typeMap.get(type) || {
        type: type as BottleType,
        bottleCount: 0,
        totalValue: 0,
        totalQuantity: 0
      }

      existing.bottleCount++
      
      const price = parseFloat(bottle.retail_price || '0')
      const quantity = parseFloat(bottle.current_quantity || '0')
      existing.totalValue += price * quantity
      existing.totalQuantity += quantity

      typeMap.set(type, existing)
    })

    return Array.from(typeMap.values()).sort((a, b) => b.totalValue - a.totalValue)
  }

  static async getLowStockItems(organizationId: string, threshold = 0.25): Promise<LowStockItem[]> {
    const { data, error } = await supabase
      .from('bottles')
      .select(`
        id,
        brand,
        product,
        type,
        current_quantity,
        last_scanned,
        location:locations(name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .lt('current_quantity', threshold)
      .order('current_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }

    const bottles = (data as unknown as LowStockBottle[]) || []
    return bottles.map(item => ({
      id: item.id,
      brand: item.brand,
      product: item.product,
      type: item.type as BottleType,
      currentQuantity: parseFloat(item.current_quantity),
      locationName: item.location ? item.location.name : 'Unassigned',
      lastScanned: item.last_scanned ? new Date(item.last_scanned) : null
    }))
  }

  static subscribeToInventoryChanges(organizationId: string, callback: () => void) {
    const subscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bottles',
          filter: `organization_id=eq.${organizationId}`
        },
        callback
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }
}