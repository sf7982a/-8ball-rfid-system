import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Plus, Edit, Trash2, AlertCircle, MapPin, Building } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LocationService } from '../../lib/api/bottles'
import { LocationForm } from '../../components/locations/LocationForm'
import { DeleteLocationDialog } from '../../components/locations/DeleteLocationDialog'
import type { Location } from '../../types/inventory'

export function LocationsPage() {
  const { organization } = useAuth()
  
  // State
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    if (!organization?.id) return

    try {
      setLoading(true)
      setError(null)

      const locationsData = await LocationService.getLocations(organization.id)
      setLocations(locationsData)
    } catch (err: any) {
      console.error('Failed to load locations data:', err)
      setError(err.message || 'Failed to load locations data')
    } finally {
      setLoading(false)
    }
  }, [organization?.id])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle create location
  const handleCreateLocation = async (data: any) => {
    if (!organization?.id) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await LocationService.createLocation(organization.id, data)
      setShowAddModal(false)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to create location')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle update location
  const handleUpdateLocation = async (data: any) => {
    if (!organization?.id || !editingLocation) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await LocationService.updateLocation(editingLocation.id, organization.id, data)
      setEditingLocation(null)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to update location')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete location
  const handleDeleteLocation = async () => {
    if (!organization?.id || !deletingLocation) return

    try {
      setActionLoading(true)
      setActionError(null)
      
      await LocationService.deleteLocation(deletingLocation.id, organization.id)
      setDeletingLocation(null)
      await loadData() // Reload data
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete location')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Location Management</h1>
          <p className="text-muted-foreground">
            Manage your bar and storage locations
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {locations.filter(l => l.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Locations</CardTitle>
            <MapPin className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {locations.filter(l => !l.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading locations...
                    </TableCell>
                  </TableRow>
                ) : locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No locations found. Create your first location to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {location.code}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={location.isActive 
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }
                        >
                          {location.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(location.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLocation(location)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingLocation(location)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Location Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl bg-background border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Location</DialogTitle>
          </DialogHeader>
          <LocationForm
            onSubmit={handleCreateLocation}
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

      {/* Edit Location Modal */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-2xl bg-background border-2 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Location</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <LocationForm
              location={editingLocation}
              onSubmit={handleUpdateLocation}
              onCancel={() => setEditingLocation(null)}
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
      <DeleteLocationDialog
        location={deletingLocation}
        open={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteLocation}
        isLoading={actionLoading}
        error={actionError}
      />
    </div>
  )
}