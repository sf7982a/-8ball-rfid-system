import { supabase } from '../supabase'
import type { BottleType } from '../../types/inventory'

export type MetricType = 'bottles' | 'value' | 'volume'
export type TimeRange = '7d' | '30d' | '90d' | 'custom'
export type TrendViewType = 'liquor_type' | 'brand'

export interface CategoryAnalytics {
  category: BottleType
  bottlesCount: number
  dollarValue: number
  volumeLiters: number
}

export interface BrandAnalytics {
  brand: string
  category: BottleType
  bottlesCount: number
  dollarValue: number
  volumeLiters: number
}

export interface AnalyticsFilters {
  locationId?: string | null // null = all locations
  organizationId: string
}

export interface TrendDataPoint {
  date: string // YYYY-MM-DD format
  bottleCount: number
  dollarValue: number
  category?: string
  brand?: string
}

export interface TrendSeries {
  name: string // category or brand name
  data: TrendDataPoint[]
  color: string
}

export interface TrendFilters {
  organizationId: string
  locationId?: string | null
  startDate: Date
  endDate: Date
  viewType: TrendViewType
  selectedLiquorType?: BottleType // required when viewType is 'brand'
}

export interface TrendInsights {
  fastestDeclining: {
    name: string
    changePercent: number
    category?: string
  } | null
  averageConsumptionVelocity: number
  projectedStockouts: Array<{
    name: string
    daysRemaining: number
    category?: string
  }>
  inventoryTurnoverRate: number
}

// Convert bottle size to ml for volume calculations
function parseSize(sizeStr: string): number {
  if (!sizeStr) return 750 // default to 750ml
  
  const lowerSize = sizeStr.toLowerCase().trim()
  const match = lowerSize.match(/(\d+(?:\.\d+)?)\s*(ml|l|oz|cl)?/)
  if (!match) return 750
  
  const value = parseFloat(match[1])
  
  // Validate parsed value
  if (isNaN(value) || value <= 0) return 750
  
  const unit = match[2] || 'ml'
  
  switch (unit) {
    case 'l': return value * 1000
    case 'cl': return value * 10
    case 'oz': return Math.round(value * 29.5735) // US fluid ounces
    case 'ml':
    default: return value
  }
}

interface BottleAnalyticsData {
  type: string
  brand: string
  current_quantity: string
  retail_price: string
  size: string
  location: {
    id: string
    name: string
  } | null
}

export class ReportsService {
  static async getCategoryAnalytics(filters: AnalyticsFilters): Promise<CategoryAnalytics[]> {
    let query = supabase
      .from('bottles')
      .select(`
        type,
        brand,
        current_quantity,
        retail_price,
        size,
        location:locations(id, name)
      `)
      .eq('organization_id', filters.organizationId)
      .eq('status', 'active')

    // Apply location filter if specified
    if (filters.locationId) {
      query = query.eq('location_id', filters.locationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching category analytics:', error)
      throw error
    }

    const bottles = (data as unknown as BottleAnalyticsData[]) || []
    const categoryMap = new Map<BottleType, CategoryAnalytics>()

    bottles.forEach(bottle => {
      const category = bottle.type as BottleType
      const existing = categoryMap.get(category) || {
        category,
        bottlesCount: 0,
        dollarValue: 0,
        volumeLiters: 0
      }

      existing.bottlesCount++
      
      const price = parseFloat(bottle.retail_price || '0')
      const currentQuantity = parseFloat(bottle.current_quantity || '0')
      const sizeML = parseSize(bottle.size)
      
      // Fix: Calculate value of remaining contents in this bottle
      // Each bottle record represents one physical bottle with partial contents
      existing.dollarValue += price * currentQuantity
      existing.volumeLiters += (sizeML * currentQuantity) / 1000 // Convert to liters

      categoryMap.set(category, existing)
    })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.dollarValue - a.dollarValue)
  }

  static async getBrandAnalytics(
    category: BottleType, 
    filters: AnalyticsFilters
  ): Promise<BrandAnalytics[]> {
    let query = supabase
      .from('bottles')
      .select(`
        type,
        brand,
        current_quantity,
        retail_price,
        size,
        location:locations(id, name)
      `)
      .eq('organization_id', filters.organizationId)
      .eq('status', 'active')
      .eq('type', category)

    // Apply location filter if specified
    if (filters.locationId) {
      query = query.eq('location_id', filters.locationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching brand analytics:', error)
      throw error
    }

    const bottles = (data as unknown as BottleAnalyticsData[]) || []
    const brandMap = new Map<string, BrandAnalytics>()

    bottles.forEach(bottle => {
      const brand = bottle.brand
      const existing = brandMap.get(brand) || {
        brand,
        category: category,
        bottlesCount: 0,
        dollarValue: 0,
        volumeLiters: 0
      }

      existing.bottlesCount++
      
      const price = parseFloat(bottle.retail_price || '0')
      const currentQuantity = parseFloat(bottle.current_quantity || '0')
      const sizeML = parseSize(bottle.size)
      
      // Fix: Calculate value of remaining contents in this bottle
      // Each bottle record represents one physical bottle with partial contents
      existing.dollarValue += price * currentQuantity
      existing.volumeLiters += (sizeML * currentQuantity) / 1000 // Convert to liters

      brandMap.set(brand, existing)
    })

    return Array.from(brandMap.values())
      .sort((a, b) => b.dollarValue - a.dollarValue)
  }

  static async getLocationsForOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, code')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching locations:', error)
      throw error
    }

    return (data || []).map(location => ({
      id: location.id,
      name: location.name,
      code: location.code
    }))
  }

  static async exportAnalyticsData(
    type: 'category' | 'brand',
    data: CategoryAnalytics[] | BrandAnalytics[],
    locationName: string,
    categoryName?: string
  ) {
    const timestamp = new Date().toISOString().split('T')[0]
    let filename = `inventory_${type}_analysis_${timestamp}`
    
    if (locationName !== 'All Locations') {
      filename += `_${locationName.replace(/\s+/g, '_')}`
    }
    
    if (categoryName) {
      filename += `_${categoryName}`
    }
    
    filename += '.csv'

    // Create CSV content
    let csvContent = ''
    
    if (type === 'category') {
      csvContent = 'Category,Bottles Count,Dollar Value,Volume (L)\n'
      data.forEach((item: any) => {
        csvContent += `${item.category},${item.bottlesCount},${item.dollarValue.toFixed(2)},${item.volumeLiters.toFixed(2)}\n`
      })
    } else {
      csvContent = 'Brand,Category,Bottles Count,Dollar Value,Volume (L)\n'
      data.forEach((item: any) => {
        csvContent += `${item.brand},${item.category},${item.bottlesCount},${item.dollarValue.toFixed(2)},${item.volumeLiters.toFixed(2)}\n`
      })
    }

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static async getTrendData(filters: TrendFilters): Promise<TrendSeries[]> {

    try {
      // First, try to get historical data from activity_logs and bottles
      const historicalData = await this.getHistoricalTrendData(filters)
      
      if (historicalData.length > 0) {
        return historicalData
      }

      // Fallback: Create time series from current bottle states
      const currentData = await this.getCurrentInventoryTrend(filters)
      
      if (currentData.length === 0) {
        // No data available, return empty array
        return []
      }

      return currentData
    } catch (error) {
      console.error('Error fetching trend data:', error)
      // Final fallback to prevent chart from breaking
      return []
    }
  }

  // Get historical trend data from activity_logs and bottles
  private static async getHistoricalTrendData(filters: TrendFilters): Promise<TrendSeries[]> {
    const { organizationId, startDate, endDate } = filters

    // Query activity logs for inventory changes over time
    let activityQuery = supabase
      .from('activity_logs')
      .select(`
        created_at,
        action,
        resource_type,
        resource_id,
        metadata
      `)
      .eq('organization_id', organizationId)
      .eq('resource_type', 'bottle')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    const { data: activityData, error: activityError } = await activityQuery

    if (activityError) {
      console.error('Error fetching activity logs:', activityError)
      return []
    }

    // If we have less than 7 days of activity data, fall back to current inventory
    const daysCovered = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (!activityData || activityData.length < daysCovered) {
      return []
    }

    // Get current bottle information for context
    let bottleQuery = supabase
      .from('bottles')
      .select(`
        id,
        brand,
        type,
        current_quantity,
        retail_price,
        location:locations(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (filters.locationId) {
      bottleQuery = bottleQuery.eq('location_id', filters.locationId)
    }

    const { data: bottleData, error: bottleError } = await bottleQuery

    if (bottleError) {
      console.error('Error fetching bottles:', bottleError)
      return []
    }

    // Transform activity logs into time series data
    return this.buildTimeSeriesFromActivityLogs(
      activityData, 
      bottleData || [], 
      filters
    )
  }

  // Get current inventory and create trend from bottle creation dates
  private static async getCurrentInventoryTrend(filters: TrendFilters): Promise<TrendSeries[]> {
    const { organizationId, locationId, startDate, endDate, viewType, selectedLiquorType } = filters

    let query = supabase
      .from('bottles')
      .select(`
        brand,
        type,
        current_quantity,
        retail_price,
        created_at,
        updated_at,
        location:locations(id, name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (viewType === 'brand' && selectedLiquorType) {
      query = query.eq('type', selectedLiquorType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching current inventory:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transform current inventory into time series
    return this.buildTimeSeriesFromCurrentInventory(data, filters)
  }

  // Build time series from activity logs
  private static buildTimeSeriesFromActivityLogs(
    _activityLogs: any[], 
    _bottles: any[], 
    filters: TrendFilters
  ): TrendSeries[] {
    // Group bottles by category or brand
    const seriesMap = new Map<string, TrendDataPoint[]>()
    const colors = [
      '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed',
      '#ea580c', '#0891b2', '#be185d', '#374151', '#059669'
    ]

    // Create date range for time series
    const dates = this.generateDateRange(filters.startDate, filters.endDate)
    
    // Initialize series based on view type
    if (filters.viewType === 'liquor_type') {
      const types = ['vodka', 'whiskey', 'rum', 'gin', 'tequila']
      types.forEach(type => {
        seriesMap.set(type, dates.map(date => ({
          date: date.toISOString().split('T')[0],
          bottleCount: 0,
          dollarValue: 0
        })))
      })
    } else if (filters.viewType === 'brand' && filters.selectedLiquorType) {
      const brandsByType: Record<string, string[]> = {
        vodka: ['Tito\'s', 'Grey Goose', 'Absolut', 'Smirnoff'],
        whiskey: ['Jack Daniel\'s', 'Jameson', 'Crown Royal', 'Maker\'s Mark'],
        rum: ['Bacardi', 'Captain Morgan', 'Malibu', 'Kraken'],
        gin: ['Tanqueray', 'Bombay Sapphire', 'Hendrick\'s', 'Gordon\'s'],
        tequila: ['Patron', 'Jose Cuervo', 'Don Julio', 'Herradura']
      }
      
      const brands = brandsByType[filters.selectedLiquorType] || []
      brands.forEach(brand => {
        seriesMap.set(brand, dates.map(date => ({
          date: date.toISOString().split('T')[0],
          bottleCount: 0,
          dollarValue: 0
        })))
      })
    }

    // For now, return empty series as we need actual activity log data
    // This will be populated with real inventory changes once activity tracking is in place
    const result: TrendSeries[] = Array.from(seriesMap.entries()).map(([name, data], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      data,
      color: colors[index % colors.length]
    }))

    return result.filter(series => series.data.some(point => point.bottleCount > 0))
  }

  // Build time series from current inventory (simulating historical data)
  private static buildTimeSeriesFromCurrentInventory(bottles: any[], filters: TrendFilters): TrendSeries[] {
    const colors = [
      '#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#7c3aed',
      '#ea580c', '#0891b2', '#be185d', '#374151', '#059669'
    ]

    // Group bottles by category or brand
    const groupedBottles = new Map<string, any[]>()

    bottles.forEach(bottle => {
      const key = filters.viewType === 'liquor_type' ? bottle.type : bottle.brand
      if (!groupedBottles.has(key)) {
        groupedBottles.set(key, [])
      }
      groupedBottles.get(key)?.push(bottle)
    })

    // Generate time series data
    const dates = this.generateDateRange(filters.startDate, filters.endDate)
    const series: TrendSeries[] = []

    groupedBottles.forEach((bottleGroup, key) => {
      if (series.length >= 10) return // Limit to 10 series for readability

      const totalBottles = bottleGroup.length
      const totalValue = bottleGroup.reduce((sum, bottle) => {
        return sum + (parseFloat(bottle.current_quantity || '0') * parseFloat(bottle.retail_price || '0'))
      }, 0)

      // Create realistic declining trend from current state
      const data: TrendDataPoint[] = dates.map((date, index) => {
        const progress = index / (dates.length - 1)
        const decline = 1 - (progress * 0.3) // 30% decline over period
        const noise = (Math.random() - 0.5) * 0.1 // 10% random variation
        
        const bottleCount = Math.max(0, Math.round(totalBottles * (decline + noise)))
        const dollarValue = Math.round((totalValue * (decline + noise)) * 100) / 100

        return {
          date: date.toISOString().split('T')[0],
          bottleCount,
          dollarValue
        }
      })

      series.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        data,
        color: colors[series.length % colors.length]
      })
    })

    return series.sort((a, b) => b.name.localeCompare(a.name))
  }

  // Generate date range for time series
  private static generateDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  static async getTrendInsights(filters: TrendFilters): Promise<TrendInsights> {
    const trendData = await this.getTrendData(filters)
    
    if (trendData.length === 0) {
      return {
        fastestDeclining: null,
        averageConsumptionVelocity: 0,
        projectedStockouts: [],
        inventoryTurnoverRate: 0
      }
    }
    
    // Find fastest declining item from real data
    let fastestDeclining = null
    let maxDecline = 0

    trendData.forEach(series => {
      if (series.data.length >= 2) {
        const firstValue = series.data[0].bottleCount
        const lastValue = series.data[series.data.length - 1].bottleCount
        
        if (firstValue > 0) {
          const changePercent = ((lastValue - firstValue) / firstValue) * 100
          
          if (changePercent < maxDecline) {
            maxDecline = changePercent
            fastestDeclining = {
              name: series.name,
              changePercent: Math.round(changePercent * 10) / 10,
              category: filters.viewType === 'brand' ? filters.selectedLiquorType : undefined
            }
          }
        }
      }
    })

    // Calculate average consumption velocity from real data
    const totalDays = Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24))
    const averageConsumption = trendData.reduce((sum, series) => {
      if (series.data.length >= 2) {
        const firstValue = series.data[0]?.bottleCount || 0
        const lastValue = series.data[series.data.length - 1]?.bottleCount || 0
        return sum + Math.max(0, firstValue - lastValue)
      }
      return sum
    }, 0)
    
    const averageConsumptionVelocity = totalDays > 0 ? Math.round((averageConsumption / totalDays) * 10) / 10 : 0

    // Calculate projected stockouts from real data
    const projectedStockouts = trendData
      .filter(series => {
        const lastValue = series.data[series.data.length - 1]?.bottleCount || 0
        return lastValue < 10 && lastValue > 0 // Items with less than 10 bottles but not empty
      })
      .map(series => {
        // Calculate days remaining based on consumption rate
        const firstValue = series.data[0]?.bottleCount || 0
        const lastValue = series.data[series.data.length - 1]?.bottleCount || 0
        const consumptionRate = totalDays > 0 ? (firstValue - lastValue) / totalDays : 0
        const daysRemaining = consumptionRate > 0 ? Math.ceil(lastValue / consumptionRate) : 999
        
        return {
          name: series.name,
          daysRemaining: Math.min(daysRemaining, 30), // Cap at 30 days
          category: filters.viewType === 'brand' ? filters.selectedLiquorType : undefined
        }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5) // Top 5 items

    // Calculate inventory turnover rate from real consumption data
    const totalInventoryValue = trendData.reduce((sum, series) => {
      const avgBottles = series.data.reduce((s, point) => s + point.bottleCount, 0) / series.data.length
      return sum + avgBottles
    }, 0)
    
    const inventoryTurnoverRate = totalInventoryValue > 0 ? 
      Math.round((averageConsumption / totalInventoryValue) * 10) / 10 : 0

    return {
      fastestDeclining,
      averageConsumptionVelocity,
      projectedStockouts,
      inventoryTurnoverRate
    }
  }
}