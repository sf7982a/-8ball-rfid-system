import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { HelpTooltip } from '../../ui/help-tooltip'
// Temporarily simplified without collapsible for quick fix
import {
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Package,
  DollarSign,
  Settings,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react'
import { StrategyRecommendation, generateRecommendations } from '../../../lib/api/business-insights'

interface StrategicRecommendationsProps {
  organizationId: string
  className?: string
}

export function StrategicRecommendations({ organizationId, className }: StrategicRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [implementedItems, setImplementedItems] = useState<Set<string>>(new Set())
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    loadRecommendations()
  }, [organizationId])

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      const data = await generateRecommendations(organizationId)
      setRecommendations(data)
      // Auto-expand high priority items
      const highPriorityIds = data.filter(r => r.priority === 'high').map(r => r.id)
      setExpandedItems(new Set(highPriorityIds))
    } catch (error) {
      console.error('Error loading recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const toggleImplemented = (id: string) => {
    const newImplemented = new Set(implementedItems)
    if (newImplemented.has(id)) {
      newImplemented.delete(id)
    } else {
      newImplemented.add(id)
    }
    setImplementedItems(newImplemented)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <Package className="h-4 w-4" />
      case 'revenue': return <DollarSign className="h-4 w-4" />
      case 'operational': return <Settings className="h-4 w-4" />
      case 'risk': return <Shield className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inventory': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'revenue': return 'bg-green-100 text-green-800 border-green-200'
      case 'operational': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'risk': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'short_term': return <Clock className="h-4 w-4 text-orange-500" />
      case 'long_term': return <TrendingUp className="h-4 w-4 text-blue-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getEffortBadgeColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filteredRecommendations = recommendations.filter(rec =>
    selectedPriority === 'all' || rec.priority === selectedPriority
  )

  const totalEstimatedValue = filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedValue, 0)
  const implementedCount = filteredRecommendations.filter(rec => implementedItems.has(rec.id)).length

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
            <Lightbulb className="h-5 w-5" />
            Strategic Recommendations
            <HelpTooltip
              title="Strategic Recommendations"
              description="AI-generated actionable recommendations based on your inventory patterns, consumption trends, and business performance data."
              whatToLookFor="Focus on high-priority items with high estimated value and low implementation effort for quick wins."
            />
          </CardTitle>

          <div className="flex gap-1">
            {['all', 'high', 'medium', 'low'].map(priority => (
              <Button
                key={priority}
                variant={selectedPriority === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPriority(priority as any)}
                className="text-xs capitalize"
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{filteredRecommendations.length}</div>
            <div className="text-sm text-blue-600">
              {selectedPriority === 'all' ? 'Total' : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)} Recommendations
            </div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalEstimatedValue)}</div>
            <div className="text-sm text-green-600">Estimated Value</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <CheckCircle className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {implementedCount}/{filteredRecommendations.length}
            </div>
            <div className="text-sm text-purple-600">Implemented</div>
          </div>
        </div>

        {/* Recommendations List */}
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              {selectedPriority === 'all'
                ? 'All systems are optimized! Check back later for new insights.'
                : `No ${selectedPriority} priority recommendations at this time.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecommendations.map((recommendation) => {
              const isExpanded = expandedItems.has(recommendation.id)
              const isImplemented = implementedItems.has(recommendation.id)

              return (
                <div key={recommendation.id}>
                  <div className={`border rounded-lg transition-all ${
                    isImplemented ? 'opacity-60 bg-gray-50' : 'hover:shadow-sm'
                  }`}>
                    <button
                      onClick={() => toggleExpanded(recommendation.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {getTypeIcon(recommendation.type)}
                            <h3 className="font-semibold text-sm truncate">
                              {recommendation.title}
                            </h3>
                            {isImplemented && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 ml-6">
                            {recommendation.description}
                          </p>

                          <div className="flex flex-wrap gap-2 ml-6">
                            <Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                              {recommendation.priority} priority
                            </Badge>
                            <Badge className={`text-xs ${getTypeColor(recommendation.type)}`}>
                              {recommendation.type}
                            </Badge>
                            <Badge className={`text-xs ${getEffortBadgeColor(recommendation.effort)}`}>
                              {recommendation.effort} effort
                            </Badge>
                          </div>
                        </div>

                        <div className="ml-4 text-right">
                          <div className="flex items-center gap-1 mb-1">
                            {getTimeframeIcon(recommendation.timeframe)}
                            <span className="text-xs text-muted-foreground">
                              {recommendation.timeframe.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(recommendation.estimatedValue)}
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t bg-gray-50">
                        <div className="pt-4 space-y-4">
                          {/* Impact Details */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Expected Impact</h4>
                            <p className="text-sm text-muted-foreground">
                              {recommendation.impact}
                            </p>
                          </div>

                          {/* Action Items */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Action Items</h4>
                            <ul className="space-y-1">
                              {recommendation.actionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Based On */}
                          <div>
                            <h4 className="font-medium text-sm mb-2">Based On</h4>
                            <div className="flex flex-wrap gap-1">
                              {recommendation.basedOn.map((source, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {source.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant={isImplemented ? "outline" : "default"}
                              onClick={() => toggleImplemented(recommendation.id)}
                              className="text-xs"
                            >
                              {isImplemented ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Implemented
                                </>
                              ) : (
                                'Mark as Implemented'
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // In a real app, this would create tasks or reminders
                                console.log('Create task for:', recommendation.title)
                              }}
                            >
                              Create Task
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Export recommendation details
                                console.log('Export recommendation:', recommendation)
                              }}
                            >
                              Export Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Actions */}
        {filteredRecommendations.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Mark all high priority as implemented
                  const highPriorityIds = filteredRecommendations
                    .filter(r => r.priority === 'high')
                    .map(r => r.id)
                  setImplementedItems(new Set([...implementedItems, ...highPriorityIds]))
                }}
              >
                Mark All High Priority
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Expand all items
                  setExpandedItems(new Set(filteredRecommendations.map(r => r.id)))
                }}
              >
                Expand All
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // Export all recommendations
                  console.log('Export all recommendations:', filteredRecommendations)
                }}
              >
                Export All ({filteredRecommendations.length})
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={loadRecommendations}
              >
                Refresh Recommendations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}