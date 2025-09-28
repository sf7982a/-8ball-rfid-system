import { z } from 'zod'

// Bottle validation schemas
export const bottleStatusSchema = z.enum(['active', 'depleted', 'missing', 'damaged'])
export const bottleTypeSchema = z.enum(['vodka', 'whiskey', 'rum', 'gin', 'tequila', 'brandy', 'liqueur', 'wine', 'beer', 'other'])
export const bottleTierSchema = z.enum(['premium', 'mid_tier', 'well', 'wine', 'beer'])

export const createBottleSchema = z.object({
  rfidTag: z.string()
    .min(1, 'RFID tag is required')
    .max(100, 'RFID tag must be less than 100 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'RFID tag contains invalid characters'),
  brand: z.string()
    .min(1, 'Brand is required')
    .max(100, 'Brand must be less than 100 characters')
    .trim(),
  product: z.string()
    .min(1, 'Product is required')
    .max(200, 'Product must be less than 200 characters')
    .trim(),
  type: bottleTypeSchema,
  tier: bottleTierSchema.optional(),
  size: z.string()
    .min(1, 'Size is required')
    .max(20, 'Size must be less than 20 characters')
    .regex(/^\d+(\.\d+)?\s*(ml|l|oz|cl)$/i, 'Size must include a valid unit (ml, l, oz, cl)'),
  costPrice: z.number()
    .min(0, 'Cost price must be positive')
    .max(10000, 'Cost price seems unreasonably high')
    .optional(),
  retailPrice: z.number()
    .min(0, 'Retail price must be positive')
    .max(10000, 'Retail price seems unreasonably high')
    .optional(),
  currentQuantity: z.number()
    .min(0, 'Quantity cannot be negative')
    .max(100, 'Quantity seems unreasonably high')
    .default(1.0),
  status: bottleStatusSchema.default('active'),
  locationId: z.string().uuid('Invalid location ID').optional()
})

export const updateBottleSchema = createBottleSchema.partial().omit({ rfidTag: true })

export const bottleFiltersSchema = z.object({
  search: z.string()
    .max(100, 'Search term too long')
    .regex(/^[A-Za-z0-9\s\-_.]+$/, 'Search contains invalid characters')
    .optional(),
  type: bottleTypeSchema.optional(),
  status: bottleStatusSchema.optional(),
  locationId: z.union([
    z.string().uuid('Invalid location ID'),
    z.literal('unassigned')
  ]).optional()
})

// User validation schemas
export const userRoleSchema = z.enum(['super_admin', 'company_admin', 'manager', 'staff'])

export const createUserSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .trim()
    .optional(),
  role: userRoleSchema.default('staff'),
  organizationId: z.string().uuid('Invalid organization ID')
})

// Organization validation schemas
export const organizationTierSchema = z.enum(['trial', 'basic', 'premium', 'enterprise'])
export const organizationStatusSchema = z.enum(['trial', 'active', 'suspended', 'cancelled'])

export const createOrganizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name too long')
    .trim(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string()
    .max(500, 'Description too long')
    .trim()
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[\+]?[\d\s\-\(\)]{7,20}$/, 'Invalid phone number')
    .optional(),
  tier: organizationTierSchema.default('trial'),
  admin_email: z.string().email('Invalid admin email'),
  admin_first_name: z.string()
    .min(1, 'Admin first name is required')
    .max(50, 'Admin first name too long')
    .trim(),
  admin_last_name: z.string()
    .min(1, 'Admin last name is required')
    .max(50, 'Admin last name too long')
    .trim()
})

// Location validation schemas
export const createLocationSchema = z.object({
  name: z.string()
    .min(1, 'Location name is required')
    .max(100, 'Location name too long')
    .trim(),
  code: z.string()
    .min(1, 'Location code is required')
    .max(20, 'Location code too long')
    .regex(/^[A-Z0-9_-]+$/, 'Location code must contain only uppercase letters, numbers, underscores, and hyphens'),
  organizationId: z.string().uuid('Invalid organization ID')
})

// Common pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50)
})

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Type exports for TypeScript
export type CreateBottleData = z.infer<typeof createBottleSchema>
export type UpdateBottleData = z.infer<typeof updateBottleSchema>
export type BottleFiltersData = z.infer<typeof bottleFiltersSchema>
export type CreateUserData = z.infer<typeof createUserSchema>
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>
export type CreateLocationData = z.infer<typeof createLocationSchema>
export type PaginationData = z.infer<typeof paginationSchema>