import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Building,
  User,
  Settings,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save
} from 'lucide-react'

interface OrganizationFormData {
  // Basic Info
  name: string
  slug: string
  description: string
  website: string
  phone: string
  address: string

  // Subscription
  tier: 'trial' | 'basic' | 'premium' | 'enterprise'
  trial_duration: number

  // Admin User
  admin_email: string
  admin_first_name: string
  admin_last_name: string
  admin_phone: string

  // Features
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

  // Settings
  max_users: number
  max_locations: number
  storage_limit_gb: number
  send_welcome_email: boolean
}

interface CreateOrganizationWizardProps {
  onSubmit: (data: OrganizationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CreateOrganizationWizard({
  onSubmit,
  onCancel,
  isLoading = false
}: CreateOrganizationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    website: '',
    phone: '',
    address: '',
    tier: 'trial',
    trial_duration: 14,
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_phone: '',
    features: {
      rfid_scanning: true,
      pos_integrations: true,
      theft_detection: false,
      analytics_dashboard: true,
      bulk_operations: false,
      api_access: false,
      custom_branding: false,
      advanced_reports: false
    },
    max_users: 5,
    max_locations: 3,
    storage_limit_gb: 1,
    send_welcome_email: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const steps = [
    { id: 'basic', title: 'Basic Information', icon: Building },
    { id: 'admin', title: 'Admin User', icon: User },
    { id: 'subscription', title: 'Subscription', icon: CreditCard },
    { id: 'features', title: 'Features & Settings', icon: Settings }
  ]

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OrganizationFormData],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Basic Info
        if (!formData.name) newErrors.name = 'Organization name is required'
        if (!formData.slug) newErrors.slug = 'Slug is required'
        if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
          newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
        }
        break

      case 1: // Admin User
        if (!formData.admin_email) newErrors.admin_email = 'Admin email is required'
        if (formData.admin_email && !/\S+@\S+\.\S+/.test(formData.admin_email)) {
          newErrors.admin_email = 'Please enter a valid email address'
        }
        if (!formData.admin_first_name) newErrors.admin_first_name = 'First name is required'
        if (!formData.admin_last_name) newErrors.admin_last_name = 'Last name is required'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Error creating organization:', error)
      }
    }
  }

  const getTierFeatures = (tier: string) => {
    const tierFeatures = {
      trial: { users: 3, locations: 1, storage: 0.5, price: 'Free' },
      basic: { users: 10, locations: 3, storage: 2, price: '$99/month' },
      premium: { users: 25, locations: 10, storage: 10, price: '$299/month' },
      enterprise: { users: 'Unlimited', locations: 'Unlimited', storage: 100, price: '$899/month' }
    }
    return tierFeatures[tier as keyof typeof tierFeatures]
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    updateFormData('name', e.target.value)
                    if (!formData.slug) {
                      updateFormData('slug', generateSlug(e.target.value))
                    }
                  }}
                  placeholder="Acme Restaurant Group"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => updateFormData('slug', e.target.value)}
                  placeholder="acme-restaurant"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used in URLs: https://app.8ball-rfid.com/{formData.slug}
                </p>
                {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Brief description of the organization..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Street address, city, state, country..."
                rows={2}
              />
            </div>
          </div>
        )

      case 1: // Admin User
        return (
          <div className="space-y-4">
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                This person will be the primary administrator for the organization and will receive login credentials.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin_first_name">First Name *</Label>
                <Input
                  id="admin_first_name"
                  value={formData.admin_first_name}
                  onChange={(e) => updateFormData('admin_first_name', e.target.value)}
                  placeholder="John"
                />
                {errors.admin_first_name && <p className="text-sm text-red-500 mt-1">{errors.admin_first_name}</p>}
              </div>

              <div>
                <Label htmlFor="admin_last_name">Last Name *</Label>
                <Input
                  id="admin_last_name"
                  value={formData.admin_last_name}
                  onChange={(e) => updateFormData('admin_last_name', e.target.value)}
                  placeholder="Smith"
                />
                {errors.admin_last_name && <p className="text-sm text-red-500 mt-1">{errors.admin_last_name}</p>}
              </div>

              <div>
                <Label htmlFor="admin_email">Email Address *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => updateFormData('admin_email', e.target.value)}
                  placeholder="john@example.com"
                />
                {errors.admin_email && <p className="text-sm text-red-500 mt-1">{errors.admin_email}</p>}
              </div>

              <div>
                <Label htmlFor="admin_phone">Phone</Label>
                <Input
                  id="admin_phone"
                  value={formData.admin_phone}
                  onChange={(e) => updateFormData('admin_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="send_welcome_email">Send Welcome Email</Label>
                <p className="text-sm text-muted-foreground">Send setup instructions to the admin user</p>
              </div>
              <Switch
                id="send_welcome_email"
                checked={formData.send_welcome_email}
                onCheckedChange={(checked) => updateFormData('send_welcome_email', checked)}
              />
            </div>
          </div>
        )

      case 2: // Subscription
        return (
          <div className="space-y-6">
            <div>
              <Label>Subscription Tier</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {(['trial', 'basic', 'premium', 'enterprise'] as const).map((tier) => {
                  const features = getTierFeatures(tier)
                  return (
                    <Card
                      key={tier}
                      className={`cursor-pointer transition-all ${
                        formData.tier === tier
                          ? 'ring-2 ring-blue-500 bg-blue-500/10'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => updateFormData('tier', tier)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="capitalize">{tier}</span>
                          <Badge variant={tier === 'trial' ? 'secondary' : 'default'}>
                            {features.price}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <div>👥 {features.users} users</div>
                          <div>📍 {features.locations} locations</div>
                          <div>💾 {features.storage} GB storage</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {formData.tier === 'trial' && (
              <div>
                <Label htmlFor="trial_duration">Trial Duration (days)</Label>
                <Select
                  value={formData.trial_duration.toString()}
                  onValueChange={(value) => updateFormData('trial_duration', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )

      case 3: // Features & Settings
        return (
          <div className="space-y-6">
            <div>
              <Label>Feature Configuration</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {Object.entries(formData.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateFormData(`features.${feature}`, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => updateFormData('max_users', parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="max_locations">Max Locations</Label>
                <Input
                  id="max_locations"
                  type="number"
                  value={formData.max_locations}
                  onChange={(e) => updateFormData('max_locations', parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="storage_limit_gb">Storage Limit (GB)</Label>
                <Input
                  id="storage_limit_gb"
                  type="number"
                  step="0.5"
                  value={formData.storage_limit_gb}
                  onChange={(e) => updateFormData('storage_limit_gb', parseFloat(e.target.value))}
                  min="0.5"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = index < currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="ml-2 hidden md:block">
                <div className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-px mx-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : prevStep}
          disabled={isLoading}
        >
          {currentStep === 0 ? (
            'Cancel'
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </>
          )}
        </Button>

        <Button
          onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
          disabled={isLoading}
        >
          {isLoading ? (
            'Creating...'
          ) : currentStep === steps.length - 1 ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Organization
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}