import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, pgEnum, decimal } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'company_admin', 'manager', 'staff'])
export const bottleStatusEnum = pgEnum('bottle_status', ['active', 'depleted', 'missing', 'damaged'])
export const bottleTypeEnum = pgEnum('bottle_type', ['vodka', 'whiskey', 'rum', 'gin', 'tequila', 'brandy', 'liqueur', 'wine', 'beer', 'other'])

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const bottles = pgTable('bottles', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id),
  rfidTag: text('rfid_tag').unique().notNull(),
  brand: text('brand').notNull(),
  product: text('product').notNull(),
  type: bottleTypeEnum('type').notNull(),
  size: text('size').notNull(), // e.g., "750ml", "1L"
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }),
  currentQuantity: decimal('current_quantity', { precision: 5, scale: 2 }).notNull().default('1.00'), // supports partial bottles
  status: bottleStatusEnum('status').notNull().default('active'),
  lastScanned: timestamp('last_scanned'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const scanSessions = pgTable('scan_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  bottleCount: integer('bottle_count').default(0).notNull(),
  metadata: jsonb('metadata').default({}),
})

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})