import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { VarianceSettings } from '../../components/settings/VarianceSettings'
import { POSConfigForm } from '../../components/pos/POSConfigForm'
import { toast } from 'sonner'
import {
  Zap,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react'

interface POSIntegration {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive' | 'error'
  lastSync: string
  transactionsToday: number
  errorCount: number
}

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [integrations] = useState<POSIntegration[]>([
    {
      id: '1',
      name: 'Main Bar POS',
      provider: 'toast',
      status: 'active',
      lastSync: '2 minutes ago',
      transactionsToday: 127,
      errorCount: 0
    },
    {
      id: '2',
      name: 'Restaurant POS',
      provider: 'square',
      status: 'inactive',
      lastSync: '3 hours ago',
      transactionsToday: 89,
      errorCount: 2
    }
  ])

  const handleSync = async (integrationId: string) => {
    toast.info('Syncing POS data...')
    // Simulate sync
    setTimeout(() => {
      toast.success('POS data synced successfully')
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">POS Integrations</h1>
        <p className="text-muted-foreground">
          Manage Point of Sale system integrations and variance detection settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">POS Systems</TabsTrigger>
          <TabsTrigger value="variance">Variance Detection</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                  <Zap className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{integrations.filter(i => i.status === 'active').length}</div>
                  <div className="text-xs text-green-400">
                    of {integrations.length} total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions Today</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {integrations.reduce((sum, i) => sum + i.transactionsToday, 0)}
                  </div>
                  <div className="text-xs text-blue-400">
                    Across all locations
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                  <RefreshCw className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.4%</div>
                  <div className="text-xs text-purple-400">
                    Uptime this month
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Variance Alerts</CardTitle>
                  <Shield className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-orange-400">
                    Requiring attention
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map(integration => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(integration.status)}
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {integration.provider.charAt(0).toUpperCase() + integration.provider.slice(1)} •
                            Last sync: {integration.lastSync}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{integration.transactionsToday} transactions</div>
                          <div className="text-xs text-muted-foreground">
                            {integration.errorCount > 0 ? `${integration.errorCount} errors` : 'No errors'}
                          </div>
                        </div>

                        <Badge className={getStatusColor(integration.status)}>
                          {integration.status}
                        </Badge>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* POS Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">POS System Integrations</h2>
                <p className="text-muted-foreground">Configure and manage your Point of Sale system connections</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </div>

            <POSConfigForm />
          </div>
        </TabsContent>

        {/* Variance Detection Tab */}
        <TabsContent value="variance">
          <VarianceSettings />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Performance metrics and insights for your POS integrations
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">Analytics Dashboard</p>
                  <p className="text-sm">Integration performance metrics and insights coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntegrationsPage