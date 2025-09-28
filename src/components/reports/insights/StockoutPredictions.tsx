import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { HelpTooltip } from '../../ui/help-tooltip'
import { Progress } from '../../ui/progress'
import { AlertTriangle, Calendar, DollarSign, Package, ShoppingCart, Clock } from 'lucide-react'
import { StockoutPrediction, predictStockouts } from '../../../lib/api/business-insights'

interface StockoutPredictionsProps {
  organizationId: string
  className?: string
}

export function StockoutPredictions({ organizationId, className }: StockoutPredictionsProps) {
  const [predictions, setPredictions] = useState<StockoutPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<7 | 14 | 30>(14)

  useEffect(() => {
    loadPredictions()
  }, [organizationId, selectedTimeframe])

  const loadPredictions = async () => {
    try {
      setLoading(true)
      const data = await predictStockouts(organizationId, 0.6) // Lower threshold for more predictions
      setPredictions(data.filter(p => p.daysUntilStockout <= selectedTimeframe))
    } catch (error) {
      console.error('Error loading stockout predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyIcon = (daysUntil: number) => {
    if (daysUntil <= 3) return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (daysUntil <= 7) return <Clock className="h-4 w-4 text-orange-500" />
    return <Calendar className="h-4 w-4 text-blue-500" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const totalRevenueAtRisk = predictions.reduce((sum, p) => sum + p.revenueImpact, 0)
  const highPriorityCount = predictions.filter(p => p.priorityLevel === 'high').length
  const needReorderSoon = predictions.filter(p => new Date(p.recommendedReorderDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stockout Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stockout Predictions
            <HelpTooltip
              title="Stockout Predictions"
              description="AI-powered predictions of when items will run out based on consumption patterns, helping prevent revenue loss from empty shelves."
              whatToLookFor="High priority items need immediate reordering. Watch recommended reorder dates to maintain stock levels."
            />
          </CardTitle>

          <div className="flex gap-1">
            {[7, 14, 30].map(days => (
              <Button
                key={days}
                variant={selectedTimeframe === days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(days as 7 | 14 | 30)}
                className="text-xs"
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
            <div className="text-sm text-red-600">High Priority Items</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Calendar className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{needReorderSoon}</div>
            <div className="text-sm text-orange-600">Need Reorder Soon</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <DollarSign className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenueAtRisk)}</div>
            <div className="text-sm text-blue-600">Weekly Revenue at Risk</div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Predicted Stockouts (Next {selectedTimeframe} Days)
            </h4>
            <span className="text-xs text-muted-foreground">
              {predictions.length} items
            </span>
          </div>

          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-600">No Stockouts Predicted</h3>
              <p className="text-sm text-muted-foreground">
                All inventory levels look healthy for the next {selectedTimeframe} days
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {predictions.map((prediction) => (
                <div
                  key={prediction.bottleId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getUrgencyIcon(prediction.daysUntilStockout)}
                      <span className="font-medium text-sm truncate">
                        {prediction.brand} {prediction.product}
                      </span>
                      <Badge className={`text-xs ${getPriorityColor(prediction.priorityLevel)}`}>
                        {prediction.priorityLevel}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Stockout:</span>{' '}
                        {prediction.daysUntilStockout} days
                      </div>
                      <div>
                        <span className="font-medium">Reorder by:</span>{' '}
                        {formatDate(prediction.recommendedReorderDate)}
                      </div>
                      <div>
                        <span className="font-medium">Weekly demand:</span>{' '}
                        {prediction.weeklyDemand.toFixed(1)}
                      </div>
                      <div>
                        <span className="font-medium">Revenue risk:</span>{' '}
                        {formatCurrency(prediction.revenueImpact)}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.max(10, Math.min(100, (prediction.daysUntilStockout / selectedTimeframe) * 100))}
                          className="flex-1 h-2"
                        />
                        <span className="text-xs font-medium">
                          {Math.round(prediction.confidenceScore * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        // In a real app, this would open a reorder modal or navigate to ordering
                        console.log('Reorder', prediction.brand, prediction.product)
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Reorder
                    </Button>

                    {prediction.daysUntilStockout <= 3 && (
                      <Badge className="text-xs bg-red-100 text-red-800 text-center">
                        URGENT
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {predictions.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Export predictions to CSV
                  const csvData = predictions.map(p => [
                    p.brand,
                    p.product,
                    p.daysUntilStockout,
                    p.recommendedReorderDate,
                    p.revenueImpact,
                    p.priorityLevel
                  ])
                  console.log('Export CSV:', csvData)
                }}
              >
                Export Predictions
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Bulk reorder for high priority items
                  const highPriorityItems = predictions.filter(p => p.priorityLevel === 'high')
                  console.log('Bulk reorder:', highPriorityItems)
                }}
              >
                Bulk Reorder ({highPriorityCount})
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={loadPredictions}
              >
                Refresh Predictions
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}