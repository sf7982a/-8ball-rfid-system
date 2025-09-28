import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { DatePickerWithRange } from '../ui/date-range-picker'
import { AnalyticsCharts } from './AnalyticsCharts'
import { VarianceAlerts } from '../alerts/VarianceAlerts'
import { ExportControls } from './ExportControls'
import { useAuth } from '../../contexts/AuthContext'
import { getVarianceDetections } from '../../lib/analysis/variance-detection'
import { supabase } from '../../lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Shield,
  Target,
  Clock,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface AnalyticsData {
  // Executive Summary
  totalRevenue: number
  totalBottlesTracked: number
  theftIncidents: number
  inventoryAccuracy: number
  costSavings: number

  // Performance Metrics
  premiumTierRevenue: number
  midTierRevenue: number
  wellTierRevenue: number
  pourCostPercentage: number
  inventoryTurnover: number

  // Variance Detection
  openVariances: number
  criticalVariances: number
  resolvedVariances: number
  falsePositives: number

  // Time series data
  dailyRevenue: Array<{ date: string; revenue: number; bottles: number }>
  dailyThefts: Array<{ date: string; incidents: number; value: number }>
  dailyAccuracy: Array<{ date: string; accuracy: number }>
}

interface POSIntegratedReportsProps {
  className?: string
}

export function POSIntegratedReports({ className }: POSIntegratedReportsProps) {
  const { organization } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  })
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([])
  const [activeTab, setActiveTab] = useState('overview')

  // Load locations
  useEffect(() => {
    async function loadLocations() {
      if (!organization?.id) return

      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('organization_id', organization.id)
        .eq('is_active', true)

      if (!error && data) {
        setLocations(data)
      }
    }

    loadLocations()
  }, [organization?.id])

  // Load analytics data
  useEffect(() => {
    async function loadAnalytics() {
      if (!organization?.id) return

      setLoading(true)
      try {
        const data = await fetchAnalyticsData(
          organization.id,
          selectedLocation === 'all' ? undefined : selectedLocation,
          dateRange.from,
          dateRange.to
        )
        setAnalytics(data)
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [organization?.id, selectedLocation, dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load analytics data</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            POS-integrated variance detection and business intelligence
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePickerWithRange
            date={dateRange}
            onDateChange={(range) => range && setDateRange(range)}
          />

          <ExportControls
            data={analytics}
            locationName={selectedLocation === 'all' ? 'All Locations' :
              locations.find(l => l.id === selectedLocation)?.name || 'Unknown'}
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Real-time Alerts */}
      <VarianceAlerts organizationId={organization?.id || ''} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="loss-prevention">Loss Prevention</TabsTrigger>
          <TabsTrigger value="performance">Business Performance</TabsTrigger>
          <TabsTrigger value="operations">Operational Efficiency</TabsTrigger>
        </TabsList>

        {/* Executive Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue Tracked</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-green-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% vs last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bottles Tracked</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalBottlesTracked.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    Across {locations.length} locations
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Theft Incidents</CardTitle>
                  <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.theftIncidents}</div>
                  <div className="text-xs text-red-400 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -23% vs last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Accuracy</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.inventoryAccuracy.toFixed(1)}%</div>
                  <div className="text-xs text-green-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2% improvement
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                  <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analytics.costSavings.toLocaleString()}</div>
                  <div className="text-xs text-green-400">
                    Theft prevention this month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Inventory Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="revenue-trend"
                    data={analytics.dailyRevenue}
                    height={300}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tier Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="tier-breakdown"
                    data={[
                      { name: 'Premium', value: analytics.premiumTierRevenue, color: '#8b5cf6' },
                      { name: 'Mid-Tier', value: analytics.midTierRevenue, color: '#3b82f6' },
                      { name: 'Well', value: analytics.wellTierRevenue, color: '#10b981' }
                    ]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Loss Prevention Tab */}
        <TabsContent value="loss-prevention">
          <div className="space-y-6">
            {/* Variance Detection Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Variances</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.openVariances}</div>
                  <div className="text-xs text-muted-foreground">
                    Require investigation
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.criticalVariances}</div>
                  <div className="text-xs text-red-400">
                    High-severity incidents
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.resolvedVariances}</div>
                  <div className="text-xs text-green-400">
                    This period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((analytics.resolvedVariances / (analytics.resolvedVariances + analytics.falsePositives)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    True positive rate
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Theft Detection Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theft Incidents Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="theft-trend"
                    data={analytics.dailyThefts}
                    height={300}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accuracy Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="accuracy-trend"
                    data={analytics.dailyAccuracy}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Business Performance Tab */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pour Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.pourCostPercentage.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Industry average: 18-22%
                  </p>
                  <Badge
                    className={`mt-2 ${analytics.pourCostPercentage <= 22 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                  >
                    {analytics.pourCostPercentage <= 22 ? 'On Target' : 'Above Target'}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Turnover</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.inventoryTurnover.toFixed(1)}x</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Times per month
                  </p>
                  <Badge className="mt-2 bg-blue-500/20 text-blue-300">
                    Healthy Rate
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue per Bottle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${(analytics.totalRevenue / analytics.totalBottlesTracked).toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Average per tracked bottle
                  </p>
                  <div className="text-xs text-green-400 flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8% vs last period
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Tier Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="tier-performance"
                    data={[
                      {
                        tier: 'Premium',
                        revenue: analytics.premiumTierRevenue,
                        bottles: Math.floor(analytics.totalBottlesTracked * 0.2),
                        revenuePerBottle: analytics.premiumTierRevenue / (analytics.totalBottlesTracked * 0.2)
                      },
                      {
                        tier: 'Mid-Tier',
                        revenue: analytics.midTierRevenue,
                        bottles: Math.floor(analytics.totalBottlesTracked * 0.5),
                        revenuePerBottle: analytics.midTierRevenue / (analytics.totalBottlesTracked * 0.5)
                      },
                      {
                        tier: 'Well',
                        revenue: analytics.wellTierRevenue,
                        bottles: Math.floor(analytics.totalBottlesTracked * 0.3),
                        revenuePerBottle: analytics.wellTierRevenue / (analytics.totalBottlesTracked * 0.3)
                      }
                    ]}
                    height={400}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Operational Efficiency Tab */}
        <TabsContent value="operations">
          <div className="space-y-6">
            {/* Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2 min</div>
                  <div className="text-xs text-muted-foreground">
                    To variance alerts
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                  <Zap className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.8%</div>
                  <div className="text-xs text-green-400">
                    POS sync uptime
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">96.4%</div>
                  <div className="text-xs text-muted-foreground">
                    Transactions captured
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staff Efficiency</CardTitle>
                  <Target className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-xs text-green-400">
                    Alert resolution rate
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Operational Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Peak Activity Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Peak consumption periods visualization would go here
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="location-comparison"
                    data={locations.map(location => ({
                      name: location.name,
                      accuracy: 85 + Math.random() * 15,
                      efficiency: 80 + Math.random() * 20,
                      revenue: 5000 + Math.random() * 10000
                    }))}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to fetch analytics data
async function fetchAnalyticsData(
  organizationId: string,
  locationId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsData> {
  // This would fetch real data from your API
  // For now, returning mock data that matches the expected structure

  const mockData: AnalyticsData = {
    totalRevenue: 125340,
    totalBottlesTracked: 847,
    theftIncidents: 12,
    inventoryAccuracy: 94.8,
    costSavings: 8950,

    premiumTierRevenue: 52340,
    midTierRevenue: 48250,
    wellTierRevenue: 24750,
    pourCostPercentage: 19.2,
    inventoryTurnover: 2.8,

    openVariances: 8,
    criticalVariances: 2,
    resolvedVariances: 24,
    falsePositives: 3,

    dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: 3000 + Math.random() * 2000,
      bottles: 20 + Math.random() * 15
    })),

    dailyThefts: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      incidents: Math.floor(Math.random() * 3),
      value: Math.random() * 500
    })),

    dailyAccuracy: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      accuracy: 85 + Math.random() * 15
    }))
  }

  return mockData
}