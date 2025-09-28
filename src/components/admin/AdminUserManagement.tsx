import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  UserPlus,
  Search,
  Filter,
  Mail,
  Shield,
  Calendar,
  Users,
  Ban,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  UserCheck,
  Activity
} from 'lucide-react'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: 'super_admin' | 'company_admin' | 'manager' | 'staff'
  organization_id?: string
  organization_name?: string
  status: 'active' | 'pending' | 'suspended' | 'inactive'
  created_at: string
  last_sign_in_at?: string
  invitation_sent_at?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  organization_id?: string
  organization_name?: string
  status: 'pending' | 'accepted' | 'expired'
  sent_at: string
  expires_at: string
  invited_by: string
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff',
    organization_id: '',
    custom_message: ''
  })

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '4e8dbe23-af70-43f7-a389-91a52c3ba66e',
        email: 'samfisher0808@gmail.com',
        role: 'super_admin',
        status: 'active',
        created_at: '2025-09-26T19:26:21.107183+00:00',
        last_sign_in_at: '2025-09-26T20:00:00.000Z'
      },
      {
        id: 'user-2',
        email: 'manager@demo-restaurant.com',
        first_name: 'John',
        last_name: 'Smith',
        role: 'company_admin',
        organization_id: 'org-2',
        organization_name: 'Demo Restaurant Group',
        status: 'active',
        created_at: '2025-09-25T10:00:00.000Z',
        last_sign_in_at: '2025-09-26T18:30:00.000Z'
      },
      {
        id: 'user-3',
        email: 'bartender@demo-restaurant.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'staff',
        organization_id: 'org-2',
        organization_name: 'Demo Restaurant Group',
        status: 'active',
        created_at: '2025-09-25T14:00:00.000Z',
        last_sign_in_at: '2025-09-26T19:00:00.000Z'
      },
      {
        id: 'user-4',
        email: 'admin@luxury-hotels.com',
        first_name: 'Michael',
        last_name: 'Chen',
        role: 'company_admin',
        organization_id: 'org-3',
        organization_name: 'Luxury Hotel Chain',
        status: 'pending',
        created_at: '2025-09-26T08:00:00.000Z',
        invitation_sent_at: '2025-09-26T08:00:00.000Z'
      }
    ]

    const mockInvitations: Invitation[] = [
      {
        id: 'inv-1',
        email: 'newuser@demo-restaurant.com',
        role: 'manager',
        organization_id: 'org-2',
        organization_name: 'Demo Restaurant Group',
        status: 'pending',
        sent_at: '2025-09-26T10:00:00.000Z',
        expires_at: '2025-10-03T10:00:00.000Z',
        invited_by: 'samfisher0808@gmail.com'
      },
      {
        id: 'inv-2',
        email: 'supervisor@luxury-hotels.com',
        role: 'manager',
        organization_id: 'org-3',
        organization_name: 'Luxury Hotel Chain',
        status: 'expired',
        sent_at: '2025-09-19T15:00:00.000Z',
        expires_at: '2025-09-26T15:00:00.000Z',
        invited_by: 'samfisher0808@gmail.com'
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setInvitations(mockInvitations)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesOrg = orgFilter === 'all' || user.organization_id === orgFilter

    return matchesSearch && matchesRole && matchesStatus && matchesOrg
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'company_admin': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'manager': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'staff': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'suspended': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'inactive': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleInviteUser = () => {
    // Implement invitation logic
    console.log('Inviting user:', inviteForm)
    setShowInviteModal(false)
    setInviteForm({ email: '', role: 'staff', organization_id: '', custom_message: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invitations.filter(i => i.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'super_admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>User Management</CardTitle>
                <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Invite New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteForm.role} onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="company_admin">Company Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="organization">Organization</Label>
                        <Select value={inviteForm.organization_id} onValueChange={(value) => setInviteForm(prev => ({ ...prev, organization_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org-2">Demo Restaurant Group</SelectItem>
                            <SelectItem value="org-3">Luxury Hotel Chain</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="message">Custom Message (Optional)</Label>
                        <Textarea
                          id="message"
                          placeholder="Add a personal message to the invitation..."
                          value={inviteForm.custom_message}
                          onChange={(e) => setInviteForm(prev => ({ ...prev, custom_message: e.target.value }))}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleInviteUser} className="flex-1">
                          <Send className="mr-2 h-4 w-4" />
                          Send Invitation
                        </Button>
                        <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
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
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No users found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.email}
                              </div>
                              {user.first_name && user.last_name && (
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.organization_name || 'System Admin'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Ban className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{invitation.organization_name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invitation.status)}>
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(invitation.sent_at)}</TableCell>
                        <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                        <TableCell>{invitation.invited_by}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  User activity audit log would display:
                  <br />• Login/logout events with IP addresses and locations
                  <br />• Role changes and permission modifications
                  <br />• Account creation, suspension, and deletion events
                  <br />• Failed login attempts and security events
                  <br />• Data access and modification logs
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}