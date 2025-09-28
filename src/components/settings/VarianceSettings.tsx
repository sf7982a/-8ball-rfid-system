import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { HelpTooltip } from '../ui/help-tooltip'
import { toast } from 'sonner'
import { VarianceDetectionConfig, VarianceDetectionEngine } from '../../lib/analysis/variance-detection'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Settings,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Shield,
  BarChart3,
  RefreshCw,
  Save,
  RotateCcw
} from 'lucide-react'

interface VarianceSettingsProps {
  className?: string
}

export function VarianceSettings({ className }: VarianceSettingsProps) {
  const { organization } = useAuth()
  const [config, setConfig] = useState<VarianceDetectionConfig>(VarianceDetectionEngine.getDefaultConfig())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Load current settings
  useEffect(() => {
    loadSettings()
  }, [organization?.id])

  const loadSettings = async () => {
    if (!organization?.id) return

    try {
      setLoading(true)

      // Check if settings exist in organization settings
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      if (error) throw error

      const varianceConfig = orgData?.settings?.varianceDetection
      if (varianceConfig) {
        setConfig(varianceConfig)
      } else {
        // Use default config if none exists
        setConfig(VarianceDetectionEngine.getDefaultConfig())
      }
    } catch (error) {
      console.error('Error loading variance settings:', error)
      toast.error('Failed to load variance detection settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!organization?.id) return

    try {
      setSaving(true)

      // Get current organization settings
      const { data: orgData, error: fetchError } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organization.id)
        .single()

      if (fetchError) throw fetchError

      // Update settings with variance detection config
      const updatedSettings = {
        ...orgData.settings,
        varianceDetection: config
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', organization.id)

      if (updateError) throw updateError

      setIsDirty(false)
      toast.success('Variance detection settings saved successfully')
    } catch (error) {
      console.error('Error saving variance settings:', error)
      toast.error('Failed to save variance detection settings')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setConfig(VarianceDetectionEngine.getDefaultConfig())
    setIsDirty(true)
    toast.info('Settings reset to defaults')
  }

  const updateConfig = (updates: Partial<VarianceDetectionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const getSeverityColor = (threshold: number) => {
    if (threshold >= 0.5) return 'bg-red-500/20 text-red-300'
    if (threshold >= 0.3) return 'bg-orange-500/20 text-orange-300'
    if (threshold >= 0.2) return 'bg-yellow-500/20 text-yellow-300'
    return 'bg-blue-500/20 text-blue-300'
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Variance Detection Settings
          </h2>
          <p className="text-muted-foreground">
            Configure thresholds and sensitivity for theft detection and variance analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Badge variant="outline" className="text-yellow-300 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Detection Thresholds
              </CardTitle>
              <HelpTooltip
                title="Detection Thresholds"
                description="Set the variance percentage that triggers different alert severity levels. These thresholds determine when the system flags potential theft or inventory issues."
                whatToLookFor="Start conservative (higher thresholds) and adjust down based on your operation. Too low = false alarms, too high = missed theft."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Set variance percentage thresholds for different severity levels
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Low Threshold</Label>
                  <Badge className={getSeverityColor(config.lowThreshold)}>
                    {(config.lowThreshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[config.lowThreshold * 100]}
                  onValueChange={(value) => updateConfig({ lowThreshold: value[0] / 100 })}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minor variances that may require attention
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Medium Threshold</Label>
                  <Badge className={getSeverityColor(config.mediumThreshold)}>
                    {(config.mediumThreshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[config.mediumThreshold * 100]}
                  onValueChange={(value) => updateConfig({ mediumThreshold: value[0] / 100 })}
                  max={50}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Moderate variances requiring investigation
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>High Threshold</Label>
                  <Badge className={getSeverityColor(config.highThreshold)}>
                    {(config.highThreshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[config.highThreshold * 100]}
                  onValueChange={(value) => updateConfig({ highThreshold: value[0] / 100 })}
                  max={50}
                  min={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Significant variances requiring immediate action
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Critical Threshold</Label>
                  <Badge className={getSeverityColor(config.criticalThreshold)}>
                    {(config.criticalThreshold * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[config.criticalThreshold * 100]}
                  onValueChange={(value) => updateConfig({ criticalThreshold: value[0] / 100 })}
                  max={100}
                  min={20}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Critical variances indicating potential theft
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Analysis Parameters
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure time windows and data requirements for analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="analysis-window">Analysis Window (hours)</Label>
              <Input
                id="analysis-window"
                type="number"
                value={config.analysisWindowHours}
                onChange={(e) => updateConfig({ analysisWindowHours: parseInt(e.target.value) || 24 })}
                min={1}
                max={168}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How far back to look for data (1-168 hours)
              </p>
            </div>

            <div>
              <Label htmlFor="min-sales">Minimum Sales for Analysis</Label>
              <Input
                id="min-sales"
                type="number"
                value={config.minimumSalesForAnalysis}
                onChange={(e) => updateConfig({ minimumSalesForAnalysis: parseInt(e.target.value) || 1 })}
                min={0}
                max={100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum POS sales required to trigger analysis
              </p>
            </div>

            <div className="border-t pt-4"></div>

            <div className="space-y-3">
              <Label>Data Source Weights</Label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">POS Sales Weight</span>
                  <span className="text-sm font-medium">{(config.posSalesWeight * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.posSalesWeight * 100]}
                  onValueChange={(value) => updateConfig({ posSalesWeight: value[0] / 100 })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">RFID Scan Weight</span>
                  <span className="text-sm font-medium">{(config.rfidScanWeight * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.rfidScanWeight * 100]}
                  onValueChange={(value) => updateConfig({ rfidScanWeight: value[0] / 100 })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Historical Pattern Weight</span>
                  <span className="text-sm font-medium">{(config.historicalPatternWeight * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.historicalPatternWeight * 100]}
                  onValueChange={(value) => updateConfig({ historicalPatternWeight: value[0] / 100 })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Detection
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure advanced detection features and sensitivity
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anomaly-detection"
                checked={config.enableAnomalyDetection}
                onCheckedChange={(checked) => updateConfig({ enableAnomalyDetection: !!checked })}
              />
              <Label htmlFor="anomaly-detection" className="text-sm">
                Enable Anomaly Detection
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use machine learning to detect unusual consumption patterns
            </p>

            {config.enableAnomalyDetection && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Anomaly Detection Sensitivity</Label>
                  <Badge variant="outline">
                    {config.anomalyDetectionSensitivity === 0.5 ? 'Moderate' :
                     config.anomalyDetectionSensitivity > 0.5 ? 'High' : 'Low'}
                  </Badge>
                </div>
                <Slider
                  value={[config.anomalyDetectionSensitivity * 100]}
                  onValueChange={(value) => updateConfig({ anomalyDetectionSensitivity: value[0] / 100 })}
                  max={100}
                  min={10}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher sensitivity detects more anomalies but may increase false positives
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              System Performance
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current system status and performance metrics
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Detection Accuracy</div>
                <div className="text-2xl font-bold text-green-400">94.8%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">False Positive Rate</div>
                <div className="text-2xl font-bold text-blue-400">5.2%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-2xl font-bold text-orange-400">2.3s</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open Alerts</div>
                <div className="text-2xl font-bold text-red-400">12</div>
              </div>
            </div>

            <div className="border-t pt-4"></div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>System Health</span>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Last Calibration</span>
                <span className="text-muted-foreground">2 days ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Data Coverage</span>
                <span className="text-muted-foreground">96.4%</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Calibrate Detection Engine
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Low Alert</div>
              <div className="text-xl font-bold text-blue-400">
                {(config.lowThreshold * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Medium Alert</div>
              <div className="text-xl font-bold text-yellow-400">
                {(config.mediumThreshold * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">High Alert</div>
              <div className="text-xl font-bold text-orange-400">
                {(config.highThreshold * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Critical Alert</div>
              <div className="text-xl font-bold text-red-400">
                {(config.criticalThreshold * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Current Configuration:</strong> Analysis window of {config.analysisWindowHours} hours,
              minimum {config.minimumSalesForAnalysis} sale(s) required,
              {config.enableAnomalyDetection ? ' anomaly detection enabled' : ' anomaly detection disabled'}.
              Data weights: POS {(config.posSalesWeight * 100).toFixed(0)}%,
              RFID {(config.rfidScanWeight * 100).toFixed(0)}%,
              Historical {(config.historicalPatternWeight * 100).toFixed(0)}%.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}