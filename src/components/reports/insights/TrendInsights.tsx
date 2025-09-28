import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { HelpTooltip } from '../../ui/help-tooltip'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Calendar, MapPin, BarChart3, Clock, Lightbulb } from 'lucide-react'
import { TrendPattern, detectTrendPatterns } from '../../../lib/api/business-insights'

interface TrendInsightsProps {
  organizationId: string
  className?: string
}

export function TrendInsights({ organizationId, className }: TrendInsightsProps) {
  const [patterns, setPatterns] = useState<TrendPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPattern, setSelectedPattern] = useState<TrendPattern | null>(null)

  useEffect(() => {
    loadTrendPatterns()
  }, [organizationId])

  const loadTrendPatterns = async () => {
    try {
      setLoading(true)
      const data = await detectTrendPatterns(organizationId, 'weekly')
      setPatterns(data)
      if (data.length > 0) {
        setSelectedPattern(data[0])
      }
    } catch (error) {
      console.error('Error loading trend patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPatternIcon = (patternType: string) => {
    switch (patternType) {
      case 'seasonal': return <Calendar className="h-4 w-4" />
      case 'day_of_week': return <Clock className="h-4 w-4" />
      case 'category': return <BarChart3 className="h-4 w-4" />
      case 'location': return <MapPin className="h-4 w-4" />
      case 'tier': return <TrendingUp className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getPatternColor = (patternType: string) => {
    switch (patternType) {
      case 'seasonal': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'day_of_week': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'category': return 'bg-green-100 text-green-800 border-green-200'
      case 'location': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'tier': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable': return <Minus className="h-4 w-4 text-blue-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trend Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
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
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trend Insights
          <HelpTooltip
            title="Trend Insights"
            description="AI-detected patterns in consumption behavior including seasonal trends, day-of-week patterns, and category performance shifts."
            whatToLookFor="High confidence patterns with actionable recommendations. Focus on high-impact trends that affect revenue or operations."
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {patterns.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">Analyzing Patterns</h3>
            <p className="text-sm text-muted-foreground">
              Collecting more data to identify meaningful consumption trends
            </p>
          </div>
        ) : (
          <>
            {/* Pattern Selection Pills */}
            <div className="flex flex-wrap gap-2">
              {patterns.map((pattern, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPattern(pattern)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedPattern === pattern
                      ? getPatternColor(pattern.patternType)
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {getPatternIcon(pattern.patternType)}
                    {pattern.patternType.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Pattern Details */}
            {selectedPattern && (
              <div className="space-y-4">
                {/* Pattern Header */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getPatternIcon(selectedPattern.patternType)}
                      <h3 className="font-semibold">{selectedPattern.description}</h3>
                      {getTrendIcon(selectedPattern.trend)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedPattern.insight}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Confidence:</span>
                        <span className={getConfidenceColor(selectedPattern.confidence)}>
                          {Math.round(selectedPattern.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Impact:</span>
                        <span className={getImpactColor(selectedPattern.impact)}>
                          {selectedPattern.impact}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Trend:</span>
                        <span>{selectedPattern.trend}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pattern Visualization */}
                {selectedPattern.dataPoints.length > 0 && (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedPattern.dataPoints}>
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          fontSize={12}
                          tickFormatter={(value) => {
                            // Format based on pattern type
                            if (selectedPattern.patternType === 'day_of_week') {
                              return value
                            }
                            if (value.includes('-')) {
                              return new Date(value).toLocaleDateString('en-US', { month: 'short' })
                            }
                            return value
                          }}
                        />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => [value, 'Activity']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recommendation */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Recommendation</h4>
                    <p className="text-sm text-blue-800">
                      {selectedPattern.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Patterns Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">All Detected Patterns</h4>
              <div className="space-y-2">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPattern === pattern ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPattern(pattern)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPatternIcon(pattern.patternType)}
                        <span className="font-medium text-sm">{pattern.description}</span>
                        {getTrendIcon(pattern.trend)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getPatternColor(pattern.patternType)}`}>
                          {pattern.patternType.replace('_', ' ')}
                        </Badge>
                        <span className={`text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
                          {Math.round(pattern.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {pattern.insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {patterns.filter(p => p.confidence >= 0.7).length}
                </div>
                <div className="text-xs text-muted-foreground">High Confidence</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {patterns.filter(p => p.impact === 'high').length}
                </div>
                <div className="text-xs text-muted-foreground">High Impact</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {patterns.filter(p => p.trend === 'increasing').length}
                </div>
                <div className="text-xs text-muted-foreground">Growing Trends</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}