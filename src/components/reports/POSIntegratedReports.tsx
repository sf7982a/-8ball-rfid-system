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
import { HelpTooltip } from '../ui/help-tooltip'
import { BrandVarianceAnalytics } from './BrandVarianceAnalytics'
import { BrandTheftAlerts } from '../alerts/BrandTheftAlerts'
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Total Revenue Tracked</CardTitle>
                    <HelpTooltip
                      title="Total Revenue Tracked"
                      description="The total sales revenue for all bottles that have RFID tags and are being monitored by the system."
                      whatToLookFor="Consistent growth indicates good inventory tracking coverage. Large fluctuations may suggest tracking issues."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Bottles Tracked</CardTitle>
                    <HelpTooltip
                      title="Bottles Tracked"
                      description="The total number of bottles currently equipped with RFID tags and being monitored across all locations."
                      whatToLookFor="Should align with your total inventory count. Missing bottles may indicate lost RFID tags or untracked inventory."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Theft Incidents</CardTitle>
                    <HelpTooltip
                      title="Theft Incidents"
                      description="Number of confirmed theft incidents detected by comparing POS sales data with actual bottle quantities."
                      whatToLookFor="Lower numbers are better. Spikes may indicate security issues or staff training needs. Investigate patterns by location and time."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Inventory Accuracy</CardTitle>
                    <HelpTooltip
                      title="Inventory Accuracy"
                      description="Percentage of time when physical bottle counts match the expected counts based on POS sales and RFID tracking."
                      whatToLookFor="Aim for 95%+ accuracy. Lower percentages suggest tracking issues, theft, or process problems that need attention."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                    <HelpTooltip
                      title="Cost Savings"
                      description="Estimated dollar value of theft prevented by the RFID tracking system this period, compared to industry averages."
                      whatToLookFor="This represents your ROI on the RFID system. Higher savings justify the technology investment and indicate effective loss prevention."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Revenue & Inventory Trends</CardTitle>
                    <HelpTooltip
                      title="Revenue & Inventory Trends"
                      description="Shows daily revenue and bottle sales over time to identify patterns and seasonal trends."
                      whatToLookFor="Look for consistent patterns, unexpected spikes or drops. Correlation between revenue and bottles sold indicates healthy pricing."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Tier Performance Breakdown</CardTitle>
                    <HelpTooltip
                      title="Tier Performance Breakdown"
                      description="Revenue distribution across premium, mid-tier, and well spirits to understand which categories drive the most business."
                      whatToLookFor="Premium should have high revenue per bottle. Well spirits should have high volume. Imbalanced tiers may indicate pricing or inventory issues."
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <AnalyticsCharts
                    type="tier-breakdown"
                    data={[
                      { name: 'Premium', value: analytics.premiumTierRevenue, color: '#ef4444' },
                      { name: 'Mid-Tier', value: analytics.midTierRevenue, color: '#f97316' },
                      { name: 'Well', value: analytics.wellTierRevenue, color: '#22c55e' }
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Open Variances</CardTitle>
                    <HelpTooltip
                      title="Open Variances"
                      description="Inventory discrepancies that have been detected but not yet investigated or resolved."
                      whatToLookFor="These need immediate attention. High numbers indicate systemic issues. Investigate by location and time patterns."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <HelpTooltip
                      title="Critical Alerts"
                      description="High-severity variance detections that indicate likely theft or significant inventory control problems."
                      whatToLookFor="These require immediate investigation. May indicate theft patterns, staff issues, or system malfunctions that need urgent attention."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
                    <HelpTooltip
                      title="Resolved Cases"
                      description="Number of variance detections that have been investigated and closed with a resolution (theft confirmed, false alarm, etc.)."
                      whatToLookFor="High resolution rate indicates good follow-up processes. Track resolution time and outcomes to improve procedures."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                    <HelpTooltip
                      title="Detection Accuracy"
                      description="Percentage of variance alerts that turn out to be legitimate issues rather than false positives."
                      whatToLookFor="Higher accuracy means the system is well-calibrated. Low accuracy may require threshold adjustments to reduce false alarms."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Theft Incidents Over Time</CardTitle>
                    <HelpTooltip
                      title="Theft Incidents Over Time"
                      description="Daily tracking of confirmed theft incidents and their dollar value impact. Shows both frequency and financial impact trends."
                      whatToLookFor="Look for patterns by day of week, shift times, or seasonal trends. Spikes may indicate staff issues, security gaps, or training needs."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Accuracy Improvement</CardTitle>
                    <HelpTooltip
                      title="Accuracy Improvement"
                      description="Tracks how your inventory accuracy percentage improves over time as the system learns your operation and processes improve."
                      whatToLookFor="Should show upward trend as staff adapt and system calibrates. Plateaus above 95% are ideal. Declining trends need investigation."
                    />
                  </div>
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

            {/* Brand Variance Analysis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Brand Variance Analysis</h3>
                <HelpTooltip
                  title="Brand Variance Analysis"
                  description="Systematic analysis of variance patterns by specific alcohol brands to identify theft targets and security vulnerabilities."
                  whatToLookFor="Premium brands like Grey Goose, Hennessy often show higher theft rates. Focus security on brands with high risk scores and increasing trends."
                />
              </div>
              <BrandVarianceAnalytics
                organizationId={organization?.id || ''}
                className="mt-4"
              />
            </div>

            {/* Brand Theft Alerts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Brand Theft Alerts</h3>
                <HelpTooltip
                  title="Brand Theft Alerts"
                  description="Real-time alerts for brands showing suspicious variance patterns that require immediate investigation."
                  whatToLookFor="Critical alerts need immediate action. High-risk brands may need enhanced security measures. Monitor increasing trends closely."
                />
              </div>
              <BrandTheftAlerts
                organizationId={organization?.id || ''}
                className="mt-4"
              />
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Pour Cost Analysis</CardTitle>
                    <HelpTooltip
                      title="Pour Cost Analysis"
                      description="The percentage of revenue spent on alcohol costs. Calculated as (Cost of Goods Sold ÷ Total Alcohol Revenue) × 100."
                      whatToLookFor="Industry standard is 18-22%. Higher percentages suggest over-pouring, theft, or pricing issues. Lower may indicate under-pouring or high prices."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Inventory Turnover</CardTitle>
                    <HelpTooltip
                      title="Inventory Turnover"
                      description="How many times per month your alcohol inventory is completely sold and replaced. Higher turnover means faster-moving inventory."
                      whatToLookFor="2-4x per month is typical for bars. Higher turnover means fresh inventory and good cash flow. Too low may indicate slow-moving stock."
                    />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Revenue per Bottle</CardTitle>
                    <HelpTooltip
                      title="Revenue per Bottle"
                      description="Average revenue generated from each tracked bottle before it's depleted. Indicates pricing effectiveness and portion control."
                      whatToLookFor="Should align with your profit targets. Declining revenue per bottle may indicate theft, over-pouring, or pricing issues that need attention."
                    />
                  </div>
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
                  <CardTitle className="flex items-center gap-2">
                    Revenue by Tier Performance
                    <HelpTooltip
                      title="Revenue by Tier Performance"
                      description="Compares revenue performance across spirit tiers (Premium, Mid-Tier, Well) to understand your product mix profitability and customer preferences."
                      whatToLookFor="Higher revenue per bottle in premium tiers indicates effective upselling. Look for tier imbalances that might suggest pricing or inventory optimization opportunities."
                    />
                  </CardTitle>
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