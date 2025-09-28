import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Dot
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { ReportsService } from '../../lib/api/reports'
import type { 
  TrendSeries, 
  TrendFilters, 
  TrendViewType, 
  TimeRange,
  TrendInsights
} from '../../lib/api/reports'
import type { BottleType } from '../../types/inventory'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ZoomOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, TrendingUp, Clock, RotateCcw } from 'lucide-react'

interface TrendChartData {
  date: string
  [key: string]: string | number // Dynamic keys for different series
}

export function InventoryTrends() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Array<{id: string, name: string, code: string}>>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [viewType, setViewType] = useState<TrendViewType>('liquor_type')
  const [selectedLiquorType, setSelectedLiquorType] = useState<BottleType>('vodka')
  const [metricType, setMetricType] = useState<'bottles' | 'value'>('bottles')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  
  const [trendSeries, setTrendSeries] = useState<TrendSeries[]>([])
  const [chartData, setChartData] = useState<TrendChartData[]>([])
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set())
  const [insights, setInsights] = useState<TrendInsights | null>(null)
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null)
  const [activePoint, setActivePoint] = useState<any>(null)
  const [zoomDomain, setZoomDomain] = useState<{left: number, right: number} | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [criticalThreshold] = useState(5) // bottles
  const [reorderThreshold] = useState(10) // bottles
  const chartRef = useRef<any>(null)

  // Enhanced colorblind-friendly palette
  const getEnhancedColors = () => {
    return [
      '#2563eb', // Blue
      '#dc2626', // Red  
      '#16a34a', // Green
      '#ca8a04', // Yellow
      '#7c3aed', // Purple
      '#ea580c', // Orange
      '#0891b2', // Cyan
      '#be185d', // Pink
      '#374151', // Gray
      '#059669'  // Emerald
    ]
  }

  // Calculate trend direction and velocity
  const getTrendDirection = (series: TrendSeries) => {
    if (series.data.length < 2) return { direction: 'stable', velocity: 0, arrow: '→' }
    
    const firstValue = series.data[0][metricType === 'bottles' ? 'bottleCount' : 'dollarValue']
    const lastValue = series.data[series.data.length - 1][metricType === 'bottles' ? 'bottleCount' : 'dollarValue']
    const change = ((lastValue - firstValue) / firstValue) * 100
    
    if (change > 5) return { direction: 'up', velocity: change, arrow: '↗' }
    if (change < -5) return { direction: 'down', velocity: change, arrow: '↘' }
    return { direction: 'stable', velocity: change, arrow: '→' }
  }

  // Calculate consumption rate for tooltips
  const getConsumptionRate = (seriesName: string) => {
    const series = trendSeries.find(s => s.name === seriesName)
    if (!series || series.data.length < 2) return 0
    
    const firstValue = series.data[0].bottleCount
    const lastValue = series.data[series.data.length - 1].bottleCount
    const days = series.data.length - 1
    
    return Math.round(((firstValue - lastValue) / days) * 10) / 10
  }

  // Handle zoom functionality
  const handleZoom = (domain: any) => {
    if (domain && domain.left !== domain.right) {
      setZoomDomain(domain)
      setIsZoomed(true)
    }
  }

  const resetZoom = () => {
    setZoomDomain(null)
    setIsZoomed(false)
  }

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      if (!organization?.id) return
      
      try {
        const locationData = await ReportsService.getLocationsForOrganization(organization.id)
        setLocations(locationData)
      } catch (error) {
        console.error('Error loading locations:', error)
      }
    }

    loadLocations()
  }, [organization?.id])

  // Calculate date range based on timeRange
  const getDateRange = () => {
    const endDate = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          endDate.setTime(new Date(customEndDate).getTime())
        }
        break
    }

    return { startDate, endDate }
  }

  // Debounce custom date changes to prevent excessive API calls
  const debouncedCustomDates = useMemo(() => {
    return { customStartDate, customEndDate }
  }, [customStartDate, customEndDate])

  // Load trend data when filters change
  useEffect(() => {
    const controller = new AbortController()
    
    const loadTrendData = async () => {
      if (!organization?.id) return

      setLoading(true)
      try {
        const { startDate, endDate } = getDateRange()
        
        const filters: TrendFilters = {
          organizationId: organization.id,
          locationId: selectedLocationId,
          startDate,
          endDate,
          viewType,
          selectedLiquorType: viewType === 'brand' ? selectedLiquorType : undefined
        }

        const [seriesData, insightsData] = await Promise.all([
          ReportsService.getTrendData(filters),
          ReportsService.getTrendInsights(filters)
        ])

        // Check if request was cancelled
        if (controller.signal.aborted) return

        // Enhance colors for better accessibility
        const enhancedColors = getEnhancedColors()
        const enhancedSeriesData = seriesData.map((series, index) => ({
          ...series,
          color: enhancedColors[index % enhancedColors.length]
        }))

        setTrendSeries(enhancedSeriesData)
        setInsights(insightsData)

        // Initialize all series as visible
        const allSeriesNames = new Set(enhancedSeriesData.map(s => s.name))
        setVisibleSeries(allSeriesNames)

        // Transform data for recharts
        const transformedData = transformSeriesDataForChart(enhancedSeriesData)
        setChartData(transformedData)

      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error loading trend data:', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    // Debounce for custom date changes
    const timeoutId = setTimeout(() => {
      loadTrendData()
    }, timeRange === 'custom' ? 500 : 0)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [organization?.id, selectedLocationId, timeRange, viewType, selectedLiquorType, debouncedCustomDates])

  const transformSeriesDataForChart = useCallback((series: TrendSeries[]): TrendChartData[] => {
    if (series.length === 0) return []

    // Get all unique dates from all series
    const allDates = new Set<string>()
    series.forEach(s => s.data.forEach(d => allDates.add(d.date)))
    const sortedDates = Array.from(allDates).sort()

    // Transform into recharts format
    return sortedDates.map(date => {
      const dataPoint: TrendChartData = { date }
      
      series.forEach(s => {
        const point = s.data.find(d => d.date === date)
        if (point) {
          dataPoint[s.name] = metricType === 'bottles' ? point.bottleCount : point.dollarValue
        } else {
          // Fix: Set 0 for missing data points instead of undefined
          dataPoint[s.name] = 0
        }
      })
      
      return dataPoint
    })
  }, [metricType])

  const toggleSeriesVisibility = (seriesName: string) => {
    const newVisibleSeries = new Set(visibleSeries)
    if (newVisibleSeries.has(seriesName)) {
      newVisibleSeries.delete(seriesName)
    } else {
      newVisibleSeries.add(seriesName)
    }
    setVisibleSeries(newVisibleSeries)
  }

  const getSelectedLocationName = () => {
    if (!selectedLocationId) return 'All Locations'
    const location = locations.find(l => l.id === selectedLocationId)
    return location?.name || 'Unknown Location'
  }

  const formatTooltipValue = (value: number) => {
    return metricType === 'bottles' ? `${value} bottles` : `$${value.toFixed(2)}`
  }

  const formatYAxisLabel = () => {
    return metricType === 'bottles' ? 'Bottles Count' : 'Dollar Value ($)'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg min-w-64">
          <p className="font-semibold mb-3 text-sm">{new Date(label).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}</p>
          {payload
            .filter((entry: any) => visibleSeries.has(entry.dataKey))
            .map((entry: any, index: number) => {
              const consumptionRate = getConsumptionRate(entry.dataKey)
              const series = trendSeries.find(s => s.name === entry.dataKey)
              const trend = series ? getTrendDirection(series) : { direction: 'stable', velocity: 0, arrow: '→' }
              
              return (
                <div key={index} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="font-medium text-sm">{entry.dataKey}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatTooltipValue(entry.value)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{consumptionRate} bottles/day avg</span>
                    <span className={`flex items-center space-x-1 ${
                      trend.direction === 'up' ? 'text-green-600' : 
                      trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <span>{trend.arrow}</span>
                      <span>{Math.abs(trend.velocity).toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
              )
            })}
        </div>
      )
    } else {
      setActivePoint(null)
    }
    return null
  }

  // Custom Legend with trend indicators
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload?.map((entry: any, index: number) => {
          const series = trendSeries.find(s => s.name === entry.value)
          const trend = series ? getTrendDirection(series) : { direction: 'stable', velocity: 0, arrow: '→' }
          const isVisible = visibleSeries.has(entry.value)
          
          return (
            <div
              key={index}
              onClick={() => toggleSeriesVisibility(entry.value)}
              onMouseEnter={() => setHoveredSeries(entry.value)}
              onMouseLeave={() => setHoveredSeries(null)}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-all ${
                isVisible ? 'opacity-100' : 'opacity-50'
              } ${hoveredSeries === entry.value ? 'bg-muted' : ''}`}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className={`text-sm font-medium ${!isVisible ? 'line-through' : ''}`}>
                {entry.value}
              </span>
              <span 
                className={`text-xs ${
                  trend.direction === 'up' ? 'text-green-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}
                title={`${trend.velocity.toFixed(1)}% change`}
              >
                {trend.arrow}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Custom Dot component for active points
  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props
    const isActive = activePoint && payload?.date === activePoint.x
    const isHovered = hoveredSeries === dataKey
    
    if (!visibleSeries.has(dataKey)) return null
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isActive ? 6 : isHovered ? 5 : 4}
        fill={props.fill}
        stroke="#fff"
        strokeWidth={isActive ? 3 : 2}
        className={isActive ? 'drop-shadow-lg' : ''}
        style={{
          filter: isActive ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Inventory Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Select 
                value={selectedLocationId || 'all'} 
                onValueChange={(value) => setSelectedLocationId(value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">Time Range</label>
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">View Type</label>
              <div className="flex rounded-lg border border-input">
                <Button
                  variant={viewType === 'liquor_type' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('liquor_type')}
                  className="flex-1 rounded-r-none min-h-[44px] touch-manipulation"
                >
                  By Type
                </Button>
                <Button
                  variant={viewType === 'brand' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('brand')}
                  className="flex-1 rounded-l-none min-h-[44px] touch-manipulation"
                >
                  By Brand
                </Button>
              </div>
            </div>

            {/* Metric Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">Metric</label>
              <div className="flex rounded-lg border border-input">
                <Button
                  variant={metricType === 'bottles' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMetricType('bottles')}
                  className="flex-1 rounded-r-none min-h-[44px] touch-manipulation"
                >
                  Bottles
                </Button>
                <Button
                  variant={metricType === 'value' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMetricType('value')}
                  className="flex-1 rounded-l-none min-h-[44px] touch-manipulation"
                >
                  Value
                </Button>
              </div>
            </div>
          </div>

          {/* Brand Selection (when view type is brand) */}
          {viewType === 'brand' && (
            <div className="max-w-xs">
              <label className="text-sm font-medium mb-1 block">Liquor Type</label>
              <Select 
                value={selectedLiquorType} 
                onValueChange={(value: BottleType) => setSelectedLiquorType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vodka">Vodka</SelectItem>
                  <SelectItem value="whiskey">Whiskey</SelectItem>
                  <SelectItem value="rum">Rum</SelectItem>
                  <SelectItem value="gin">Gin</SelectItem>
                  <SelectItem value="tequila">Tequila</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Date Range */}
          {timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">
              {getSelectedLocationName()} - {viewType === 'liquor_type' ? 'By Liquor Type' : `${selectedLiquorType} Brands`}
            </CardTitle>
            {isZoomed && (
              <Button onClick={resetZoom} variant="outline" size="sm">
                <ZoomOut className="h-4 w-4 mr-2" />
                Reset Zoom
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="h-96 relative touch-manipulation"
            onTouchStart={(e) => {
              // Improve touch responsiveness
              e.currentTarget.style.touchAction = 'manipulation'
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Trend analysis requires 7+ days of inventory tracking</p>
                <p className="text-sm mb-4">
                  {trendSeries.length === 0 
                    ? "No inventory data found for the selected time period and filters"
                    : "Historical data will be available once inventory tracking begins"
                  }
                </p>
                <div className="text-xs text-muted-foreground text-center max-w-md">
                  <p className="mb-2">• Make sure bottles exist in the selected location</p>
                  <p className="mb-2">• Try extending the time range</p>
                  <p>• Daily inventory snapshots will be captured automatically going forward</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 80 }}
                  onMouseDown={(e) => e && handleZoom(e)}
                  onMouseMove={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      setActivePoint({
                        x: e.activePayload[0]?.payload?.date,
                        value: e.activePayload[0]?.value
                      })
                    }
                  }}
                  onMouseLeave={() => setActivePoint(null)}
                  ref={chartRef}
                >
                  <defs>
                    <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid 
                    strokeDasharray="2 4" 
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.3}
                    horizontalPoints={[]}
                  />
                  
                  {/* Critical threshold lines */}
                  {metricType === 'bottles' && (
                    <>
                      <ReferenceLine 
                        y={criticalThreshold} 
                        stroke="#dc2626" 
                        strokeDasharray="8 4"
                        strokeWidth={2}
                        label={{ value: "Critical Level", position: "left" }}
                      />
                      <ReferenceLine 
                        y={reorderThreshold} 
                        stroke="#ca8a04" 
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: "Reorder Point", position: "left" }}
                      />
                    </>
                  )}
                  
                  {/* Zero line emphasis */}
                  <ReferenceLine 
                    y={0} 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    strokeOpacity={0.8}
                  />
                  
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                    domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
                  />
                  <YAxis 
                    label={{ value: formatYAxisLabel(), angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => metricType === 'bottles' ? value : `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    content={<CustomLegend />}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  
                  {trendSeries.map((series) => {
                    const isHovered = hoveredSeries === series.name
                    const isVisible = visibleSeries.has(series.name)
                    
                    return (
                      <Line
                        key={series.name}
                        type="monotone"
                        dataKey={series.name}
                        stroke={series.color}
                        strokeWidth={isHovered ? 4 : 3}
                        strokeOpacity={isVisible ? 1 : 0.3}
                        dot={<CustomDot />}
                        activeDot={{ 
                          r: 6, 
                          stroke: series.color, 
                          strokeWidth: 3, 
                          fill: '#fff',
                          filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))'
                        }}
                        hide={!isVisible}
                        onMouseEnter={() => setHoveredSeries(series.name)}
                        onMouseLeave={() => setHoveredSeries(null)}
                        onTouchStart={() => setHoveredSeries(series.name)}
                        onTouchEnd={() => setHoveredSeries(null)}
                        className="transition-all duration-200"
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {chartData.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Hover over lines for details • Click legend to toggle • Drag to zoom
              </p>
              {insights?.fastestDeclining && (
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Fastest declining: {insights.fastestDeclining.name} ({insights.fastestDeclining.changePercent}%)
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Insights Panel */}
      {insights && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span>Fastest Declining</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.fastestDeclining ? (
                <div>
                  <p className="font-semibold">{insights.fastestDeclining.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {insights.fastestDeclining.changePercent}% decline
                  </p>
                  {insights.fastestDeclining.category && (
                    <Badge variant="outline" className="mt-1">
                      {insights.fastestDeclining.category}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No declining items</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span>Consumption Velocity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{insights.averageConsumptionVelocity} bottles/day</p>
              <p className="text-sm text-muted-foreground">Average across all items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Projected Stockouts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{insights.projectedStockouts.length} items</p>
              <p className="text-sm text-muted-foreground">
                {insights.projectedStockouts.length > 0 
                  ? `Next: ${insights.projectedStockouts[0].daysRemaining} days`
                  : 'No immediate stockouts'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <RotateCcw className="h-4 w-4 text-green-500" />
                <span>Turnover Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{insights.inventoryTurnoverRate}x/month</p>
              <p className="text-sm text-muted-foreground">Inventory rotation</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}