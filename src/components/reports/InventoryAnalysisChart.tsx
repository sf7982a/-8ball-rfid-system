import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { ReportsService } from '../../lib/api/reports'
import type { 
  CategoryAnalytics, 
  BrandAnalytics, 
  MetricType, 
  AnalyticsFilters 
} from '../../lib/api/reports'
import type { BottleType } from '../../types/inventory'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, BarChart3, Download } from 'lucide-react'

interface ChartData {
  name: string
  bottles: number
  value: number
  volume: number
  category?: string
}

type DrillLevel = 'categories' | 'brands'

export function InventoryAnalysisChart() {
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [locations, setLocations] = useState<Array<{id: string, name: string, code: string}>>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('value')
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('categories')
  const [selectedCategory, setSelectedCategory] = useState<BottleType | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [rawData, setRawData] = useState<CategoryAnalytics[] | BrandAnalytics[]>([])

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

  // Load analytics data when filters change
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!organization?.id) return

      setLoading(true)
      try {
        const filters: AnalyticsFilters = {
          organizationId: organization.id,
          locationId: selectedLocationId
        }

        let data: CategoryAnalytics[] | BrandAnalytics[]

        if (drillLevel === 'categories') {
          data = await ReportsService.getCategoryAnalytics(filters)
        } else {
          if (!selectedCategory) return
          data = await ReportsService.getBrandAnalytics(selectedCategory, filters)
        }

        setRawData(data)
        
        // Transform data for chart
        const transformedData: ChartData[] = data.map(item => {
          if ('category' in item) {
            // CategoryAnalytics
            const categoryItem = item as CategoryAnalytics
            return {
              name: categoryItem.category,
              bottles: categoryItem.bottlesCount,
              value: categoryItem.dollarValue,
              volume: categoryItem.volumeLiters
            }
          } else {
            // BrandAnalytics
            const brandItem = item as BrandAnalytics
            return {
              name: brandItem.brand,
              bottles: brandItem.bottlesCount,
              value: brandItem.dollarValue,
              volume: brandItem.volumeLiters,
              category: brandItem.category
            }
          }
        })

        setChartData(transformedData)
      } catch (error) {
        console.error('Error loading analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalyticsData()
  }, [organization?.id, selectedLocationId, drillLevel, selectedCategory])

  const handleBarClick = (data: ChartData) => {
    if (drillLevel === 'categories') {
      setSelectedCategory(data.name as BottleType)
      setDrillLevel('brands')
    }
  }

  const handleBackToCategories = () => {
    setDrillLevel('categories')
    setSelectedCategory(null)
  }

  const getSelectedLocationName = () => {
    if (!selectedLocationId) return 'All Locations'
    const location = locations.find(l => l.id === selectedLocationId)
    return location?.name || 'Unknown Location'
  }

  const getBreadcrumb = () => {
    const locationName = getSelectedLocationName()
    if (drillLevel === 'categories') {
      return `${locationName} > Categories`
    } else {
      return `${locationName} > Categories > ${selectedCategory}`
    }
  }

  const getMetricValue = (item: ChartData) => {
    switch (selectedMetric) {
      case 'bottles': return item.bottles
      case 'value': return item.value
      case 'volume': return item.volume
      default: return item.value
    }
  }

  const getYAxisLabel = () => {
    switch (selectedMetric) {
      case 'bottles': return 'Bottles Count'
      case 'value': return 'Dollar Value ($)'
      case 'volume': return 'Volume (L)'
      default: return 'Dollar Value ($)'
    }
  }

  const formatTooltipValue = (value: number) => {
    switch (selectedMetric) {
      case 'bottles': return `${value} bottles`
      case 'value': return `$${value.toFixed(2)}`
      case 'volume': return `${value.toFixed(2)}L`
      default: return `$${value.toFixed(2)}`
    }
  }

  const handleExport = () => {
    const locationName = getSelectedLocationName()
    const categoryName = drillLevel === 'brands' ? selectedCategory : undefined
    
    ReportsService.exportAnalyticsData(
      drillLevel === 'categories' ? 'category' : 'brand',
      rawData,
      locationName,
      categoryName || undefined
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            {formatTooltipValue(getMetricValue(data))}
          </p>
          {drillLevel === 'brands' && data.category && (
            <p className="text-xs text-muted-foreground">Category: {data.category}</p>
          )}
          {getSelectedLocationName() !== 'All Locations' && (
            <p className="text-xs text-muted-foreground">Location: {getSelectedLocationName()}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Inventory Analysis</CardTitle>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{getBreadcrumb()}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Location Filter */}
          <div className="flex-1">
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

          {/* Metric Toggle */}
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Metric</label>
            <div className="flex rounded-lg border border-input">
              <Button
                variant={selectedMetric === 'bottles' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('bottles')}
                className="flex-1 rounded-r-none min-h-[44px] touch-manipulation"
              >
                Bottles
              </Button>
              <Button
                variant={selectedMetric === 'value' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('value')}
                className="flex-1 rounded-none border-x min-h-[44px] touch-manipulation"
              >
                Value
              </Button>
              <Button
                variant={selectedMetric === 'volume' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMetric('volume')}
                className="flex-1 rounded-l-none min-h-[44px] touch-manipulation"
              >
                Volume
              </Button>
            </div>
          </div>

          {/* Back Button */}
          {drillLevel === 'brands' && (
            <div className="flex items-end">
              <Button onClick={handleBackToCategories} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </div>
          )}
        </div>

        {/* Chart */}
        <div 
          className="h-96 touch-manipulation"
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available for the selected filters
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: 10, bottom: 80 }}
                onClick={(data) => data?.activePayload?.[0]?.payload && handleBarClick(data.activePayload[0].payload)}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={90}
                  fontSize={10}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={(item: ChartData) => getMetricValue(item)}
                  fill="hsl(var(--primary))"
                  cursor={drillLevel === 'categories' ? 'pointer' : 'default'}
                  className={drillLevel === 'categories' ? 'hover:opacity-80' : ''}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Instructions */}
        {drillLevel === 'categories' && chartData.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Click on any category bar to drill down into brands
          </p>
        )}
      </CardContent>
    </Card>
  )
}