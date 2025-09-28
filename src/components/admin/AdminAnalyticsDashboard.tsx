import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Building,
  Zap,
  DollarSign,
  Database,
  Clock,
  AlertTriangle,
  Download,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'

interface UsageMetrics {
  organization_id: string
  organization_name: string
  rfid_scans: number
  bottles_tracked: number
  storage_used_mb: number
  active_users: number
  api_requests: number
  avg_response_time: number
  error_rate: number
  monthly_revenue: number
}

interface SystemMetrics {
  total_users: number
  total_organizations: number
  total_scans_today: number
  total_scans_month: number
  avg_response_time: number
  error_rate: number
  uptime_percentage: number
  storage_used_gb: number
  storage_limit_gb: number
}

export function AdminAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedOrg, setSelectedOrg] = useState('all')
  const [loading, setLoading] = useState(true)
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockUsageMetrics: UsageMetrics[] = [
      {
        organization_id: '7e4c68fd-f6a8-4aa6-97a1-aa38711aafd2',
        organization_name: '8Ball RFID Demo',
        rfid_scans: 0,
        bottles_tracked: 0,
        storage_used_mb: 2.5,
        active_users: 1,
        api_requests: 150,
        avg_response_time: 120,
        error_rate: 0.0,
        monthly_revenue: 0
      },
      {
        organization_id: 'org-2',
        organization_name: 'Demo Restaurant Group',
        rfid_scans: 2400,
        bottles_tracked: 150,
        storage_used_mb: 45.8,
        active_users: 5,
        api_requests: 8500,
        avg_response_time: 95,
        error_rate: 0.2,
        monthly_revenue: 299
      },
      {
        organization_id: 'org-3',
        organization_name: 'Luxury Hotel Chain',
        rfid_scans: 15200,
        bottles_tracked: 850,
        storage_used_mb: 156.3,
        active_users: 12,
        api_requests: 28400,
        avg_response_time: 85,
        error_rate: 0.1,
        monthly_revenue: 899
      }
    ]

    const mockSystemMetrics: SystemMetrics = {
      total_users: 18,
      total_organizations: 3,
      total_scans_today: 543,
      total_scans_month: 17600,
      avg_response_time: 92,
      error_rate: 0.15,
      uptime_percentage: 99.8,
      storage_used_gb: 0.2,
      storage_limit_gb: 100
    }

    setTimeout(() => {
      setUsageMetrics(mockUsageMetrics)
      setSystemMetrics(mockSystemMetrics)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  const filteredMetrics = selectedOrg === 'all'
    ? usageMetrics
    : usageMetrics.filter(m => m.organization_id === selectedOrg)

  const getTotalRevenue = () => {
    return usageMetrics.reduce((sum, metric) => sum + metric.monthly_revenue, 0)
  }

  const getAverageMetric = (field: keyof UsageMetrics) => {
    if (usageMetrics.length === 0) return 0
    const total = usageMetrics.reduce((sum, metric) => sum + (metric[field] as number), 0)
    return Math.round(total / usageMetrics.length)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const exportReport = () => {
    // Implement export functionality
    console.log('Exporting analytics report...')
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <p className="text-muted-foreground">Monitor system performance and tenant usage</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {usageMetrics.map(metric => (
                <SelectItem key={metric.organization_id} value={metric.organization_id}>
                  {metric.organization_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* System Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.total_organizations}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +2 this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.total_users}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +5 this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Scans</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.total_scans_month.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +12% vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${getTotalRevenue().toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  +8% vs last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Uptime</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    {systemMetrics?.uptime_percentage}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="text-sm font-medium">{systemMetrics?.avg_response_time}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm font-medium">{systemMetrics?.error_rate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Used</span>
                    <span className="text-sm font-medium">
                      {systemMetrics?.storage_used_gb} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${((systemMetrics?.storage_used_gb || 0) / (systemMetrics?.storage_limit_gb || 100)) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>0 GB</span>
                    <span>{systemMetrics?.storage_limit_gb} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">RFID Scans</span>
                  <span className="text-lg font-bold">{systemMetrics?.total_scans_today}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Requests</span>
                  <span className="text-lg font-bold">12.4K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Users</span>
                  <span className="text-lg font-bold">3</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Per-Tenant Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMetrics.map((metric) => (
                  <Card key={metric.organization_id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{metric.organization_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{metric.rfid_scans.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">RFID Scans</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{metric.bottles_tracked}</div>
                          <div className="text-sm text-muted-foreground">Bottles Tracked</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{metric.active_users}</div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-400">{formatBytes(metric.storage_used_mb * 1024 * 1024)}</div>
                          <div className="text-sm text-muted-foreground">Storage Used</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    Response time chart would show:
                    <br />• Average response times over time
                    <br />• P95 and P99 latency metrics
                    <br />• Response time breakdown by endpoint
                    <br />• Geographic performance differences
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Error Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <LineChart className="h-4 w-4" />
                  <AlertDescription>
                    Error rate monitoring would include:
                    <br />• HTTP error status code breakdown
                    <br />• Error trends over time
                    <br />• Error rate by organization
                    <br />• Critical error alerting
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  API Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    API usage analytics would show:
                    <br />• Requests per minute/hour/day
                    <br />• Most popular endpoints
                    <br />• Rate limiting events
                    <br />• API key usage patterns
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <PieChart className="h-4 w-4" />
                  <AlertDescription>
                    Resource monitoring would track:
                    <br />• CPU and memory usage
                    <br />• Database query performance
                    <br />• Storage I/O metrics
                    <br />• Network bandwidth usage
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Recurring Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${getTotalRevenue().toLocaleString()}</div>
                      <div className="text-sm text-green-400">+8% vs last month</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Average Revenue Per User</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${Math.round(getTotalRevenue() / (systemMetrics?.total_users || 1))}
                      </div>
                      <div className="text-sm text-blue-400">Per active user</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Usage-Based Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$450</div>
                      <div className="text-sm text-orange-400">Overage charges</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Organization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usageMetrics.map((metric) => (
                        <div key={metric.organization_id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{metric.organization_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {metric.active_users} users • {metric.rfid_scans.toLocaleString()} scans
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${metric.monthly_revenue}</div>
                            <div className="text-sm text-muted-foreground">per month</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}