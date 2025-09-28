import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { CreateOrganizationWizard } from './CreateOrganizationWizard'
import { DeleteOrganizationDialog } from './DeleteOrganizationDialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { OrganizationService, type Organization as APIOrganization, type OrganizationStats } from '../../lib/api/organizations'

type Organization = APIOrganization & OrganizationStats
import {
  Plus,
  Search,
  Filter,
  Users,
  Building,
  Activity,
  DollarSign,
  Trash2,
  Edit,
  Eye
} from 'lucide-react'

export function AdminOrganizationView() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load organizations from Supabase
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        const data = await OrganizationService.getOrganizations()
        setOrganizations(data)
      } catch (error) {
        console.error('Failed to load organizations:', error)
        // In real app, show error toast
      } finally {
        setLoading(false)
      }
    }

    loadOrganizations()
  }, [])

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter
    const matchesTier = tierFilter === 'all' || org.tier === tierFilter

    return matchesSearch && matchesStatus && matchesTier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'trial': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'suspended': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'premium': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'basic': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'trial': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCreateOrganization = async (formData: any) => {
    setCreatingOrg(true)
    try {
      console.log('Creating organization:', formData)

      await OrganizationService.createOrganization(formData)

      // Refresh the organizations list
      const updatedOrgs = await OrganizationService.getOrganizations()
      setOrganizations(updatedOrgs)
      setShowCreateModal(false)

      console.log('Organization created successfully!')

    } catch (error) {
      console.error('Failed to create organization:', error)
      // In real app, show error toast
    } finally {
      setCreatingOrg(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!deletingOrg) return

    setIsDeleting(true)
    try {
      console.log('Deleting organization:', deletingOrg.id)

      await OrganizationService.deleteOrganization(deletingOrg.id)

      // Refresh the organizations list
      const updatedOrgs = await OrganizationService.getOrganizations()
      setOrganizations(updatedOrgs)
      setDeletingOrg(null)

      console.log('Organization deleted successfully!')

    } catch (error) {
      console.error('Failed to delete organization:', error)
      // In real app, show error toast
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + org.user_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottles Tracked</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + org.bottles_tracked, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Scans</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + org.monthly_scans, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Organization Management</CardTitle>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <CreateOrganizationWizard
                  onSubmit={handleCreateOrganization}
                  onCancel={() => setShowCreateModal(false)}
                  isLoading={creatingOrg}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Bottles</TableHead>
                  <TableHead>Monthly Scans</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading organizations...
                    </TableCell>
                  </TableRow>
                ) : filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No organizations found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">{org.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(org.tier)}>
                          {org.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.user_count}</TableCell>
                      <TableCell>{org.bottles_tracked.toLocaleString()}</TableCell>
                      <TableCell>{org.monthly_scans.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(org.created_at)}</TableCell>
                      <TableCell>{formatDate(org.last_activity)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingOrg(org)}
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

      {/* Delete Organization Dialog */}
      <DeleteOrganizationDialog
        organization={deletingOrg}
        open={!!deletingOrg}
        onClose={() => setDeletingOrg(null)}
        onConfirm={handleDeleteOrganization}
        isLoading={isDeleting}
      />
    </div>
  )
}