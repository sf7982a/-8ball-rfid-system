import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { HelpTooltip } from '../ui/help-tooltip'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, DollarSign, Package } from 'lucide-react'
import { BrandVarianceResult, analyzeBrandVariance } from '../../lib/analysis/variance-detection'

interface BrandVarianceAnalyticsProps {
  organizationId: string
  className?: string
}

export function BrandVarianceAnalytics({ organizationId, className }: BrandVarianceAnalyticsProps) {
  const [brandVariances, setBrandVariances] = useState<BrandVarianceResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrandVarianceData()
  }, [organizationId])

  const loadBrandVarianceData = async () => {
    try {
      setLoading(true)

      // Use mock data for demonstration purposes
      const mockBrandVariances: BrandVarianceResult[] = [
        {
          brand: 'Grey Goose',
          product: 'Original Vodka',
          totalBottles: 24,
          bottlesWithVariance: 8,
          totalVarianceAmount: 12.5,
          averageVarianceAmount: 1.56,
          highestSeverity: 'critical',
          detectionTypes: { 'theft_suspected': 5, 'missing': 2, 'consumption_anomaly': 1 },
          estimatedLossValue: 2400,
          riskScore: 87,
          trendIndicator: 'increasing',
          lastDetectionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-1', 'bottle-2', 'bottle-3'],
            averageConfidenceScore: 0.89
          }
        },
        {
          brand: 'Hennessy',
          product: 'VS Cognac',
          totalBottles: 18,
          bottlesWithVariance: 6,
          totalVarianceAmount: 9.2,
          averageVarianceAmount: 1.53,
          highestSeverity: 'high',
          detectionTypes: { 'theft_suspected': 4, 'missing': 2 },
          estimatedLossValue: 1840,
          riskScore: 79,
          trendIndicator: 'increasing',
          lastDetectionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-4', 'bottle-5'],
            averageConfidenceScore: 0.82
          }
        },
        {
          brand: 'Macallan',
          product: '12 Year Single Malt',
          totalBottles: 12,
          bottlesWithVariance: 4,
          totalVarianceAmount: 6.8,
          averageVarianceAmount: 1.7,
          highestSeverity: 'high',
          detectionTypes: { 'theft_suspected': 3, 'consumption_anomaly': 1 },
          estimatedLossValue: 1360,
          riskScore: 73,
          trendIndicator: 'stable',
          lastDetectionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-6', 'bottle-7'],
            averageConfidenceScore: 0.76
          }
        },
        {
          brand: 'Don Julio',
          product: '1942 Tequila',
          totalBottles: 8,
          bottlesWithVariance: 3,
          totalVarianceAmount: 4.2,
          averageVarianceAmount: 1.4,
          highestSeverity: 'medium',
          detectionTypes: { 'theft_suspected': 2, 'missing': 1 },
          estimatedLossValue: 840,
          riskScore: 65,
          trendIndicator: 'decreasing',
          lastDetectionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-8'],
            averageConfidenceScore: 0.71
          }
        },
        {
          brand: 'Patron',
          product: 'Silver Tequila',
          totalBottles: 20,
          bottlesWithVariance: 5,
          totalVarianceAmount: 6.5,
          averageVarianceAmount: 1.3,
          highestSeverity: 'medium',
          detectionTypes: { 'missing': 3, 'reconciliation_needed': 2 },
          estimatedLossValue: 650,
          riskScore: 58,
          trendIndicator: 'stable',
          lastDetectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-9', 'bottle-10'],
            averageConfidenceScore: 0.68
          }
        },
        {
          brand: 'Johnny Walker',
          product: 'Blue Label',
          totalBottles: 6,
          bottlesWithVariance: 2,
          totalVarianceAmount: 2.8,
          averageVarianceAmount: 1.4,
          highestSeverity: 'medium',
          detectionTypes: { 'theft_suspected': 1, 'consumption_anomaly': 1 },
          estimatedLossValue: 560,
          riskScore: 52,
          trendIndicator: 'stable',
          lastDetectionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-11'],
            averageConfidenceScore: 0.65
          }
        },
        {
          brand: 'Clase Azul',
          product: 'Reposado Tequila',
          totalBottles: 4,
          bottlesWithVariance: 1,
          totalVarianceAmount: 1.2,
          averageVarianceAmount: 1.2,
          highestSeverity: 'low',
          detectionTypes: { 'missing': 1 },
          estimatedLossValue: 240,
          riskScore: 45,
          trendIndicator: 'decreasing',
          lastDetectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-12'],
            averageConfidenceScore: 0.62
          }
        },
        {
          brand: 'Beluga',
          product: 'Noble Vodka',
          totalBottles: 8,
          bottlesWithVariance: 2,
          totalVarianceAmount: 2.1,
          averageVarianceAmount: 1.05,
          highestSeverity: 'low',
          detectionTypes: { 'surplus': 1, 'reconciliation_needed': 1 },
          estimatedLossValue: 210,
          riskScore: 38,
          trendIndicator: 'stable',
          lastDetectionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            analysisTimeRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() },
            affectedBottleIds: ['bottle-13'],
            averageConfidenceScore: 0.58
          }
        }
      ]

      setBrandVariances(mockBrandVariances)
    } catch (error) {
      console.error('Error loading brand variance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive' as const
      case 'high': return 'destructive' as const
      case 'medium': return 'secondary' as const
      case 'low': return 'outline' as const
      default: return 'outline' as const
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <Minus className="h-4 w-4 text-blue-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  // Prepare chart data
  const riskScoreData = brandVariances
    .slice(0, 10)
    .map(brand => ({
      name: brand.brand,
      riskScore: brand.riskScore,
      affectedBottles: brand.bottlesWithVariance,
      lossValue: brand.estimatedLossValue
    }))

  const severityDistribution = brandVariances.reduce((acc, brand) => {
    acc[brand.highestSeverity] = (acc[brand.highestSeverity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getSeverityPieColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444' // bright red
      case 'high': return '#f97316'     // bright orange
      case 'medium': return '#eab308'   // bright yellow
      case 'low': return '#22c55e'      // bright green
      default: return '#6b7280'        // gray
    }
  }

  const pieData = Object.entries(severityDistribution).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
    fill: getSeverityPieColor(severity)
  }))

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalEstimatedLoss = brandVariances.reduce((sum, brand) => sum + brand.estimatedLossValue, 0)
  const totalAffectedBottles = brandVariances.reduce((sum, brand) => sum + brand.bottlesWithVariance, 0)
  const avgRiskScore = brandVariances.length > 0
    ? brandVariances.reduce((sum, brand) => sum + brand.riskScore, 0) / brandVariances.length
    : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Total Estimated Loss
              <HelpTooltip
                title="Total Estimated Loss"
                description="Combined monetary value of all detected variances across brands, calculated using cost per bottle."
                whatToLookFor="High loss values indicate significant financial impact. Focus on brands with the highest losses first."
              />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEstimatedLoss.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Across {brandVariances.length} brands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Affected Bottles
              <HelpTooltip
                title="Affected Bottles"
                description="Total number of individual bottles showing variance patterns across all brands."
                whatToLookFor="Higher numbers suggest widespread issues. Compare to total inventory to understand scope."
              />
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAffectedBottles}</div>
            <p className="text-xs text-muted-foreground">
              Bottles with variances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Average Risk Score
              <HelpTooltip
                title="Average Risk Score"
                description="Overall risk level across all brands, calculated from variance rates, severity, and confidence scores."
                whatToLookFor="Scores above 70 indicate high systematic risk. Scores above 85 require immediate attention."
              />
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRiskScore.toFixed(0)}</div>
            <Progress value={avgRiskScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {avgRiskScore >= 85 ? 'Critical' : avgRiskScore >= 70 ? 'High' : avgRiskScore >= 50 ? 'Medium' : 'Low'} risk level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Brand Risk Scores
              <HelpTooltip
                title="Brand Risk Scores"
                description="Risk scores for the top 10 most problematic brands, calculated from variance rates, severity, and detection confidence."
                whatToLookFor="Brands with scores above 70 need immediate attention. Focus security measures on these high-risk brands."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'riskScore') return [`${value}`, 'Risk Score']
                    if (name === 'affectedBottles') return [`${value}`, 'Affected Bottles']
                    if (name === 'lossValue') return [`$${value.toFixed(0)}`, 'Estimated Loss']
                    return [value, name]
                  }}
                />
                <Bar dataKey="riskScore" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Severity Distribution
              <HelpTooltip
                title="Severity Distribution"
                description="Breakdown of brands by their highest detected variance severity level."
                whatToLookFor="High numbers of critical/high severity brands indicate systematic security issues requiring immediate action."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={14}
                  fontWeight="bold"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#1f2937',
                    fontWeight: 'bold'
                  }}
                  formatter={(value: any, name: string) => [
                    `${value} brands`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Brand Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Brand Variance Details
            <HelpTooltip
              title="Brand Variance Details"
              description="Comprehensive table showing all brands with detected variances, sorted by risk score."
              whatToLookFor="Focus on brands with increasing trends and high loss values. Red trends indicate growing problems."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Brand</th>
                  <th className="text-left p-2">Risk Score</th>
                  <th className="text-left p-2">Severity</th>
                  <th className="text-left p-2">Affected Bottles</th>
                  <th className="text-left p-2">Estimated Loss</th>
                  <th className="text-left p-2">Trend</th>
                  <th className="text-left p-2">Detection Types</th>
                </tr>
              </thead>
              <tbody>
                {brandVariances.map((brand, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      {brand.brand}
                      {brand.product && (
                        <div className="text-xs text-gray-500">{brand.product}</div>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{brand.riskScore.toFixed(0)}</span>
                        <Progress value={brand.riskScore} className="w-16 h-2" />
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={getSeverityBadgeVariant(brand.highestSeverity)}>
                        {brand.highestSeverity}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <span>{brand.bottlesWithVariance}</span>
                      <span className="text-gray-500">/{brand.totalBottles}</span>
                    </td>
                    <td className="p-2 font-medium">
                      ${brand.estimatedLossValue.toFixed(0)}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        {getTrendIcon(brand.trendIndicator)}
                        <span className="text-xs">{brand.trendIndicator}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(brand.detectionTypes).map(([type, count]) => (
                          <span
                            key={type}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
                          >
                            {type.replace('_', ' ')}: {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {brandVariances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No brand variance data available. Run variance detection to populate this analysis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}