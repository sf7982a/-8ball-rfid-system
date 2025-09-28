import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../contexts/AuthContext'
import { AdminOrganizationView } from '../../components/admin/AdminOrganizationView'
import { AdminUserManagement } from '../../components/admin/AdminUserManagement'
import { AdminAnalyticsDashboard } from '../../components/admin/AdminAnalyticsDashboard'
import { AdminConfigPanel } from '../../components/admin/AdminConfigPanel'
import {
  Building,
  Users,
  BarChart3,
  Settings,
  DollarSign,
  Shield,
  Server,
  CheckCircle,
  Clock
} from 'lucide-react'

export function AdminPage() {
  const { profile, organization } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Mock system status data
  const systemStatus = {
    organizations: 3,
    active_users: 18,
    monthly_revenue: 1198,
    system_health: 'healthy',
    pending_invitations: 2,
    recent_signups: 5
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive system administration and multi-tenant management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <CheckCircle className="mr-1 h-3 w-3" />
            System Healthy
          </Badge>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.organizations}</div>
                  <div className="text-xs text-green-400">+1 this month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.active_users}</div>
                  <div className="text-xs text-green-400">+{systemStatus.recent_signups} this week</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${systemStatus.monthly_revenue}</div>
                  <div className="text-xs text-green-400">+8% vs last month</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.pending_invitations}</div>
                  <div className="text-xs text-blue-400">Need follow-up</div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('organizations')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Organization Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Create and manage customer organizations with settings, tier management, and user analytics.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Organizations
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('users')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Invite users, assign roles, manage permissions, and monitor user activity across all organizations.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('analytics')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    System Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Monitor performance, usage metrics, billing analytics, and system health across all tenants.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('config')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-500" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Configure global settings, feature flags, integrations, security policies, and maintenance.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Configure System
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* System Health & Current Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">92ms avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <span className="text-sm font-medium">99.8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage Usage</span>
                    <span className="text-sm font-medium">204 MB / 100 GB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Current Admin Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Admin User</span>
                    <span className="text-sm font-medium">{profile?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Role</span>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {profile?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Organization</span>
                    <span className="text-sm font-medium">{organization?.name || 'System Admin'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Session Started</span>
                    <span className="text-sm font-medium">{new Date().toLocaleTimeString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="organizations">
          <AdminOrganizationView />
        </TabsContent>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="analytics">
          <AdminAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="config">
          <AdminConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage