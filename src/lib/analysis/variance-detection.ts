import { supabase } from '../supabase'

export interface VarianceDetectionConfig {
  // Thresholds for different severity levels
  lowThreshold: number // 0.1 = 10%
  mediumThreshold: number // 0.2 = 20%
  highThreshold: number // 0.3 = 30%
  criticalThreshold: number // 0.5 = 50%

  // Time windows for analysis
  analysisWindowHours: number // How far back to look for data
  minimumSalesForAnalysis: number // Minimum sales to trigger analysis

  // Confidence scoring weights
  posSalesWeight: number // Weight for POS sales data reliability
  rfidScanWeight: number // Weight for RFID scan data reliability
  historicalPatternWeight: number // Weight for historical consumption patterns

  // Detection sensitivity
  enableAnomalyDetection: boolean
  anomalyDetectionSensitivity: number // 0.5 = moderate, 1.0 = high sensitivity
}

export interface VarianceResult {
  bottleId: string
  detectionType: 'missing' | 'surplus' | 'consumption_anomaly' | 'theft_suspected' | 'reconciliation_needed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  expectedQuantity: number
  actualQuantity: number
  varianceAmount: number
  posSalesCount: number
  rfidScanCount: number
  confidenceScore: number
  metadata: {
    analysisTimeRange: { start: string; end: string }
    historicalAverage?: number
    anomalyScore?: number
    contributingFactors: string[]
  }
}

export interface BrandVarianceResult {
  brand: string
  product?: string
  totalBottles: number
  bottlesWithVariance: number
  totalVarianceAmount: number
  averageVarianceAmount: number
  highestSeverity: 'low' | 'medium' | 'high' | 'critical'
  detectionTypes: Record<string, number>
  estimatedLossValue: number
  riskScore: number
  trendIndicator: 'increasing' | 'stable' | 'decreasing'
  lastDetectionDate: string
  metadata: {
    analysisTimeRange: { start: string; end: string }
    affectedBottleIds: string[]
    averageConfidenceScore: number
  }
}

export interface BottleConsumptionData {
  bottleId: string
  currentQuantity: number
  lastScannedAt: string
  posSales: Array<{
    transactionDate: string
    quantitySold: number
    itemName: string
  }>
  rfidScans: Array<{
    scannedAt: string
    quantity: number
  }>
  historicalData: Array<{
    date: string
    averageConsumption: number
  }>
}

export class VarianceDetectionEngine {
  private config: VarianceDetectionConfig

  constructor(config: VarianceDetectionConfig) {
    this.config = config
  }

  /**
   * Analyze variance for a single bottle
   */
  async analyzeBottle(bottleId: string, organizationId: string): Promise<VarianceResult | null> {
    try {
      const consumptionData = await this.getBottleConsumptionData(bottleId, organizationId)
      if (!consumptionData) {
        return null
      }

      const result = this.calculateVariance(consumptionData)

      if (result && result.confidenceScore >= 0.6) {
        // Store detection result in database
        await this.storeVarianceDetection(result, organizationId)
        return result
      }

      return null
    } catch (error) {
      console.error('Error analyzing bottle variance:', error)
      return null
    }
  }

  /**
   * Analyze variance for all bottles in an organization
   */
  async analyzeOrganization(organizationId: string): Promise<VarianceResult[]> {
    try {
      // Get all active bottles for the organization
      const { data: bottles, error } = await supabase
        .from('bottles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      if (error) throw error

      const results: VarianceResult[] = []

      // Analyze each bottle (in batches to avoid overwhelming the system)
      const batchSize = 10
      for (let i = 0; i < bottles.length; i += batchSize) {
        const batch = bottles.slice(i, i + batchSize)
        const batchPromises = batch.map(bottle =>
          this.analyzeBottle(bottle.id, organizationId)
        )

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults.filter(result => result !== null) as VarianceResult[])
      }

      return results
    } catch (error) {
      console.error('Error analyzing organization variance:', error)
      return []
    }
  }

  /**
   * Get consumption data for a bottle
   */
  private async getBottleConsumptionData(
    bottleId: string,
    organizationId: string
  ): Promise<BottleConsumptionData | null> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - this.config.analysisWindowHours)

      // Get bottle current state
      const { data: bottle, error: bottleError } = await supabase
        .from('bottles')
        .select('current_quantity, last_scanned, brand, product')
        .eq('id', bottleId)
        .eq('organization_id', organizationId)
        .single()

      if (bottleError || !bottle) return null

      // Get POS sales data
      const { data: posData, error: posError } = await supabase
        .from('pos_transactions')
        .select(`
          transaction_date,
          items,
          pos_integrations!inner(organization_id)
        `)
        .eq('pos_integrations.organization_id', organizationId)
        .gte('transaction_date', cutoffTime.toISOString())

      // Get RFID scan history from activity logs
      const { data: scanData, error: scanError } = await supabase
        .from('activity_logs')
        .select('created_at, metadata')
        .eq('organization_id', organizationId)
        .eq('resource_type', 'bottle')
        .eq('resource_id', bottleId)
        .eq('action', 'scanned')
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })

      // Get historical performance data
      const { data: historicalData, error: historicalError } = await supabase
        .from('performance_metrics')
        .select('date, total_bottles_sold, total_revenue')
        .eq('organization_id', organizationId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })

      // Process POS sales data to extract relevant items
      const posSales = this.extractBottleSales(posData || [], bottle.brand, bottle.product)

      // Process RFID scan data
      const rfidScans = (scanData || []).map(scan => ({
        scannedAt: scan.created_at,
        quantity: scan.metadata?.quantity || bottle.current_quantity
      }))

      // Process historical data
      const historical = (historicalData || []).map(data => ({
        date: data.date,
        averageConsumption: data.total_bottles_sold / 30 // Rough daily average
      }))

      return {
        bottleId,
        currentQuantity: parseFloat(bottle.current_quantity),
        lastScannedAt: bottle.last_scanned,
        posSales,
        rfidScans,
        historicalData: historical
      }
    } catch (error) {
      console.error('Error getting bottle consumption data:', error)
      return null
    }
  }

  /**
   * Extract sales for a specific bottle from POS transactions
   */
  private extractBottleSales(transactions: any[], brand: string, product: string): Array<{
    transactionDate: string
    quantitySold: number
    itemName: string
  }> {
    const sales: Array<{
      transactionDate: string
      quantitySold: number
      itemName: string
    }> = []

    for (const transaction of transactions) {
      if (!transaction.items || !Array.isArray(transaction.items)) continue

      for (const item of transaction.items) {
        // Simple fuzzy matching for menu items that contain the bottle brand/product
        const itemName = item.name?.toLowerCase() || ''
        const brandLower = brand.toLowerCase()
        const productLower = product.toLowerCase()

        if (itemName.includes(brandLower) || itemName.includes(productLower)) {
          sales.push({
            transactionDate: transaction.transaction_date,
            quantitySold: item.quantity || 1,
            itemName: item.name
          })
        }
      }
    }

    return sales
  }

  /**
   * Calculate variance for bottle consumption data
   */
  private calculateVariance(data: BottleConsumptionData): VarianceResult | null {
    const now = new Date()
    const analysisStart = new Date(now.getTime() - this.config.analysisWindowHours * 60 * 60 * 1000)

    // Calculate expected consumption based on POS sales
    const totalPosSales = data.posSales.reduce((sum, sale) => sum + sale.quantitySold, 0)

    // Calculate expected quantity (assuming perfect tracking)
    // This is a simplified model - in reality you'd need more sophisticated calculation
    const expectedQuantity = Math.max(0, data.currentQuantity - totalPosSales)
    const actualQuantity = data.currentQuantity
    const varianceAmount = Math.abs(expectedQuantity - actualQuantity)

    // If no significant variance, no need to report
    if (varianceAmount < 0.1) return null

    // Calculate variance percentage
    const variancePercentage = varianceAmount / Math.max(expectedQuantity, 0.1)

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical'
    if (variancePercentage >= this.config.criticalThreshold) {
      severity = 'critical'
    } else if (variancePercentage >= this.config.highThreshold) {
      severity = 'high'
    } else if (variancePercentage >= this.config.mediumThreshold) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    // Determine detection type
    let detectionType: VarianceResult['detectionType']
    if (actualQuantity < expectedQuantity) {
      detectionType = totalPosSales > 0 ? 'theft_suspected' : 'missing'
    } else if (actualQuantity > expectedQuantity) {
      detectionType = 'surplus'
    } else {
      detectionType = 'reconciliation_needed'
    }

    // Check for consumption anomalies
    if (this.config.enableAnomalyDetection && data.historicalData.length > 0) {
      const averageConsumption = data.historicalData.reduce((sum, d) => sum + d.averageConsumption, 0) / data.historicalData.length
      const currentConsumption = totalPosSales
      const anomalyScore = Math.abs(currentConsumption - averageConsumption) / Math.max(averageConsumption, 1)

      if (anomalyScore > this.config.anomalyDetectionSensitivity) {
        detectionType = 'consumption_anomaly'
      }
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(data, totalPosSales)

    // Build contributing factors
    const contributingFactors: string[] = []
    if (totalPosSales === 0 && varianceAmount > 0.2) {
      contributingFactors.push('No POS sales recorded for missing inventory')
    }
    if (data.rfidScans.length === 0) {
      contributingFactors.push('No recent RFID scans')
    }
    if (variancePercentage > 0.5) {
      contributingFactors.push('High variance percentage')
    }

    return {
      bottleId: data.bottleId,
      detectionType,
      severity,
      expectedQuantity,
      actualQuantity,
      varianceAmount,
      posSalesCount: totalPosSales,
      rfidScanCount: data.rfidScans.length,
      confidenceScore,
      metadata: {
        analysisTimeRange: {
          start: analysisStart.toISOString(),
          end: now.toISOString()
        },
        historicalAverage: data.historicalData.length > 0
          ? data.historicalData.reduce((sum, d) => sum + d.averageConsumption, 0) / data.historicalData.length
          : undefined,
        contributingFactors
      }
    }
  }

  /**
   * Calculate confidence score based on data quality and reliability
   */
  private calculateConfidenceScore(data: BottleConsumptionData, totalPosSales: number): number {
    let score = 0

    // POS data reliability
    if (totalPosSales > 0) {
      score += this.config.posSalesWeight * 0.8 // High confidence if we have POS data
    } else {
      score += this.config.posSalesWeight * 0.2 // Low confidence without POS data
    }

    // RFID scan data reliability
    if (data.rfidScans.length > 0) {
      const recentScans = data.rfidScans.filter(scan =>
        new Date(scan.scannedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )
      score += this.config.rfidScanWeight * (recentScans.length > 0 ? 0.9 : 0.5)
    } else {
      score += this.config.rfidScanWeight * 0.1
    }

    // Historical pattern reliability
    if (data.historicalData.length >= 7) {
      score += this.config.historicalPatternWeight * 0.8
    } else if (data.historicalData.length > 0) {
      score += this.config.historicalPatternWeight * 0.4
    }

    return Math.min(score, 1.0)
  }

  /**
   * Store variance detection result in database
   */
  private async storeVarianceDetection(result: VarianceResult, organizationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('variance_detections')
        .insert({
          organization_id: organizationId,
          bottle_id: result.bottleId,
          detection_type: result.detectionType,
          severity: result.severity,
          detected_at: new Date().toISOString(),
          expected_quantity: result.expectedQuantity,
          actual_quantity: result.actualQuantity,
          variance_amount: result.varianceAmount,
          pos_sales_count: result.posSalesCount,
          rfid_scan_count: result.rfidScanCount,
          confidence_score: result.confidenceScore,
          metadata: result.metadata
        })

      if (error) {
        console.error('Error storing variance detection:', error)
      }
    } catch (error) {
      console.error('Error storing variance detection:', error)
    }
  }

  /**
   * Get default configuration for variance detection
   */
  /**
   * Analyze variance patterns by brand to identify systematic theft targets
   */
  async analyzeBrandVariance(organizationId: string): Promise<BrandVarianceResult[]> {
    try {
      // Get all variance results for the organization
      const variances = await this.analyzeOrganization(organizationId)

      if (variances.length === 0) return []

      // Get bottle details for brand aggregation
      const bottleIds = variances.map(v => v.bottleId)
      const { data: bottles } = await supabase
        .from('bottles')
        .select('id, brand, product, cost_per_bottle')
        .in('id', bottleIds)
        .eq('organization_id', organizationId)

      if (!bottles) return []

      // Group variances by brand
      const brandMap = new Map<string, VarianceResult[]>()
      const bottleMap = new Map<string, any>()

      bottles.forEach(bottle => {
        bottleMap.set(bottle.id, bottle)
      })

      variances.forEach(variance => {
        const bottle = bottleMap.get(variance.bottleId)
        if (bottle) {
          const brandKey = `${bottle.brand}|${bottle.product || ''}`
          if (!brandMap.has(brandKey)) {
            brandMap.set(brandKey, [])
          }
          brandMap.get(brandKey)!.push(variance)
        }
      })

      // Calculate brand-level statistics
      const results: BrandVarianceResult[] = []

      for (const [brandKey, brandVariances] of brandMap.entries()) {
        const [brand, product] = brandKey.split('|')
        const affectedBottles = brandVariances.map(v => v.bottleId)

        // Get all bottles for this brand to calculate total count
        const { data: allBrandBottles } = await supabase
          .from('bottles')
          .select('id, cost_per_bottle')
          .eq('organization_id', organizationId)
          .eq('brand', brand)
          .eq('status', 'active')

        const totalBottles = allBrandBottles?.length || 0
        const bottlesWithVariance = affectedBottles.length

        // Calculate aggregated metrics
        const totalVarianceAmount = brandVariances.reduce((sum, v) => sum + Math.abs(v.varianceAmount), 0)
        const averageVarianceAmount = totalVarianceAmount / bottlesWithVariance

        // Determine highest severity
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
        const highestSeverity = brandVariances.reduce((highest, v) =>
          severityOrder[v.severity] > severityOrder[highest] ? v.severity : highest, 'low' as any
        )

        // Count detection types
        const detectionTypes: Record<string, number> = {}
        brandVariances.forEach(v => {
          detectionTypes[v.detectionType] = (detectionTypes[v.detectionType] || 0) + 1
        })

        // Calculate estimated loss value
        const estimatedLossValue = brandVariances.reduce((sum, v) => {
          const bottle = bottleMap.get(v.bottleId)
          const costPerBottle = bottle?.cost_per_bottle || 0
          return sum + (Math.abs(v.varianceAmount) * costPerBottle)
        }, 0)

        // Calculate risk score (0-100 based on multiple factors)
        const varianceRate = bottlesWithVariance / Math.max(totalBottles, 1)
        const severityMultiplier = severityOrder[highestSeverity]
        const avgConfidence = brandVariances.reduce((sum, v) => sum + v.confidenceScore, 0) / brandVariances.length
        const riskScore = Math.min(100, (varianceRate * 40) + (severityMultiplier * 15) + (avgConfidence * 45))

        // Get trend indicator (simplified - would need historical data for accurate trending)
        const recentVariances = brandVariances.filter(v => {
          const days = (Date.now() - new Date(v.metadata.analysisTimeRange.start).getTime()) / (1000 * 60 * 60 * 24)
          return days <= 7
        })
        const trendIndicator = recentVariances.length > brandVariances.length * 0.7 ? 'increasing' :
                              recentVariances.length < brandVariances.length * 0.3 ? 'decreasing' : 'stable'

        // Find most recent detection
        const lastDetectionDate = brandVariances.reduce((latest, v) => {
          const date = new Date(v.metadata.analysisTimeRange.end)
          return date > new Date(latest) ? date.toISOString() : latest
        }, new Date(0).toISOString())

        results.push({
          brand,
          product: product || undefined,
          totalBottles,
          bottlesWithVariance,
          totalVarianceAmount,
          averageVarianceAmount,
          highestSeverity,
          detectionTypes,
          estimatedLossValue,
          riskScore,
          trendIndicator,
          lastDetectionDate,
          metadata: {
            analysisTimeRange: {
              start: brandVariances.reduce((earliest, v) => {
                const date = new Date(v.metadata.analysisTimeRange.start)
                return date < new Date(earliest) ? date.toISOString() : earliest
              }, new Date().toISOString()),
              end: new Date().toISOString()
            },
            affectedBottleIds: affectedBottles,
            averageConfidenceScore: avgConfidence
          }
        })
      }

      // Sort by risk score descending
      return results.sort((a, b) => b.riskScore - a.riskScore)

    } catch (error) {
      console.error('Error analyzing brand variance:', error)
      return []
    }
  }

  static getDefaultConfig(): VarianceDetectionConfig {
    return {
      lowThreshold: 0.1,
      mediumThreshold: 0.2,
      highThreshold: 0.3,
      criticalThreshold: 0.5,
      analysisWindowHours: 24,
      minimumSalesForAnalysis: 1,
      posSalesWeight: 0.4,
      rfidScanWeight: 0.4,
      historicalPatternWeight: 0.2,
      enableAnomalyDetection: true,
      anomalyDetectionSensitivity: 0.5
    }
  }
}

/**
 * Utility function to run variance detection for an organization
 */
export async function runVarianceDetection(
  organizationId: string,
  config?: Partial<VarianceDetectionConfig>
): Promise<VarianceResult[]> {
  const fullConfig = { ...VarianceDetectionEngine.getDefaultConfig(), ...config }
  const engine = new VarianceDetectionEngine(fullConfig)
  return await engine.analyzeOrganization(organizationId)
}

/**
 * Utility function to analyze brand-specific variance patterns
 */
export async function analyzeBrandVariance(
  organizationId: string,
  config?: Partial<VarianceDetectionConfig>
): Promise<BrandVarianceResult[]> {
  const fullConfig = { ...VarianceDetectionEngine.getDefaultConfig(), ...config }
  const engine = new VarianceDetectionEngine(fullConfig)
  return await engine.analyzeBrandVariance(organizationId)
}

/**
 * Utility function to get variance detection results from database
 */
export async function getVarianceDetections(
  organizationId: string,
  filters?: {
    status?: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'ignored'
    severity?: 'low' | 'medium' | 'high' | 'critical'
    detectionType?: 'missing' | 'surplus' | 'consumption_anomaly' | 'theft_suspected' | 'reconciliation_needed'
    locationId?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<any[]> {
  try {
    // Note: variance_detections table may not exist in database yet
    // Return empty array for now to prevent errors
    console.warn('variance_detections table not available - returning empty data')
    return []

    // TODO: Uncomment when variance_detections table is created in Supabase
    // let query = supabase
    //   .from('variance_detections')
    //   .select('*')
    //   .eq('organization_id', organizationId)
    //   .order('detected_at', { ascending: false })
    //
    // if (filters?.status) {
    //   query = query.eq('status', filters.status)
    // }
    // if (filters?.severity) {
    //   query = query.eq('severity', filters.severity)
    // }
    // if (filters?.detectionType) {
    //   query = query.eq('detection_type', filters.detectionType)
    // }
    // if (filters?.locationId) {
    //   query = query.eq('location_id', filters.locationId)
    // }
    // if (filters?.dateFrom) {
    //   query = query.gte('detected_at', filters.dateFrom)
    // }
    // if (filters?.dateTo) {
    //   query = query.lte('detected_at', filters.dateTo)
    // }
    //
    // const { data, error } = await query
    // if (error) throw error
    // return data || []
  } catch (error) {
    console.error('Error getting variance detections:', error)
    return []
  }
}