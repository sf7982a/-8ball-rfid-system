import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { BrandVarianceResult, analyzeBrandVariance } from '../../lib/analysis/variance-detection'
import { supabase } from '../../lib/supabase'
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  Eye,
  X,
  Bell,
  Clock
} from 'lucide-react'

interface BrandAlert {
  id: string
  brand: string
  product?: string
  riskScore: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectionTypes: Record<string, number>
  estimatedLossValue: number
  trendIndicator: 'increasing' | 'stable' | 'decreasing'
  affectedBottles: number
  totalBottles: number
  lastDetection: string
  alertType: 'high_risk' | 'increasing_trend' | 'high_loss_value' | 'new_brand_variance'
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved'
  createdAt: string
}

interface BrandTheftAlertsProps {
  organizationId: string
  className?: string
}

export function BrandTheftAlerts({ organizationId, className }: BrandTheftAlertsProps) {
  const [brandAlerts, setBrandAlerts] = useState<BrandAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<BrandAlert | null>(null)
  const [investigationNotes, setInvestigationNotes] = useState('')

  useEffect(() => {
    loadBrandAlerts()
  }, [organizationId])

  const loadBrandAlerts = async () => {
    try {
      setLoading(true)

      // Use mock data for demonstration purposes
      const mockAlerts: BrandAlert[] = [
        {
          id: 'alert-1',
          brand: 'Grey Goose',
          product: 'Original Vodka',
          riskScore: 87,
          severity: 'critical',
          detectionTypes: { 'theft_suspected': 5, 'missing': 2, 'consumption_anomaly': 1 },
          estimatedLossValue: 2400,
          trendIndicator: 'increasing',
          affectedBottles: 8,
          totalBottles: 24,
          lastDetection: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'high_risk',
          status: 'active',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert-2',
          brand: 'Hennessy',
          product: 'VS Cognac',
          riskScore: 79,
          severity: 'high',
          detectionTypes: { 'theft_suspected': 4, 'missing': 2 },
          estimatedLossValue: 1840,
          trendIndicator: 'increasing',
          affectedBottles: 6,
          totalBottles: 18,
          lastDetection: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'increasing_trend',
          status: 'active',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert-3',
          brand: 'Macallan',
          product: '12 Year Single Malt',
          riskScore: 73,
          severity: 'high',
          detectionTypes: { 'theft_suspected': 3, 'consumption_anomaly': 1 },
          estimatedLossValue: 1360,
          trendIndicator: 'stable',
          affectedBottles: 4,
          totalBottles: 12,
          lastDetection: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'high_loss_value',
          status: 'active',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert-4',
          brand: 'Don Julio',
          product: '1942 Tequila',
          riskScore: 65,
          severity: 'medium',
          detectionTypes: { 'theft_suspected': 2, 'missing': 1 },
          estimatedLossValue: 840,
          trendIndicator: 'decreasing',
          affectedBottles: 3,
          totalBottles: 8,
          lastDetection: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'new_brand_variance',
          status: 'active',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'alert-5',
          brand: 'Patron',
          product: 'Silver Tequila',
          riskScore: 58,
          severity: 'medium',
          detectionTypes: { 'missing': 3, 'reconciliation_needed': 2 },
          estimatedLossValue: 650,
          trendIndicator: 'stable',
          affectedBottles: 5,
          totalBottles: 20,
          lastDetection: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'new_brand_variance',
          status: 'active',
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        }
      ]

      setBrandAlerts(mockAlerts)
    } catch (error) {
      console.error('Error loading brand alerts:', error)
      toast.error('Failed to load brand theft alerts')
    } finally {
      setLoading(false)
    }
  }

  const createBrandAlert = (brand: BrandVarianceResult, alertType: BrandAlert['alertType']): BrandAlert => {
    const severity = brand.riskScore >= 85 ? 'critical' :
                    brand.riskScore >= 70 ? 'high' :
                    brand.riskScore >= 50 ? 'medium' : 'low'

    return {
      id: `${brand.brand}-${alertType}-${Date.now()}`,
      brand: brand.brand,
      product: brand.product,
      riskScore: brand.riskScore,
      severity,
      detectionTypes: brand.detectionTypes,
      estimatedLossValue: brand.estimatedLossValue,
      trendIndicator: brand.trendIndicator,
      affectedBottles: brand.bottlesWithVariance,
      totalBottles: brand.totalBottles,
      lastDetection: brand.lastDetectionDate,
      alertType,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  }

  const getAlertTypeInfo = (alertType: string) => {
    switch (alertType) {
      case 'high_risk':
        return {
          label: 'High Risk Brand',
          description: 'Brand showing consistently high variance patterns',
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-red-500'
        }
      case 'increasing_trend':
        return {
          label: 'Increasing Theft Trend',
          description: 'Brand variance incidents are trending upward',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-orange-500'
        }
      case 'high_loss_value':
        return {
          label: 'High Financial Impact',
          description: 'Brand showing significant monetary losses',
          icon: <DollarSign className="h-4 w-4" />,
          color: 'text-red-600'
        }
      case 'new_brand_variance':
        return {
          label: 'New Variance Pattern',
          description: 'New variance detected for this brand',
          icon: <Bell className="h-4 w-4" />,
          color: 'text-blue-500'
        }
      default:
        return {
          label: 'Brand Alert',
          description: 'Brand requires attention',
          icon: <Shield className="h-4 w-4" />,
          color: 'text-gray-500'
        }
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'stable': return <Minus className="h-4 w-4 text-blue-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    setBrandAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'acknowledged' }
          : alert
      )
    )
    toast.success('Alert acknowledged')
  }

  const handleStartInvestigation = async (alert: BrandAlert) => {
    setBrandAlerts(prev =>
      prev.map(a =>
        a.id === alert.id
          ? { ...a, status: 'investigating' }
          : a
      )
    )
    setSelectedAlert(alert)
    toast.success('Investigation started')
  }

  const handleResolveAlert = async () => {
    if (!selectedAlert) return

    try {
      // In a real app, you'd save the investigation notes to the database
      setBrandAlerts(prev =>
        prev.map(alert =>
          alert.id === selectedAlert.id
            ? { ...alert, status: 'resolved' }
            : alert
        )
      )

      setSelectedAlert(null)
      setInvestigationNotes('')
      toast.success('Alert resolved successfully')
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Brand Theft Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeAlerts = brandAlerts.filter(alert => alert.status === 'active')
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Loss Value</p>
                <p className="text-2xl font-bold">${activeAlerts.reduce((sum, alert) => sum + alert.estimatedLossValue, 0).toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Brand Theft Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-600">All Clear!</h3>
              <p className="text-muted-foreground">No active brand theft alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const alertInfo = getAlertTypeInfo(alert.alertType)

                return (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={alertInfo.color}>
                            {alertInfo.icon}
                          </div>
                          <h4 className="font-semibold">{alert.brand}</h4>
                          {alert.product && (
                            <span className="text-sm text-muted-foreground">({alert.product})</span>
                          )}
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(alert.trendIndicator)}
                            <span className="text-sm text-muted-foreground">{alert.trendIndicator}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {alertInfo.label}: {alertInfo.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Risk Score:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-medium">{alert.riskScore.toFixed(0)}</span>
                              <Progress value={alert.riskScore} className="w-16 h-2" />
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Affected Bottles:</span>
                            <p className="font-medium">{alert.affectedBottles}/{alert.totalBottles}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estimated Loss:</span>
                            <p className="font-medium text-red-600">${alert.estimatedLossValue.toFixed(0)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Detection:</span>
                            <p className="font-medium">{new Date(alert.lastDetection).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {Object.entries(alert.detectionTypes).map(([type, count]) => (
                            <span
                              key={type}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium"
                            >
                              {type.replace('_', ' ')}: {count}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => handleStartInvestigation(alert)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Investigate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Investigate Brand Alert: {alert.brand}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-muted-foreground">Alert Type</Label>
                                  <p className="font-medium">{getAlertTypeInfo(alert.alertType).label}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Risk Score</Label>
                                  <p className="font-medium">{alert.riskScore.toFixed(0)}/100</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Estimated Loss</Label>
                                  <p className="font-medium text-red-600">${alert.estimatedLossValue.toFixed(0)}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Trend</Label>
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(alert.trendIndicator)}
                                    <span className="font-medium">{alert.trendIndicator}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-muted-foreground">Detection Types</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {Object.entries(alert.detectionTypes).map(([type, count]) => (
                                    <Badge key={type} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {type.replace('_', ' ')}: {count}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="investigation-notes">Investigation Notes</Label>
                                <Textarea
                                  id="investigation-notes"
                                  placeholder="Document your investigation findings, actions taken, and resolution details..."
                                  value={investigationNotes}
                                  onChange={(e) => setInvestigationNotes(e.target.value)}
                                  className="mt-1"
                                  rows={4}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">
                                    Cancel
                                  </Button>
                                </DialogTrigger>
                                <Button onClick={handleResolveAlert}>
                                  Mark as Resolved
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}