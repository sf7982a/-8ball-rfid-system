import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { getVarianceDetections } from '../../lib/analysis/variance-detection'
import { supabase } from '../../lib/supabase'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  AlertCircle,
  Shield,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

interface VarianceAlert {
  id: string
  bottle: {
    brand: string
    product: string
    rfidTag: string
  }
  location: {
    name: string
    code: string
  }
  detectionType: 'missing' | 'surplus' | 'consumption_anomaly' | 'theft_suspected' | 'reconciliation_needed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: string
  expectedQuantity: number
  actualQuantity: number
  varianceAmount: number
  posSalesCount: number
  rfidScanCount: number
  confidenceScore: number
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'ignored'
  notes?: string
}

interface VarianceAlertsProps {
  organizationId: string
  className?: string
}

export function VarianceAlerts({ organizationId, className }: VarianceAlertsProps) {
  const [alerts, setAlerts] = useState<VarianceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'critical'>('open')
  const [selectedAlert, setSelectedAlert] = useState<VarianceAlert | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  // Load alerts
  useEffect(() => {
    loadAlerts()

    // Set up real-time subscription for new alerts
    const subscription = supabase
      .channel('variance_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'variance_detections',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          loadAlerts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [organizationId, filter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const filters = filter === 'all' ? {} : filter === 'critical'
        ? { severity: 'critical' as const }
        : { status: 'open' as const }

      const data = await getVarianceDetections(organizationId, filters)

      // Transform data to match our interface
      const transformedAlerts: VarianceAlert[] = data.map(item => ({
        id: item.id,
        bottle: {
          brand: item.bottles?.brand || 'Unknown',
          product: item.bottles?.product || 'Unknown',
          rfidTag: item.bottles?.rfid_tag || 'Unknown'
        },
        location: {
          name: item.locations?.name || 'Unknown',
          code: item.locations?.code || 'Unknown'
        },
        detectionType: item.detection_type,
        severity: item.severity,
        detectedAt: item.detected_at,
        expectedQuantity: parseFloat(item.expected_quantity) || 0,
        actualQuantity: parseFloat(item.actual_quantity) || 0,
        varianceAmount: parseFloat(item.variance_amount) || 0,
        posSalesCount: item.pos_sales_count || 0,
        rfidScanCount: item.rfid_scan_count || 0,
        confidenceScore: parseFloat(item.confidence_score) || 0,
        status: item.status,
        notes: item.notes
      }))

      setAlerts(transformedAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
      toast.error('Failed to load variance alerts')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getDetectionTypeIcon = (type: string) => {
    switch (type) {
      case 'theft_suspected': return <Shield className="h-4 w-4 text-red-400" />
      case 'missing': return <TrendingDown className="h-4 w-4 text-orange-400" />
      case 'surplus': return <TrendingUp className="h-4 w-4 text-green-400" />
      case 'consumption_anomaly': return <AlertCircle className="h-4 w-4 text-purple-400" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'investigating': return <Eye className="h-4 w-4 text-blue-400" />
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-400" />
      case 'ignored': return <X className="h-4 w-4 text-gray-400" />
      default: return <Clock className="h-4 w-4 text-yellow-400" />
    }
  }

  const resolveAlert = async (alertId: string, resolution: string, notes?: string) => {
    try {
      setIsResolving(true)

      const { error } = await supabase
        .from('variance_detections')
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', alertId)

      if (error) throw error

      toast.success('Alert resolved successfully')
      setSelectedAlert(null)
      loadAlerts()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to resolve alert')
    } finally {
      setIsResolving(false)
    }
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'open')
  const openAlerts = alerts.filter(alert => alert.status === 'open')

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-32`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                <CardTitle className="text-lg text-red-300">
                  Critical Alerts Detected
                </CardTitle>
              </div>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                {criticalAlerts.length} critical
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-red-500/5 rounded border border-red-500/20">
                  <div className="flex items-center gap-3">
                    {getDetectionTypeIconAtBottom(alert.detectionType)}
                    <div>
                      <p className="font-medium text-red-300">
                        {alert.bottle.brand} {alert.bottle.product}
                      </p>
                      <p className="text-sm text-red-400">
                        {alert.location.name} • {alert.detectionType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Investigate
                      </Button>
                    </DialogTrigger>
                    <AlertDetailDialog
                      alert={selectedAlert}
                      onResolve={resolveAlert}
                      isResolving={isResolving}
                    />
                  </Dialog>
                </div>
              ))}
              {criticalAlerts.length > 3 && (
                <p className="text-sm text-red-400 text-center">
                  +{criticalAlerts.length - 3} more critical alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Summary and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Variance Detection Alerts
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-300 border-yellow-500/30">
                {openAlerts.length} open
              </Badge>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="open">Open Only</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm">All variance detections are within normal parameters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getDetectionTypeIconAtBottom(alert.detectionType)}
                      {getStatusIcon(alert.status)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {alert.bottle.brand} {alert.bottle.product}
                        </span>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{alert.location.name}</span>
                        {' • '}
                        <span>{alert.detectionType.replace('_', ' ')}</span>
                        {' • '}
                        <span>Variance: {alert.varianceAmount.toFixed(2)} units</span>
                        {' • '}
                        <span>Confidence: {(alert.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.detectedAt).toLocaleDateString()}
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Details
                        </Button>
                      </DialogTrigger>
                      <AlertDetailDialog
                        alert={selectedAlert}
                        onResolve={resolveAlert}
                        isResolving={isResolving}
                      />
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Alert Detail Dialog Component
interface AlertDetailDialogProps {
  alert: VarianceAlert | null
  onResolve: (alertId: string, resolution: string, notes?: string) => Promise<void>
  isResolving: boolean
}

function AlertDetailDialog({ alert, onResolve, isResolving }: AlertDetailDialogProps) {
  const [resolution, setResolution] = useState('')
  const [notes, setNotes] = useState('')

  if (!alert) return null

  const handleResolve = async () => {
    if (!resolution) return
    await onResolve(alert.id, resolution, notes)
    setResolution('')
    setNotes('')
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {getDetectionTypeIconAtBottom(alert.detectionType)}
          Variance Alert Details
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Alert Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Bottle</Label>
            <p className="font-medium">{alert.bottle.brand} {alert.bottle.product}</p>
            <p className="text-sm text-muted-foreground">RFID: {alert.bottle.rfidTag}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Location</Label>
            <p className="font-medium">{alert.location.name}</p>
            <p className="text-sm text-muted-foreground">Code: {alert.location.code}</p>
          </div>
        </div>

        {/* Detection Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Detection Type</Label>
            <div className="flex items-center gap-2">
              {getDetectionTypeIconAtBottom(alert.detectionType)}
              <span className="capitalize">{alert.detectionType.replace('_', ' ')}</span>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Severity</Label>
            <Badge className={getSeverityColor(alert.severity)}>
              {alert.severity}
            </Badge>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Confidence Score</Label>
            <p className="font-medium">{(alert.confidenceScore * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Quantity Analysis */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Expected Quantity</Label>
            <p className="text-lg font-bold">{alert.expectedQuantity.toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Actual Quantity</Label>
            <p className="text-lg font-bold">{alert.actualQuantity.toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Variance</Label>
            <p className={`text-lg font-bold ${alert.varianceAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {alert.varianceAmount > 0 ? '+' : ''}{alert.varianceAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Data Sources */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">POS Sales Count</Label>
            <p className="font-medium">{alert.posSalesCount} transactions</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">RFID Scan Count</Label>
            <p className="font-medium">{alert.rfidScanCount} scans</p>
          </div>
        </div>

        {/* Current Notes */}
        {alert.notes && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Current Notes</Label>
            <p className="text-sm bg-muted p-2 rounded">{alert.notes}</p>
          </div>
        )}

        {/* Resolution Actions */}
        {alert.status === 'open' && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label htmlFor="resolution">Resolution Action</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigating">Mark as Investigating</SelectItem>
                  <SelectItem value="resolved">Mark as Resolved</SelectItem>
                  <SelectItem value="false_positive">Mark as False Positive</SelectItem>
                  <SelectItem value="ignored">Ignore This Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Resolution Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleResolve}
                disabled={!resolution || isResolving}
                className="min-w-[100px]"
              >
                {isResolving ? 'Resolving...' : 'Resolve Alert'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  )
}

function getDetectionTypeIconAtBottom(type: string) {
  switch (type) {
    case 'theft_suspected': return <Shield className="h-4 w-4 text-red-400" />
    case 'missing': return <TrendingDown className="h-4 w-4 text-orange-400" />
    case 'surplus': return <TrendingUp className="h-4 w-4 text-green-400" />
    case 'consumption_anomaly': return <AlertCircle className="h-4 w-4 text-purple-400" />
    default: return <AlertTriangle className="h-4 w-4 text-yellow-400" />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}