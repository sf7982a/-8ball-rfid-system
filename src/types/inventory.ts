import type { bottles, locations } from '../lib/db/schema'

export type Bottle = typeof bottles.$inferSelect
export type NewBottle = typeof bottles.$inferInsert
export type Location = typeof locations.$inferSelect

export type BottleWithLocation = Bottle & {
  location?: Location | null
}

export const BOTTLE_TYPES = [
  'vodka',
  'whiskey', 
  'rum',
  'gin',
  'tequila',
  'brandy',
  'liqueur',
  'wine',
  'beer',
  'other'
] as const

export const BOTTLE_STATUSES = [
  'active',
  'depleted', 
  'missing',
  'damaged'
] as const

export const BOTTLE_SIZES = [
  '50ml',
  '200ml',
  '375ml',
  '500ml',
  '750ml',
  '1L',
  '1.5L',
  '3L'
] as const

export const BOTTLE_TIERS = [
  'rail',
  'call',
  'premium',
  'super_premium',
  'ultra_premium'
] as const

export const BOTTLE_TIER_LABELS = {
  'rail': 'Rail',
  'call': 'Call',
  'premium': 'Premium',
  'super_premium': 'Super Premium',
  'ultra_premium': 'Ultra Premium'
} as const

export type BottleType = typeof BOTTLE_TYPES[number]
export type BottleStatus = typeof BOTTLE_STATUSES[number]
export type BottleSize = typeof BOTTLE_SIZES[number]
export type BottleTier = typeof BOTTLE_TIERS[number]

export interface Tier {
  id: string
  name: BottleTier
  display_name: string
  description: string
  sort_order: number
}

export interface BottleFilters {
  search?: string
  type?: BottleType
  status?: BottleStatus
  locationId?: string
}

export interface BottleSortConfig {
  field: keyof Bottle
  direction: 'asc' | 'desc'
}

export interface ScanSession {
  id: string
  organizationId: string
  locationId: string
  userId: string
  startedAt: Date
  completedAt?: Date
  bottleCount: number
  metadata: Record<string, any>
}