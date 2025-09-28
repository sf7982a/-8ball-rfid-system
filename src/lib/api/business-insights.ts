import { supabase } from '../supabase'

export interface ConsumptionVelocity {
  bottleId: string
  brand: string
  product: string
  currentQuantity: number
  dailyConsumptionRate: number
  daysRemaining: number
  trendDirection: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  locationId?: string
  costPerBottle: number
  revenueAtRisk: number
}

export interface StockoutPrediction {
  bottleId: string
  brand: string
  product: string
  currentQuantity: number
  predictedStockoutDate: string
  daysUntilStockout: number
  confidenceScore: number
  weeklyDemand: number
  revenueImpact: number
  recommendedReorderDate: string
  priorityLevel: 'high' | 'medium' | 'low'
  locationName: string
}

export interface TrendPattern {
  patternType: 'seasonal' | 'day_of_week' | 'category' | 'location' | 'tier'
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  trend: 'increasing' | 'decreasing' | 'stable'
  dataPoints: Array<{ date: string; value: number }>
  insight: string
  recommendation: string
}

export interface StrategyRecommendation {
  id: string
  type: 'inventory' | 'revenue' | 'operational' | 'risk'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  timeframe: 'immediate' | 'short_term' | 'long_term'
  estimatedValue: number
  actionItems: string[]
  basedOn: string[]
}

export interface BusinessInsight {
  consumptionVelocities: ConsumptionVelocity[]
  stockoutPredictions: StockoutPrediction[]
  trendPatterns: TrendPattern[]
  recommendations: StrategyRecommendation[]
  metadata: {
    analysisDate: string
    dataQuality: number
    confidenceLevel: number
    coverageDays: number
  }
}

/**
 * Calculate consumption velocity for bottles based on activity logs
 */
export async function calculateConsumptionVelocity(
  organizationId: string,
  timeframeDays: number = 30,
  locationFilter?: string
): Promise<ConsumptionVelocity[]> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays)

    // Get bottles with current quantities
    let bottlesQuery = supabase
      .from('bottles')
      .select(`
        id,
        brand,
        product,
        current_quantity,
        cost_price,
        location_id,
        locations!inner(name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (locationFilter) {
      bottlesQuery = bottlesQuery.eq('location_id', locationFilter)
    }

    const { data: bottles, error: bottlesError } = await bottlesQuery

    if (bottlesError || !bottles) {
      throw new Error(`Failed to fetch bottles: ${bottlesError?.message}`)
    }

    // Type assertion to handle Supabase types
    type BottleWithLocation = {
      id: string
      brand: string
      product: string
      current_quantity: number
      cost_price: string | null
      location_id: string
      locations: { name: string }
    }

    const typedBottles = bottles as BottleWithLocation[]

    // Get activity logs for consumption tracking
    // Note: Temporarily removing resource_type filter due to schema mismatch
    const { data: activityLogs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (logsError) {
      throw new Error(`Failed to fetch activity logs: ${logsError.message}`)
    }

    const velocities: ConsumptionVelocity[] = []

    for (const bottle of typedBottles) {
      // Calculate consumption based on activity logs
      const bottleLogs = activityLogs?.filter(log =>
        log.metadata?.bottle_id === bottle.id ||
        (log.action.includes('scan') && log.metadata?.bottle_brand === bottle.brand)
      ) || []

      // Estimate daily consumption rate
      let dailyConsumptionRate = 0

      if (bottleLogs.length > 0) {
        // Count consumption events (scans, sales, etc.)
        const consumptionEvents = bottleLogs.filter(log =>
          log.action.includes('scan') ||
          log.action.includes('sale') ||
          log.action.includes('pour')
        )

        dailyConsumptionRate = consumptionEvents.length / timeframeDays
      }

      // Fallback: estimate based on typical consumption patterns
      if (dailyConsumptionRate === 0) {
        // Premium spirits: slower consumption, Well spirits: faster
        const costPrice = parseFloat(bottle.cost_price || '0')
        const isPremium = costPrice > 100
        const isMidTier = costPrice > 50 && costPrice <= 100

        if (isPremium) {
          dailyConsumptionRate = 0.1 // 1 bottle every 10 days
        } else if (isMidTier) {
          dailyConsumptionRate = 0.2 // 1 bottle every 5 days
        } else {
          dailyConsumptionRate = 0.3 // 1 bottle every 3.3 days
        }
      }

      const daysRemaining = dailyConsumptionRate > 0
        ? Math.floor(bottle.current_quantity / dailyConsumptionRate)
        : 999

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (daysRemaining <= 3) riskLevel = 'critical'
      else if (daysRemaining <= 7) riskLevel = 'high'
      else if (daysRemaining <= 14) riskLevel = 'medium'

      // Estimate trend (simplified - would need more historical data for accuracy)
      const recentLogs = bottleLogs.slice(-7) // Last week
      const olderLogs = bottleLogs.slice(0, -7) // Before last week

      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable'
      let trendPercentage = 0

      if (recentLogs.length > 0 && olderLogs.length > 0) {
        const recentRate = recentLogs.length / 7
        const olderRate = olderLogs.length / Math.max(1, (timeframeDays - 7))

        const changePercent = ((recentRate - olderRate) / Math.max(0.1, olderRate)) * 100

        if (Math.abs(changePercent) > 20) {
          trendDirection = changePercent > 0 ? 'increasing' : 'decreasing'
          trendPercentage = Math.abs(changePercent)
        }
      }

      velocities.push({
        bottleId: bottle.id,
        brand: bottle.brand,
        product: bottle.product || '',
        currentQuantity: bottle.current_quantity,
        dailyConsumptionRate,
        daysRemaining,
        trendDirection,
        trendPercentage,
        riskLevel,
        locationId: bottle.location_id,
        costPerBottle: parseFloat(bottle.cost_price || '0'),
        revenueAtRisk: parseFloat(bottle.cost_price || '0') * dailyConsumptionRate * 7 // Weekly revenue at risk
      })
    }

    // Sort by risk level and days remaining
    return velocities.sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
      }
      return a.daysRemaining - b.daysRemaining
    })

  } catch (error) {
    console.error('Error calculating consumption velocity:', error)
    return []
  }
}

/**
 * Predict potential stockouts based on consumption velocity
 */
export async function predictStockouts(
  organizationId: string,
  confidenceThreshold: number = 0.7,
  leadTimeDays: number = 7
): Promise<StockoutPrediction[]> {
  try {
    const velocities = await calculateConsumptionVelocity(organizationId, 30)

    const predictions: StockoutPrediction[] = []

    for (const velocity of velocities) {
      if (velocity.daysRemaining <= 30 && velocity.dailyConsumptionRate > 0) {
        const predictedStockoutDate = new Date()
        predictedStockoutDate.setDate(predictedStockoutDate.getDate() + velocity.daysRemaining)

        const recommendedReorderDate = new Date(predictedStockoutDate)
        recommendedReorderDate.setDate(recommendedReorderDate.getDate() - leadTimeDays)

        // Calculate confidence based on data quality
        let confidence = 0.5
        if (velocity.dailyConsumptionRate > 0.05) confidence += 0.2 // Active consumption
        if (velocity.trendDirection === 'stable') confidence += 0.2 // Stable pattern
        if (velocity.daysRemaining <= 14) confidence += 0.1 // Urgent items more predictable

        if (confidence >= confidenceThreshold) {
          const weeklyDemand = velocity.dailyConsumptionRate * 7
          const revenueImpact = weeklyDemand * velocity.costPerBottle

          let priorityLevel: 'high' | 'medium' | 'low' = 'low'
          if (velocity.riskLevel === 'critical' || revenueImpact > 1000) priorityLevel = 'high'
          else if (velocity.riskLevel === 'high' || revenueImpact > 500) priorityLevel = 'medium'

          predictions.push({
            bottleId: velocity.bottleId,
            brand: velocity.brand,
            product: velocity.product,
            currentQuantity: velocity.currentQuantity,
            predictedStockoutDate: predictedStockoutDate.toISOString(),
            daysUntilStockout: velocity.daysRemaining,
            confidenceScore: Math.round(confidence * 100) / 100,
            weeklyDemand,
            revenueImpact,
            recommendedReorderDate: recommendedReorderDate.toISOString(),
            priorityLevel,
            locationName: 'Main Location' // Would get from location join
          })
        }
      }
    }

    // Sort by priority and revenue impact
    return predictions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priorityLevel] !== priorityOrder[b.priorityLevel]) {
        return priorityOrder[a.priorityLevel] - priorityOrder[b.priorityLevel]
      }
      return b.revenueImpact - a.revenueImpact
    })

  } catch (error) {
    console.error('Error predicting stockouts:', error)
    return []
  }
}

/**
 * Detect trend patterns in consumption data
 */
export async function detectTrendPatterns(
  organizationId: string,
  analysisWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<TrendPattern[]> {
  try {
    const days = analysisWindow === 'daily' ? 30 : analysisWindow === 'weekly' ? 90 : 365
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .in('action', ['bottle_scanned', 'inventory_updated', 'sale_recorded'])
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (error || !activityLogs) {
      throw new Error(`Failed to fetch activity logs: ${error?.message}`)
    }

    const patterns: TrendPattern[] = []

    // Day of week pattern analysis
    const dayOfWeekData = Array(7).fill(0)
    activityLogs.forEach(log => {
      const dayOfWeek = new Date(log.created_at).getDay()
      dayOfWeekData[dayOfWeek]++
    })

    const avgDailyActivity = dayOfWeekData.reduce((a, b) => a + b, 0) / 7
    const weekendActivity = (dayOfWeekData[0] + dayOfWeekData[6]) / 2
    const weekdayActivity = dayOfWeekData.slice(1, 6).reduce((a, b) => a + b, 0) / 5

    if (Math.abs(weekendActivity - weekdayActivity) / avgDailyActivity > 0.3) {
      patterns.push({
        patternType: 'day_of_week',
        description: weekendActivity > weekdayActivity
          ? 'Higher consumption on weekends'
          : 'Higher consumption on weekdays',
        confidence: 0.8,
        impact: 'medium',
        trend: weekendActivity > weekdayActivity ? 'increasing' : 'decreasing',
        dataPoints: dayOfWeekData.map((value, index) => ({
          date: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
          value
        })),
        insight: weekendActivity > weekdayActivity
          ? 'Weekend demand is significantly higher than weekday demand'
          : 'Weekday demand is significantly higher than weekend demand',
        recommendation: weekendActivity > weekdayActivity
          ? 'Consider increasing weekend staffing and inventory levels'
          : 'Optimize weekday operations and consider weekend cost savings'
      })
    }

    // Monthly trend analysis (if enough data)
    if (analysisWindow === 'monthly' && activityLogs.length > 30) {
      const monthlyData = new Map<string, number>()

      activityLogs.forEach(log => {
        const month = new Date(log.created_at).toISOString().substring(0, 7)
        monthlyData.set(month, (monthlyData.get(month) || 0) + 1)
      })

      const months = Array.from(monthlyData.keys()).sort()
      if (months.length >= 3) {
        const values = months.map(month => monthlyData.get(month) || 0)
        const trend = values[values.length - 1] > values[0] ? 'increasing' : 'decreasing'

        patterns.push({
          patternType: 'seasonal',
          description: `${trend === 'increasing' ? 'Growing' : 'Declining'} consumption trend over recent months`,
          confidence: 0.7,
          impact: 'high',
          trend,
          dataPoints: months.map((month, index) => ({
            date: month,
            value: values[index]
          })),
          insight: `Overall consumption has been ${trend} over the analysis period`,
          recommendation: trend === 'increasing'
            ? 'Prepare for higher demand - consider increasing inventory and staffing'
            : 'Optimize operations for lower demand - review inventory levels and costs'
        })
      }
    }

    return patterns

  } catch (error) {
    console.error('Error detecting trend patterns:', error)
    return []
  }
}

/**
 * Generate strategic recommendations based on insights
 */
export async function generateRecommendations(
  organizationId: string,
  insights?: {
    velocities: ConsumptionVelocity[]
    predictions: StockoutPrediction[]
    patterns: TrendPattern[]
  }
): Promise<StrategyRecommendation[]> {
  try {
    if (!insights) {
      // Gather insights if not provided
      const [velocities, predictions, patterns] = await Promise.all([
        calculateConsumptionVelocity(organizationId),
        predictStockouts(organizationId),
        detectTrendPatterns(organizationId)
      ])
      insights = { velocities, predictions, patterns }
    }

    const recommendations: StrategyRecommendation[] = []

    // Inventory recommendations
    const criticalItems = insights.velocities.filter(v => v.riskLevel === 'critical')
    if (criticalItems.length > 0) {
      recommendations.push({
        id: 'critical-inventory',
        type: 'inventory',
        priority: 'high',
        title: 'Address Critical Inventory Shortages',
        description: `${criticalItems.length} items are critically low and may stock out within 3 days`,
        impact: `Prevent potential revenue loss of $${criticalItems.reduce((sum, item) => sum + item.revenueAtRisk, 0).toFixed(0)} per week`,
        effort: 'low',
        timeframe: 'immediate',
        estimatedValue: criticalItems.reduce((sum, item) => sum + item.revenueAtRisk * 4, 0), // Monthly value
        actionItems: [
          'Review critical inventory list immediately',
          'Place emergency orders for top priority items',
          'Implement automatic reorder triggers',
          'Consider backup suppliers for high-risk items'
        ],
        basedOn: ['consumption_velocity', 'stockout_predictions']
      })
    }

    // Revenue optimization
    const highValueItems = insights.velocities
      .filter(v => v.costPerBottle > 100 && v.trendDirection === 'increasing')

    if (highValueItems.length > 0) {
      recommendations.push({
        id: 'revenue-optimization',
        type: 'revenue',
        priority: 'medium',
        title: 'Capitalize on Premium Spirit Trends',
        description: `${highValueItems.length} premium items show increasing demand`,
        impact: 'Potential 15-25% revenue increase through strategic promotion',
        effort: 'medium',
        timeframe: 'short_term',
        estimatedValue: highValueItems.reduce((sum, item) => sum + item.revenueAtRisk * 2, 0),
        actionItems: [
          'Create premium spirit promotion campaigns',
          'Train staff on upselling techniques',
          'Optimize pricing strategies for trending items',
          'Enhance inventory levels for high-performing premiums'
        ],
        basedOn: ['consumption_velocity', 'trend_patterns']
      })
    }

    // Operational efficiency
    const weekendPattern = insights.patterns.find(p => p.patternType === 'day_of_week')
    if (weekendPattern) {
      recommendations.push({
        id: 'operational-efficiency',
        type: 'operational',
        priority: 'medium',
        title: 'Optimize Staffing Based on Consumption Patterns',
        description: weekendPattern.description,
        impact: 'Reduce labor costs by 10-15% through optimized scheduling',
        effort: 'medium',
        timeframe: 'short_term',
        estimatedValue: 5000, // Estimated monthly savings
        actionItems: [
          'Adjust staffing levels based on consumption patterns',
          'Implement dynamic inventory management',
          'Optimize delivery schedules to match demand',
          'Create pattern-based forecasting models'
        ],
        basedOn: ['trend_patterns']
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

/**
 * Get comprehensive business insights
 */
export async function getBusinessInsights(
  organizationId: string,
  options: {
    timeframeDays?: number
    locationFilter?: string
    confidenceThreshold?: number
  } = {}
): Promise<BusinessInsight> {
  try {
    const {
      timeframeDays = 30,
      locationFilter,
      confidenceThreshold = 0.7
    } = options

    // Execute all analyses in parallel for better performance
    const [velocities, predictions, patterns] = await Promise.all([
      calculateConsumptionVelocity(organizationId, timeframeDays, locationFilter),
      predictStockouts(organizationId, confidenceThreshold),
      detectTrendPatterns(organizationId, 'weekly')
    ])

    const recommendations = await generateRecommendations(organizationId, {
      velocities,
      predictions,
      patterns
    })

    // Calculate data quality metrics
    const totalBottles = velocities.length
    const bottlesWithData = velocities.filter(v => v.dailyConsumptionRate > 0).length
    const dataQuality = totalBottles > 0 ? bottlesWithData / totalBottles : 0

    return {
      consumptionVelocities: velocities,
      stockoutPredictions: predictions,
      trendPatterns: patterns,
      recommendations,
      metadata: {
        analysisDate: new Date().toISOString(),
        dataQuality: Math.round(dataQuality * 100) / 100,
        confidenceLevel: confidenceThreshold,
        coverageDays: timeframeDays
      }
    }

  } catch (error) {
    console.error('Error getting business insights:', error)
    throw error
  }
}