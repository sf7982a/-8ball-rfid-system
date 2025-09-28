import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, pgEnum, decimal, date, varchar } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'company_admin', 'manager', 'staff'])
export const bottleStatusEnum = pgEnum('bottle_status', ['active', 'depleted', 'missing', 'damaged'])
export const bottleTypeEnum = pgEnum('bottle_type', ['vodka', 'whiskey', 'rum', 'gin', 'tequila', 'brandy', 'liqueur', 'wine', 'beer', 'other'])
export const bottleTierEnum = pgEnum('bottle_tier', ['premium', 'mid_tier', 'well', 'wine', 'beer'])
export const posProviderEnum = pgEnum('pos_provider', ['toast', 'square', 'clover', 'lightspeed', 'revel', 'touchbistro', 'other'])
export const integrationStatusEnum = pgEnum('integration_status', ['pending', 'active', 'inactive', 'error', 'suspended'])
export const detectionTypeEnum = pgEnum('detection_type', ['missing', 'surplus', 'consumption_anomaly', 'theft_suspected', 'reconciliation_needed'])
export const severityLevelEnum = pgEnum('severity_level', ['low', 'medium', 'high', 'critical'])
export const varianceStatusEnum = pgEnum('variance_status', ['open', 'investigating', 'resolved', 'false_positive', 'ignored'])

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
  tier: bottleTierEnum('tier'),
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

export const posIntegrations = pgTable('pos_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id),
  provider: posProviderEnum('provider').notNull(),
  providerLocationId: varchar('provider_location_id'),
  name: varchar('name').notNull(),
  status: integrationStatusEnum('status').notNull().default('pending'),
  config: jsonb('config').default({}),
  credentials: jsonb('credentials').default({}),
  lastSync: timestamp('last_sync'),
  syncFrequencyMinutes: integer('sync_frequency_minutes').default(15),
  errorCount: integer('error_count').default(0),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posTransactions = pgTable('pos_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  integrationId: uuid('integration_id').references(() => posIntegrations.id).notNull(),
  externalTransactionId: varchar('external_transaction_id').notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  items: jsonb('items').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  locationId: varchar('location_id'),
  staffMember: varchar('staff_member'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const varianceDetections = pgTable('variance_detections', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  bottleId: uuid('bottle_id').references(() => bottles.id),
  locationId: uuid('location_id').references(() => locations.id),
  detectionType: detectionTypeEnum('detection_type').notNull(),
  severity: severityLevelEnum('severity').notNull(),
  detectedAt: timestamp('detected_at').notNull(),
  expectedQuantity: decimal('expected_quantity', { precision: 5, scale: 2 }),
  actualQuantity: decimal('actual_quantity', { precision: 5, scale: 2 }),
  varianceAmount: decimal('variance_amount', { precision: 5, scale: 2 }),
  posSalesCount: integer('pos_sales_count').default(0),
  rfidScanCount: integer('rfid_scan_count').default(0),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  status: varianceStatusEnum('status').notNull().default('open'),
  notes: text('notes'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by').references(() => profiles.id),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const performanceMetrics = pgTable('performance_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  date: date('date').notNull(),
  locationId: uuid('location_id').references(() => locations.id),
  bottleTier: bottleTierEnum('bottle_tier'),
  totalRevenue: decimal('total_revenue', { precision: 12, scale: 2 }).default('0'),
  totalBottlesSold: integer('total_bottles_sold').default(0),
  totalBottlesMissing: integer('total_bottles_missing').default(0),
  pourCostPercentage: decimal('pour_cost_percentage', { precision: 5, scale: 2 }),
  inventoryTurnover: decimal('inventory_turnover', { precision: 5, scale: 2 }),
  theftIncidents: integer('theft_incidents').default(0),
  varianceDetections: integer('variance_detections').default(0),
  accuracyPercentage: decimal('accuracy_percentage', { precision: 5, scale: 2 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const menuItems = pgTable('menu_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  integrationId: uuid('integration_id').references(() => posIntegrations.id).notNull(),
  externalItemId: varchar('external_item_id').notNull(),
  name: varchar('name').notNull(),
  category: varchar('category'),
  price: decimal('price', { precision: 8, scale: 2 }),
  ingredients: jsonb('ingredients').default('[]'),
  alcoholContent: decimal('alcohol_content', { precision: 3, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})