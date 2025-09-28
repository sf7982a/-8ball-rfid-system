import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { HelpTooltip } from '../ui/help-tooltip'
import { RefreshCw, TrendingUp, AlertTriangle, Target, Clock } from 'lucide-react'
import { ConsumptionVelocityCard } from './insights/ConsumptionVelocityCard'
import { StockoutPredictions } from './insights/StockoutPredictions'
import { TrendInsights } from './insights/TrendInsights'
import { StrategicRecommendations } from './insights/StrategicRecommendations'
import { BusinessInsight, getBusinessInsights } from '../../lib/api/business-insights'

interface BusinessInsightsPanelProps {
  organizationId: string
  locationFilter?: string
  className?: string
}

export function BusinessInsightsPanel({ organizationId, locationFilter, className }: BusinessInsightsPanelProps) {
  const [insights, setInsights] = useState<BusinessInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    loadInsights()
  }, [organizationId, locationFilter])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh) {
      interval = setInterval(() => {
        loadInsights(true) // Silent refresh
      }, 5 * 60 * 1000) // Refresh every 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, organizationId, locationFilter])

  const loadInsights = async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const data = await getBusinessInsights(organizationId, {
        timeframeDays: 30,
        locationFilter,
        confidenceThreshold: 0.6
      })

      setInsights(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading business insights:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const getDataQualityColor = (quality: number) => {
    if (quality >= 0.8) return 'text-green-600'
    if (quality >= 0.6) return 'text-orange-600'
    return 'text-red-600'
  }

  const getDataQualityLabel = (quality: number) => {
    if (quality >= 0.8) return 'Excellent'
    if (quality >= 0.6) return 'Good'
    if (quality >= 0.4) return 'Fair'
    return 'Limited'
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading && !insights) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Header */}
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardHeader>
        </Card>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-48 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls and Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Business Intelligence Dashboard
                <HelpTooltip
                  title="Business Intelligence Dashboard"
                  description="AI-powered insights that transform your inventory data into actionable business intelligence for strategic decision-making."
                  whatToLookFor="Focus on high-priority alerts and recommendations. Monitor consumption velocity and stockout predictions for operational excellence."
                />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive analysis of inventory patterns, consumption trends, and strategic opportunities
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs ${autoRefresh ? 'bg-blue-50 text-blue-600' : ''}`}
              >
                <Clock className="h-3 w-3 mr-1" />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInsights()}
                disabled={loading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {insights && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Critical Items */}
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-600">
                  {insights.consumptionVelocities.filter(v => v.riskLevel === 'critical').length}
                </div>
                <div className="text-xs text-red-600">Critical Items</div>
              </div>

              {/* Stockout Predictions */}
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Target className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-600">
                  {insights.stockoutPredictions.length}
                </div>
                <div className="text-xs text-orange-600">Stockout Predictions</div>
              </div>

              {/* Trend Patterns */}
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-600">
                  {insights.trendPatterns.length}
                </div>
                <div className="text-xs text-blue-600">Trend Patterns</div>
              </div>

              {/* Recommendations */}
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-600">
                  {insights.recommendations.filter(r => r.priority === 'high').length}
                </div>
                <div className="text-xs text-green-600">High Priority Actions</div>
              </div>
            </div>

            {/* Data Quality and Update Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Data Quality:</span>
                  <span className={`font-medium ${getDataQualityColor(insights.metadata.dataQuality)}`}>
                    {getDataQualityLabel(insights.metadata.dataQuality)} ({Math.round(insights.metadata.dataQuality * 100)}%)
                  </span>
                </div>
                <div>
                  Coverage: {insights.metadata.coverageDays} days
                </div>
                <div>
                  Confidence: {Math.round(insights.metadata.confidenceLevel * 100)}%
                </div>
              </div>

              {lastUpdated && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {formatLastUpdated(lastUpdated)}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Consumption Velocity */}
        <ConsumptionVelocityCard
          organizationId={organizationId}
          locationFilter={locationFilter}
        />

        {/* Stockout Predictions */}
        <StockoutPredictions
          organizationId={organizationId}
        />

        {/* Trend Insights */}
        <TrendInsights
          organizationId={organizationId}
        />
      </div>

      {/* Strategic Recommendations - Full Width */}
      <StrategicRecommendations
        organizationId={organizationId}
      />

      {/* Data Quality Notice */}
      {insights && insights.metadata.dataQuality < 0.6 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Limited Data Quality</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Insights accuracy may be reduced due to limited activity data.
                  Continue using the system to improve prediction accuracy over time.
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                    Data Quality: {Math.round(insights.metadata.dataQuality * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}