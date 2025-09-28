import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Progress } from '../../ui/progress'
import { HelpTooltip } from '../../ui/help-tooltip'
import { Badge } from '../../ui/badge'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Activity } from 'lucide-react'
import { ConsumptionVelocity, calculateConsumptionVelocity } from '../../../lib/api/business-insights'

interface ConsumptionVelocityCardProps {
  organizationId: string
  locationFilter?: string
  className?: string
}

export function ConsumptionVelocityCard({ organizationId, locationFilter, className }: ConsumptionVelocityCardProps) {
  const [velocities, setVelocities] = useState<ConsumptionVelocity[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    avgDaysRemaining: 0,
    criticalCount: 0,
    highRiskCount: 0,
    totalBottles: 0,
    avgConsumptionRate: 0
  })

  useEffect(() => {
    loadVelocityData()
  }, [organizationId, locationFilter])

  const loadVelocityData = async () => {
    try {
      setLoading(true)
      const data = await calculateConsumptionVelocity(organizationId, 30, locationFilter)
      setVelocities(data)

      // Calculate summary metrics
      const totalBottles = data.length
      const criticalCount = data.filter(v => v.riskLevel === 'critical').length
      const highRiskCount = data.filter(v => v.riskLevel === 'high').length
      const avgDaysRemaining = totalBottles > 0
        ? data.reduce((sum, v) => sum + v.daysRemaining, 0) / totalBottles
        : 0
      const avgConsumptionRate = totalBottles > 0
        ? data.reduce((sum, v) => sum + v.dailyConsumptionRate, 0) / totalBottles
        : 0

      setSummary({
        avgDaysRemaining: Math.round(avgDaysRemaining),
        criticalCount,
        highRiskCount,
        totalBottles,
        avgConsumptionRate: Math.round(avgConsumptionRate * 100) / 100
      })
    } catch (error) {
      console.error('Error loading consumption velocity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (direction: string, percentage: number) => {
    if (percentage < 10) return <Minus className="h-4 w-4 text-blue-500" />

    switch (direction) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <Minus className="h-4 w-4 text-blue-500" />
    }
  }

  const getOverallRiskLevel = () => {
    if (summary.criticalCount > 0) return 'critical'
    if (summary.highRiskCount > 2) return 'high'
    if (summary.avgDaysRemaining < 14) return 'medium'
    return 'low'
  }

  const getVelocityGaugeValue = () => {
    // Convert days remaining to a 0-100 scale (30+ days = 100, 0 days = 0)
    return Math.min(100, Math.max(0, (summary.avgDaysRemaining / 30) * 100))
  }

  const getRecommendation = () => {
    const overallRisk = getOverallRiskLevel()

    switch (overallRisk) {
      case 'critical':
        return 'Immediate action required: Place emergency orders for critical items'
      case 'high':
        return 'High attention needed: Review reorder schedules for multiple items'
      case 'medium':
        return 'Monitor closely: Some items may need reordering soon'
      default:
        return 'Inventory levels are healthy across all tracked items'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Consumption Velocity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const overallRisk = getOverallRiskLevel()
  const gaugeValue = getVelocityGaugeValue()

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Consumption Velocity
          <HelpTooltip
            title="Consumption Velocity"
            description="Tracks how quickly inventory is being consumed and predicts when items will run out based on current usage patterns."
            whatToLookFor="Red indicators show items that may stock out soon. Green shows healthy inventory levels with sufficient buffer time."
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.avgDaysRemaining}</div>
            <div className="text-sm text-muted-foreground">Avg Days Remaining</div>
            <Progress value={gaugeValue} className="mt-2" />
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.criticalCount + summary.highRiskCount}</div>
            <div className="text-sm text-muted-foreground">Items At Risk</div>
            <div className="flex justify-center gap-1 mt-2">
              {summary.criticalCount > 0 && (
                <Badge className="text-xs bg-red-100 text-red-800">
                  {summary.criticalCount} Critical
                </Badge>
              )}
              {summary.highRiskCount > 0 && (
                <Badge className="text-xs bg-orange-100 text-orange-800">
                  {summary.highRiskCount} High
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Risk Level Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg border-l-4"
             style={{
               borderLeftColor: overallRisk === 'critical' ? '#ef4444' :
                               overallRisk === 'high' ? '#f97316' :
                               overallRisk === 'medium' ? '#eab308' : '#22c55e',
               backgroundColor: overallRisk === 'critical' ? '#fef2f2' :
                               overallRisk === 'high' ? '#fff7ed' :
                               overallRisk === 'medium' ? '#fefce8' : '#f0fdf4'
             }}>
          {overallRisk === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
          {overallRisk === 'high' && <Clock className="h-5 w-5 text-orange-500" />}
          {overallRisk === 'medium' && <Clock className="h-5 w-5 text-yellow-500" />}
          {overallRisk === 'low' && <Activity className="h-5 w-5 text-green-500" />}

          <div className="flex-1">
            <div className="font-medium text-sm">
              {overallRisk === 'critical' && 'Critical Inventory Risk'}
              {overallRisk === 'high' && 'High Attention Needed'}
              {overallRisk === 'medium' && 'Monitor Inventory Levels'}
              {overallRisk === 'low' && 'Healthy Inventory Status'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getRecommendation()}
            </div>
          </div>
        </div>

        {/* Top Risk Items */}
        {velocities.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Items Requiring Attention</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {velocities
                .filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high')
                .slice(0, 5)
                .map((velocity) => (
                <div key={velocity.bottleId} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {velocity.brand} {velocity.product}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getRiskColor(velocity.riskLevel)}`}>
                        {velocity.riskLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {velocity.daysRemaining} days left
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getTrendIcon(velocity.trendDirection, velocity.trendPercentage)}
                    {velocity.trendPercentage > 10 && (
                      <span className="text-xs text-muted-foreground">
                        {velocity.trendPercentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {velocities.filter(v => v.riskLevel === 'critical' || v.riskLevel === 'high').length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No items currently at high risk
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
          <div>
            <div className="text-lg font-semibold">{summary.totalBottles}</div>
            <div className="text-xs text-muted-foreground">Total Bottles</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{summary.avgConsumptionRate}</div>
            <div className="text-xs text-muted-foreground">Avg Daily Rate</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {Math.round((summary.totalBottles - summary.criticalCount - summary.highRiskCount) / Math.max(1, summary.totalBottles) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Healthy Stock</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}