import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { Bottle, BottleWithLocation, BottleFilters, BottleSortConfig, Location } from '../../types/inventory'
import { BOTTLE_TYPES, BOTTLE_STATUSES } from '../../types/inventory'

interface BottleTableProps {
  bottles: BottleWithLocation[]
  locations: Location[]
  total: number
  currentPage: number
  pageSize: number
  filters: BottleFilters
  sort: BottleSortConfig
  loading?: boolean
  onFiltersChange: (_filters: BottleFilters) => void
  onSortChange: (_sort: BottleSortConfig) => void
  onPageChange: (_page: number) => void
  onEdit: (_bottle: BottleWithLocation) => void
  onDelete: (_bottle: BottleWithLocation) => void
}

const statusColors = {
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  depleted: 'bg-red-500/20 text-red-300 border-red-500/30',
  missing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  damaged: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
}

export function BottleTable({
  bottles,
  locations,
  total,
  currentPage,
  pageSize,
  filters,
  sort,
  loading = false,
  onFiltersChange,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete
}: BottleTableProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    
    // Clear existing timeout to prevent memory leak
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined })
    }, 300)
    
    setSearchTimeout(timeoutId)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Handle sort change
  const handleSort = (field: keyof Bottle) => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
    onSortChange({ field, direction: newDirection })
  }

  // Render sort icon
  const renderSortIcon = (field: keyof Bottle) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />
    }
    return sort.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Inventory ({total} bottles)</CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand, product, or RFID tag..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Type Filter */}
            <Select 
              value={filters.type || 'all'} 
              onValueChange={(value) => 
                onFiltersChange({ 
                  ...filters, 
                  type: value === 'all' ? undefined : value as any 
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {BOTTLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select 
              value={filters.status || 'all'} 
              onValueChange={(value) => 
                onFiltersChange({ 
                  ...filters, 
                  status: value === 'all' ? undefined : value as any 
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {BOTTLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select 
              value={filters.locationId || 'all'} 
              onValueChange={(value) => 
                onFiltersChange({ 
                  ...filters, 
                  locationId: value === 'all' ? undefined : value 
                })
              }
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="w-full overflow-auto">
          <div className="rounded-md border min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] sm:w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('rfidTag')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      RFID Tag
                      {renderSortIcon('rfidTag')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('brand')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      Brand
                      {renderSortIcon('brand')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('product')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      Product
                      {renderSortIcon('product')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('type')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      Type
                      {renderSortIcon('type')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">Size</TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('currentQuantity')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      Quantity
                      {renderSortIcon('currentQuantity')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-xs sm:text-sm"
                    >
                      Status
                      {renderSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Location</TableHead>
                  <TableHead className="text-right min-w-[80px]">Price</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading bottles...
                  </TableCell>
                </TableRow>
              ) : bottles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No bottles found
                  </TableCell>
                </TableRow>
              ) : (
                bottles.map((bottle) => (
                  <TableRow key={bottle.id}>
                    <TableCell className="font-mono text-xs sm:text-sm">
                      {bottle.rfidTag}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {bottle.brand}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {bottle.product}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <span className="capitalize">{bottle.type}</span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {bottle.size}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {parseFloat(bottle.currentQuantity || '0').toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[bottle.status]} text-xs`}>
                        {bottle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {bottle.location?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {bottle.retailPrice ? `$${parseFloat(bottle.retailPrice).toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(bottle)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(bottle)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Showing {startItem}-{endItem} of {total} bottles
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-8 px-2 sm:px-3"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Previous</span>
              </Button>
              <div className="text-xs sm:text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}