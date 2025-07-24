import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { BottleService, LocationService } from '../../lib/api/bottles'
import { BOTTLE_TYPES, BOTTLE_STATUSES, BOTTLE_SIZES, type Bottle, type Location } from '../../types/inventory'

const bottleSchema = z.object({
  rfidTag: z.string().min(1, 'RFID tag is required').max(50, 'RFID tag too long'),
  brand: z.string().min(1, 'Brand is required').max(100, 'Brand name too long'),
  product: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  type: z.enum(BOTTLE_TYPES as any, {
    required_error: 'Please select a bottle type'
  }),
  size: z.enum(BOTTLE_SIZES as any, {
    required_error: 'Please select a bottle size'
  }),
  costPrice: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Cost price must be a valid positive number'),
  retailPrice: z.string().optional().refine((val) => {
    if (!val || val === '') return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Retail price must be a valid positive number'),
  currentQuantity: z.string().min(1, 'Quantity is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 10
  }, 'Quantity must be between 0 and 10'),
  status: z.enum(BOTTLE_STATUSES as any, {
    required_error: 'Please select a status'
  }),
  locationId: z.string().optional()
})

type BottleFormData = z.infer<typeof bottleSchema>

interface BottleFormProps {
  bottle?: Bottle
  onSubmit: (_data: BottleFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function BottleForm({ bottle, onSubmit, onCancel, isLoading = false }: BottleFormProps) {
  const { organization } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<BottleFormData>({
    resolver: zodResolver(bottleSchema),
    defaultValues: {
      rfidTag: bottle?.rfidTag || '',
      brand: bottle?.brand || '',
      product: bottle?.product || '',
      type: bottle?.type || 'vodka',
      size: bottle?.size || '750ml',
      costPrice: bottle?.costPrice || '',
      retailPrice: bottle?.retailPrice || '',
      currentQuantity: bottle?.currentQuantity || '1.00',
      status: bottle?.status || 'active',
      locationId: bottle?.locationId || 'none'
    }
  })

  // Load locations
  useEffect(() => {
    async function loadLocations() {
      if (!organization?.id) return

      try {
        setLoadingLocations(true)
        const locationData = await LocationService.getLocations(organization.id)
        setLocations(locationData)
      } catch (err) {
        console.error('Failed to load locations:', err)
        setError('Failed to load locations')
      } finally {
        setLoadingLocations(false)
      }
    }

    loadLocations()
  }, [organization?.id])

  const handleSubmit = async (data: BottleFormData) => {
    if (!organization?.id) {
      setError('Organization not found')
      return
    }

    try {
      setError(null)
      
      // Check if RFID tag is unique (for new bottles or when changing RFID)
      if (!bottle || bottle.rfidTag !== data.rfidTag) {
        const isUnique = await BottleService.isRfidTagUnique(
          data.rfidTag, 
          organization.id, 
          bottle?.id
        )
        if (!isUnique) {
          form.setError('rfidTag', { 
            type: 'manual', 
            message: 'This RFID tag is already in use' 
          })
          return
        }
      }

      // Convert "none" locationId back to empty string for submission
      const submitData = {
        ...data,
        locationId: data.locationId === 'none' ? '' : data.locationId
      }
      
      await onSubmit(submitData)
    } catch (err: any) {
      setError(err.message || 'Failed to save bottle')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 text-destructive dark:border-destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RFID Tag */}
          <FormField
            control={form.control}
            name="rfidTag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFID Tag *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter RFID tag ID" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Brand */}
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Grey Goose, Hennessy" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Premium Vodka, VS Cognac" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select bottle type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BOTTLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Size */}
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select bottle size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BOTTLE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cost Price */}
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Retail Price */}
          <FormField
            control={form.control}
            name="retailPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retail Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Current Quantity */}
          <FormField
            control={form.control}
            name="currentQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="1.00" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BOTTLE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={loadingLocations ? "Loading..." : "Select location"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No location assigned</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {bottle ? 'Update Bottle' : 'Create Bottle'}
          </Button>
        </div>
      </form>
    </Form>
  )
}