import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  Zap,
  Clock,
  FileText,
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  Server,
  Key,
  Bell,
  Calendar
} from 'lucide-react'

interface SystemConfig {
  general: {
    system_name: string
    company_name: string
    support_email: string
    maintenance_mode: boolean
    registration_enabled: boolean
    max_organizations: number
    session_timeout_minutes: number
  }
  features: {
    rfid_scanning: boolean
    pos_integrations: boolean
    theft_detection: boolean
    analytics_dashboard: boolean
    bulk_operations: boolean
    api_access: boolean
    custom_branding: boolean
    advanced_reports: boolean
  }
  integrations: {
    email_provider: string
    email_api_key: string
    sms_provider: string
    sms_api_key: string
    backup_provider: string
    backup_schedule: string
    monitoring_webhook: string
  }
  security: {
    password_min_length: number
    password_require_special: boolean
    session_timeout: number
    max_login_attempts: number
    two_factor_required: boolean
    ip_whitelist_enabled: boolean
    audit_log_retention_days: number
  }
  billing: {
    stripe_public_key: string
    stripe_secret_key: string
    webhook_endpoint: string
    trial_duration_days: number
    grace_period_days: number
    usage_tracking_enabled: boolean
  }
}

export function AdminConfigPanel() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockConfig: SystemConfig = {
      general: {
        system_name: '8Ball RFID Management Platform',
        company_name: '8Ball Technologies',
        support_email: 'support@8ball-rfid.com',
        maintenance_mode: false,
        registration_enabled: true,
        max_organizations: 100,
        session_timeout_minutes: 60
      },
      features: {
        rfid_scanning: true,
        pos_integrations: true,
        theft_detection: true,
        analytics_dashboard: true,
        bulk_operations: true,
        api_access: true,
        custom_branding: false,
        advanced_reports: true
      },
      integrations: {
        email_provider: 'sendgrid',
        email_api_key: '',
        sms_provider: 'twilio',
        sms_api_key: '',
        backup_provider: 's3',
        backup_schedule: 'daily',
        monitoring_webhook: ''
      },
      security: {
        password_min_length: 8,
        password_require_special: true,
        session_timeout: 3600,
        max_login_attempts: 5,
        two_factor_required: false,
        ip_whitelist_enabled: false,
        audit_log_retention_days: 90
      },
      billing: {
        stripe_public_key: '',
        stripe_secret_key: '',
        webhook_endpoint: '',
        trial_duration_days: 14,
        grace_period_days: 7,
        usage_tracking_enabled: true
      }
    }

    setTimeout(() => {
      setConfig(mockConfig)
      setLoading(false)
    }, 1000)
  }, [])

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    if (!config) return

    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }))
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      // Implement API call to save configuration
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLastSaved(new Date())
      console.log('Configuration saved:', config)
    } catch (error) {
      console.error('Failed to save configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const testEmailIntegration = async () => {
    console.log('Testing email integration...')
    // Implement email test functionality
  }

  const runMaintenanceTask = async (task: string) => {
    console.log(`Running maintenance task: ${task}`)
    // Implement maintenance tasks
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Manage global system settings and integrations</p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="system_name">System Name</Label>
                  <Input
                    id="system_name"
                    value={config.general.system_name}
                    onChange={(e) => updateConfig('general', 'system_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={config.general.company_name}
                    onChange={(e) => updateConfig('general', 'company_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={config.general.support_email}
                    onChange={(e) => updateConfig('general', 'support_email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={config.general.session_timeout_minutes}
                    onChange={(e) => updateConfig('general', 'session_timeout_minutes', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="max_organizations">Max Organizations</Label>
                  <Input
                    id="max_organizations"
                    type="number"
                    value={config.general.max_organizations}
                    onChange={(e) => updateConfig('general', 'max_organizations', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable user access for system maintenance</p>
                  </div>
                  <Switch
                    id="maintenance_mode"
                    checked={config.general.maintenance_mode}
                    onCheckedChange={(checked) => updateConfig('general', 'maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registration_enabled">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                  </div>
                  <Switch
                    id="registration_enabled"
                    checked={config.general.registration_enabled}
                    onCheckedChange={(checked) => updateConfig('general', 'registration_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(config.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">
                        {getFeatureDescription(key)}
                      </p>
                    </div>
                    <Switch
                      id={key}
                      checked={enabled}
                      onCheckedChange={(checked) => updateConfig('features', key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email_provider">Email Provider</Label>
                    <Select
                      value={config.integrations.email_provider}
                      onValueChange={(value) => updateConfig('integrations', 'email_provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="postmark">Postmark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="email_api_key">API Key</Label>
                    <Input
                      id="email_api_key"
                      type="password"
                      placeholder="Enter API key..."
                      value={config.integrations.email_api_key}
                      onChange={(e) => updateConfig('integrations', 'email_api_key', e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={testEmailIntegration} variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Test Email Integration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backup_provider">Backup Provider</Label>
                    <Select
                      value={config.integrations.backup_provider}
                      onValueChange={(value) => updateConfig('integrations', 'backup_provider', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="s3">Amazon S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        <SelectItem value="azure">Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backup_schedule">Backup Schedule</Label>
                    <Select
                      value={config.integrations.backup_schedule}
                      onValueChange={(value) => updateConfig('integrations', 'backup_schedule', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={config.security.password_min_length}
                    onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={config.security.max_login_attempts}
                    onChange={(e) => updateConfig('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="audit_retention">Audit Log Retention (days)</Label>
                  <Input
                    id="audit_retention"
                    type="number"
                    value={config.security.audit_log_retention_days}
                    onChange={(e) => updateConfig('security', 'audit_log_retention_days', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                  </div>
                  <Switch
                    checked={config.security.password_require_special}
                    onCheckedChange={(checked) => updateConfig('security', 'password_require_special', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication Required</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={config.security.two_factor_required}
                    onCheckedChange={(checked) => updateConfig('security', 'two_factor_required', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Restrict access to allowed IP addresses</p>
                  </div>
                  <Switch
                    checked={config.security.ip_whitelist_enabled}
                    onCheckedChange={(checked) => updateConfig('security', 'ip_whitelist_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Billing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Billing configuration manages payment processing and subscription management.
                  Changes to these settings may affect billing operations.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_duration">Trial Duration (days)</Label>
                  <Input
                    id="trial_duration"
                    type="number"
                    value={config.billing.trial_duration_days}
                    onChange={(e) => updateConfig('billing', 'trial_duration_days', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="grace_period">Grace Period (days)</Label>
                  <Input
                    id="grace_period"
                    type="number"
                    value={config.billing.grace_period_days}
                    onChange={(e) => updateConfig('billing', 'grace_period_days', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Usage Tracking</Label>
                  <p className="text-sm text-muted-foreground">Track usage metrics for billing purposes</p>
                </div>
                <Switch
                  checked={config.billing.usage_tracking_enabled}
                  onCheckedChange={(checked) => updateConfig('billing', 'usage_tracking_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => runMaintenanceTask('clear_cache')} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Clear Cache
                  </Button>
                  <Button onClick={() => runMaintenanceTask('cleanup_logs')} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Cleanup Logs
                  </Button>
                  <Button onClick={() => runMaintenanceTask('optimize_db')} variant="outline">
                    <Database className="mr-2 h-4 w-4" />
                    Optimize Database
                  </Button>
                  <Button onClick={() => runMaintenanceTask('backup_now')} variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Run Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Database Connection</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cache Service</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Email Service</span>
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Degraded</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Background Jobs</span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    rfid_scanning: 'Enable RFID scanning capabilities',
    pos_integrations: 'Allow POS system integrations',
    theft_detection: 'Enable theft detection and variance monitoring',
    analytics_dashboard: 'Provide analytics and reporting dashboards',
    bulk_operations: 'Allow bulk operations on inventory',
    api_access: 'Enable REST API access for integrations',
    custom_branding: 'Allow organizations to customize branding',
    advanced_reports: 'Enable advanced reporting features'
  }
  return descriptions[key] || 'Feature configuration option'
}