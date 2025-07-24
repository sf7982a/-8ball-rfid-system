import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Alert, AlertDescription } from '../ui/alert'
import { Switch } from '../ui/switch'
import { Loader2 } from 'lucide-react'
import type { Location } from '../../types/inventory'

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Name too long'),
  code: z.string().min(1, 'Location code is required').max(20, 'Code too long').regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  isActive: z.boolean().default(true)
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationFormProps {
  location?: Location
  onSubmit: (_data: LocationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function LocationForm({ location, onSubmit, onCancel, isLoading = false }: LocationFormProps) {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      code: location?.code || '',
      isActive: location?.isActive !== false
    }
  })

  const handleSubmit = async (data: LocationFormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err: any) {
      setError(err.message || 'Failed to save location')
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
          {/* Location Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Main Bar, Storage Room" 
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Code *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., BAR001, STOR001" 
                    {...field}
                    className="bg-background uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Must be uppercase letters and numbers only
                </p>
              </FormItem>
            )}
          />
        </div>

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Location</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Active locations can be assigned to bottles
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
            {location ? 'Update Location' : 'Create Location'}
          </Button>
        </div>
      </form>
    </Form>
  )
}