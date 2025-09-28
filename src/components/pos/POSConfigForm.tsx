import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import {
  Plus,
  Settings,
  TestTube,
  Key,
  Wifi,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

interface POSConfigFormProps {
  className?: string
}

export function POSConfigForm({ className }: POSConfigFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    locationId: '',
    credentials: {
      apiKey: '',
      clientId: '',
      clientSecret: '',
      webhookUrl: '',
      additionalConfig: '{}'
    },
    syncFrequency: 15,
    enableWebhooks: false,
    enableMenuSync: true,
    testMode: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const providers = [
    { value: 'toast', label: 'Toast POS', icon: '🍞' },
    { value: 'square', label: 'Square POS', icon: '⬜' },
    { value: 'clover', label: 'Clover POS', icon: '🍀' },
    { value: 'lightspeed', label: 'Lightspeed POS', icon: '⚡' },
    { value: 'revel', label: 'Revel POS', icon: '🎉' },
    { value: 'touchbistro', label: 'TouchBistro', icon: '🍽️' },
    { value: 'other', label: 'Other/Custom', icon: '⚙️' }
  ]

  const syncFrequencies = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 240, label: '4 hours' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.provider) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success('POS integration configured successfully')

      // Reset form
      setFormData({
        name: '',
        provider: '',
        locationId: '',
        credentials: {
          apiKey: '',
          clientId: '',
          clientSecret: '',
          webhookUrl: '',
          additionalConfig: '{}'
        },
        syncFrequency: 15,
        enableWebhooks: false,
        enableMenuSync: true,
        testMode: false
      })
    } catch (error) {
      toast.error('Failed to configure POS integration')
    } finally {
      setIsSubmitting(false)
    }
  }

  const testConnection = async () => {
    if (!formData.provider || !formData.credentials.apiKey) {
      toast.error('Please select a provider and enter API credentials')
      return
    }

    setTestingConnection(true)
    setConnectionStatus('idle')

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Simulate random success/failure for demo
      const success = Math.random() > 0.3

      if (success) {
        setConnectionStatus('success')
        toast.success('Connection test successful!')
      } else {
        setConnectionStatus('error')
        toast.error('Connection test failed. Please check your credentials.')
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error('Connection test failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const getProviderConfig = (provider: string) => {
    switch (provider) {
      case 'toast':
        return {
          apiKeyLabel: 'Management API Token',
          clientIdLabel: 'Restaurant GUID',
          webhookSupported: true,
          docsUrl: 'https://doc.toasttab.com/openapi/managementapi/'
        }
      case 'square':
        return {
          apiKeyLabel: 'Access Token',
          clientIdLabel: 'Application ID',
          webhookSupported: true,
          docsUrl: 'https://developer.squareup.com/docs'
        }
      case 'clover':
        return {
          apiKeyLabel: 'API Token',
          clientIdLabel: 'Merchant ID',
          webhookSupported: false,
          docsUrl: 'https://docs.clover.com/docs'
        }
      default:
        return {
          apiKeyLabel: 'API Key',
          clientIdLabel: 'Client ID',
          webhookSupported: false,
          docsUrl: '#'
        }
    }
  }

  const providerConfig = getProviderConfig(formData.provider)

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Configure POS Integration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your Point of Sale system to enable real-time inventory tracking and variance detection
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Integration Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Bar POS"
                  className="mt-2"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A friendly name to identify this integration
                </p>
              </div>

              <div>
                <Label htmlFor="provider">POS Provider *</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select POS provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center gap-2">
                          <span>{provider.icon}</span>
                          {provider.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="locationId">POS Location ID</Label>
              <Input
                id="locationId"
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                placeholder="Your POS system's location identifier"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Specify a location ID if your POS system uses multiple locations
              </p>
            </div>

            {/* API Credentials */}
            {formData.provider && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Credentials
                    {providerConfig.docsUrl !== '#' && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={providerConfig.docsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 ml-1" />
                          Docs
                        </a>
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apiKey">{providerConfig.apiKeyLabel} *</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={formData.credentials.apiKey}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, apiKey: e.target.value }
                        }))}
                        placeholder="Enter your API key"
                        className="mt-2"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="clientId">{providerConfig.clientIdLabel}</Label>
                      <Input
                        id="clientId"
                        value={formData.credentials.clientId}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, clientId: e.target.value }
                        }))}
                        placeholder="Enter client/restaurant ID"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={formData.credentials.clientSecret}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, clientSecret: e.target.value }
                      }))}
                      placeholder="Enter client secret (if required)"
                      className="mt-2"
                    />
                  </div>

                  {providerConfig.webhookSupported && (
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={formData.credentials.webhookUrl}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, webhookUrl: e.target.value }
                        }))}
                        placeholder="https://your-domain.com/webhooks/pos"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: For real-time transaction updates
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="additionalConfig">Additional Configuration (JSON)</Label>
                    <Textarea
                      id="additionalConfig"
                      value={formData.credentials.additionalConfig}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, additionalConfig: e.target.value }
                      }))}
                      placeholder='{"customField": "value"}'
                      className="mt-2 font-mono text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provider-specific configuration in JSON format
                    </p>
                  </div>

                  {/* Connection Test */}
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={testingConnection}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="h-4 w-4" />
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>

                    {connectionStatus === 'success' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Connection successful</span>
                      </div>
                    )}

                    {connectionStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Connection failed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sync Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Sync Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="syncFrequency">Sync Frequency</Label>
                    <Select
                      value={formData.syncFrequency.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, syncFrequency: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {syncFrequencies.map(freq => (
                          <SelectItem key={freq.value} value={freq.value.toString()}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {freq.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableWebhooks"
                        checked={formData.enableWebhooks}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, enableWebhooks: !!checked }))}
                        disabled={!providerConfig.webhookSupported}
                      />
                      <Label htmlFor="enableWebhooks" className="text-sm">
                        Enable Real-time Webhooks
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableMenuSync"
                        checked={formData.enableMenuSync}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, enableMenuSync: !!checked }))}
                      />
                      <Label htmlFor="enableMenuSync" className="text-sm">
                        Sync Menu Items
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="testMode"
                        checked={formData.testMode}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, testMode: !!checked }))}
                      />
                      <Label htmlFor="testMode" className="text-sm">
                        Test Mode
                      </Label>
                    </div>
                  </div>
                </div>

                {!providerConfig.webhookSupported && formData.enableWebhooks && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-yellow-300">
                      This provider does not support webhooks. Data will be synced at the specified frequency.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    name: '',
                    provider: '',
                    locationId: '',
                    credentials: {
                      apiKey: '',
                      clientId: '',
                      clientSecret: '',
                      webhookUrl: '',
                      additionalConfig: '{}'
                    },
                    syncFrequency: 15,
                    enableWebhooks: false,
                    enableMenuSync: true,
                    testMode: false
                  })
                }}
              >
                Reset Form
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Configuring...' : 'Configure Integration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}