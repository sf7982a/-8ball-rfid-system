import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardService } from '../../lib/api/dashboard'
import type { 
  DashboardStats, 
  LocationStats, 
  BrandStats, 
  TypeStats, 
  LowStockItem 
} from '../../lib/api/dashboard'

import { StatsCard } from '../../components/dashboard/StatsCard'
import { LocationStatsCard } from '../../components/dashboard/LocationStatsCard'
import { BrandsList } from '../../components/dashboard/BrandsList'
import { TypeStats as TypeStatsComponent } from '../../components/dashboard/TypeStats'
import { LowStockAlert } from '../../components/dashboard/LowStockAlert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw, Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { organization, user, profile } = useAuth()
  const [loading, setLoading] = useState(true)

  // Debug authentication state
  useEffect(() => {
    console.log('Dashboard Auth State:', {
      hasUser: !!user,
      hasProfile: !!profile,
      hasOrganization: !!organization,
      organizationId: organization?.id,
      userId: user?.id,
      userEmail: user?.email
    })
  }, [user, profile, organization])
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [locationStats, setLocationStats] = useState<LocationStats[]>([])
  const [brandStats, setBrandStats] = useState<BrandStats[]>([])
  const [typeStats, setTypeStats] = useState<TypeStats[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])

  const loadDashboardData = async (showRefreshState = false) => {
    console.log('loadDashboardData called:', {
      organizationId: organization?.id,
      showRefreshState
    })

    if (!organization?.id) {
      console.warn('No organization ID available, skipping dashboard data load')
      return
    }

    try {
      if (showRefreshState) setRefreshing(true)
      else setLoading(true)

      console.log('Making dashboard API calls for org:', organization.id)

      const [stats, locations, brands, types, lowStock] = await Promise.all([
        DashboardService.getDashboardStats(organization.id),
        DashboardService.getLocationStats(organization.id),
        DashboardService.getBrandStats(organization.id),
        DashboardService.getTypeStats(organization.id),
        DashboardService.getLowStockItems(organization.id)
      ])

      console.log('Dashboard API responses:', {
        stats,
        locations: locations?.length,
        brands: brands?.length,
        types: types?.length,
        lowStock: lowStock?.length
      })

      setDashboardStats(stats)
      setLocationStats(locations)
      setBrandStats(brands)
      setTypeStats(types)
      setLowStockItems(lowStock)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [organization?.id])

  useEffect(() => {
    if (!organization?.id) return

    const unsubscribe = DashboardService.subscribeToInventoryChanges(
      organization.id,
      () => loadDashboardData(true)
    )

    return () => {
      unsubscribe()
    }
  }, [organization?.id])

  const handleRefresh = () => {
    loadDashboardData(true)
  }

  const filteredLocationStats = selectedLocationId 
    ? locationStats.filter(loc => loc.locationId === selectedLocationId)
    : locationStats

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Temporary fallback: Show basic dashboard even without organization data
  if (!organization?.id) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Inventory Dashboard</h1>
          <Button onClick={() => loadDashboardData()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Loading Organization Data...</h3>
          <p className="text-yellow-700 text-sm mb-3">
            Your organization data is still loading. The dashboard will populate once authentication completes.
          </p>
          <div className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
            Auth State: user={!!user}, profile={!!profile}, organization={!!organization}
          </div>
        </div>

        {/* Show placeholder cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Debug info */}
      <div className="bg-blue-50 p-3 rounded text-xs mb-4">
        Dashboard loaded! Org: {organization?.name} ({organization?.id})
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Inventory Dashboard</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="w-fit"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Bottles"
          value={dashboardStats?.totalBottles || 0}
          subtitle={`${dashboardStats?.activeBottles || 0} active`}
          icon={<Package />}
        />
        <StatsCard
          title="Total Value"
          value={`$${(dashboardStats?.totalValue || 0).toFixed(2)}`}
          subtitle="Current inventory value"
          icon={<DollarSign />}
        />
        <StatsCard
          title="Low Stock Items"
          value={dashboardStats?.lowStockCount || 0}
          subtitle="Items below 25%"
          icon={<AlertTriangle />}
          className={dashboardStats?.lowStockCount ? 'border-yellow-200 bg-yellow-50' : ''}
        />
        <StatsCard
          title="Active Locations"
          value={locationStats.length}
          subtitle="Locations with inventory"
          icon={<TrendingUp />}
        />
      </div>

      {/* Location Switcher */}
      {locationStats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedLocationId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLocationId(null)}
          >
            All Locations
          </Button>
          {locationStats.map((location) => (
            <Button
              key={location.locationId}
              variant={selectedLocationId === location.locationId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLocationId(location.locationId)}
            >
              {location.locationName}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TypeStatsComponent types={typeStats} />
            <LowStockAlert items={lowStockItems.slice(0, 5)} />
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocationStats.map((location) => (
              <LocationStatsCard
                key={location.locationId}
                location={location}
                isSelected={selectedLocationId === location.locationId}
                onClick={() => setSelectedLocationId(
                  selectedLocationId === location.locationId ? null : location.locationId
                )}
              />
            ))}
          </div>
          {filteredLocationStats.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No inventory found for the selected location
            </div>
          )}
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <BrandsList brands={brandStats} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <LowStockAlert items={lowStockItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
