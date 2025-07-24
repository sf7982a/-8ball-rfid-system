import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Plus, Package, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BottleService, LocationService } from '../../lib/api/bottles'
import { BottleTable } from '../../components/inventory/BottleTable'
import { BottleForm } from '../../components/inventory/BottleForm'
import { DeleteBottleDialog } from '../../components/inventory/DeleteBottleDialog'
import type { 
  BottleWithLocation, 
  BottleFilters, 
  BottleSortConfig, 
  Location 
} from '../../types/inventory'

export function InventoryPage() {
  const { organization } = useAuth()
  
  // State
  const [bottles, setBottles] = useState<BottleWithLocation[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    depleted: 0,
    missing: 0,
    damaged: 0
  })
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [filters, setFilters] = useState<BottleFilters>({})
  const [sort, setSort] = useState<BottleSortConfig>({ field: 'createdAt', direction: 'desc' })
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBottle, setEditingBottle] = useState<BottleWithLocation | null>(null)
  const [deletingBottle, setDeletingBottle] = useState<BottleWithLocation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    if (!organization?.id) return

    try {
      setLoading(true)
      setError(null)

      // Load bottles, locations, and stats in parallel
      const [bottlesResult, locationsData, statsData] = await Promise.all([
        BottleService.getBottles(organization.id, filters, sort, currentPage, pageSize),
        LocationService.getLocations(organization.id),
        BottleService.getInventoryStats(organization.id)
      ])

      setBottles(bottlesResult.bottles)
      setTotal(bottlesResult.total)
      setLocations(locationsData)
      setStats(statsData)
    } catch (err: any) {
      console.error('Failed to load inventory data:', err)
      setError(err.message || 'Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }, [organization?.id, filters, sort, currentPage, pageSize])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filters, sort])

  // Handle create bottle
  const handleCreateBottle = async (data: any) => {
    if (!organization?.id) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await BottleService.createBottle(organization.id, data)
      setShowAddModal(false)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to create bottle')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle update bottle
  const handleUpdateBottle = async (data: any) => {
    if (!organization?.id || !editingBottle) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await BottleService.updateBottle(editingBottle.id, organization.id, data)
      setEditingBottle(null)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to update bottle')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete bottle
  const handleDeleteBottle = async () => {
    if (!organization?.id || !deletingBottle) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await BottleService.deleteBottle(deletingBottle.id, organization.id)
      setDeletingBottle(null)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete bottle')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle filters change
  const handleFiltersChange = (newFilters: BottleFilters) => {
    setFilters(newFilters)
  }

  // Handle sort change
  const handleSortChange = (newSort: BottleSortConfig) => {
    setSort(newSort)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your RFID-tagged bottle inventory
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Bottle
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Bottles</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Depleted</CardTitle>
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.depleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">
              {stats.missing + stats.damaged}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottles Table */}
      <BottleTable
        bottles={bottles}
        locations={locations}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        filters={filters}
        sort={sort}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onEdit={setEditingBottle}
        onDelete={setDeletingBottle}
      />

      {/* Add Bottle Modal */}
      <Dialog 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Bottle</DialogTitle>
          </DialogHeader>
          <BottleForm
            onSubmit={handleCreateBottle}
            onCancel={() => setShowAddModal(false)}
            isLoading={actionLoading}
          />
          {actionError && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bottle Modal */}
      <Dialog 
        open={!!editingBottle} 
        onOpenChange={(open) => !open && setEditingBottle(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Bottle</DialogTitle>
          </DialogHeader>
          {editingBottle && (
            <BottleForm
              bottle={editingBottle}
              onSubmit={handleUpdateBottle}
              onCancel={() => setEditingBottle(null)}
              isLoading={actionLoading}
            />
          )}
          {actionError && (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteBottleDialog
        bottle={deletingBottle}
        open={!!deletingBottle}
        onClose={() => setDeletingBottle(null)}
        onConfirm={handleDeleteBottle}
        isLoading={actionLoading}
        error={actionError}
      />
    </div>
  )
}