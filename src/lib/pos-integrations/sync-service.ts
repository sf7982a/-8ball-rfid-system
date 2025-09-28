import { supabase } from '../supabase'

export interface POSTransaction {
  externalTransactionId: string
  transactionDate: string
  items: Array<{
    id: string
    name: string
    category?: string
    quantity: number
    price: number
    modifiers?: Array<{
      name: string
      price: number
    }>
  }>
  totalAmount: number
  locationId?: string
  staffMember?: string
  metadata?: Record<string, any>
}

export interface POSMenuItem {
  externalItemId: string
  name: string
  category?: string
  price: number
  ingredients?: Array<{
    bottleId?: string
    brand?: string
    product?: string
    quantityOz: number
  }>
  alcoholContent?: number
  isActive: boolean
}

export interface POSAdapter {
  name: string
  provider: 'toast' | 'square' | 'clover' | 'lightspeed' | 'revel' | 'touchbistro' | 'other'

  // Authentication and connection
  authenticate(credentials: Record<string, any>): Promise<boolean>
  testConnection(): Promise<boolean>

  // Data fetching
  getTransactions(locationId: string, startDate: Date, endDate: Date): Promise<POSTransaction[]>
  getMenuItems(locationId: string): Promise<POSMenuItem[]>

  // Webhook support
  supportsWebhooks(): boolean
  getWebhookEndpoint?(): string
  processWebhookData?(data: any): POSTransaction[]
}

export class POSSyncService {
  private adapters: Map<string, POSAdapter> = new Map()

  constructor() {
    // Initialize adapters for different POS providers
    this.registerAdapter(new ToastAdapter())
    this.registerAdapter(new SquareAdapter())
    this.registerAdapter(new CloverAdapter())
    this.registerAdapter(new GenericAdapter())
  }

  registerAdapter(adapter: POSAdapter) {
    this.adapters.set(adapter.provider, adapter)
  }

  /**
   * Sync transactions for a specific integration
   */
  async syncIntegration(integrationId: string): Promise<{
    success: boolean
    transactionsSynced: number
    error?: string
  }> {
    try {
      // Get integration details
      const { data: integration, error: integrationError } = await supabase
        .from('pos_integrations')
        .select('*')
        .eq('id', integrationId)
        .single()

      if (integrationError || !integration) {
        throw new Error('Integration not found')
      }

      const adapter = this.adapters.get(integration.provider)
      if (!adapter) {
        throw new Error(`No adapter found for provider: ${integration.provider}`)
      }

      // Authenticate with POS system
      const isAuthenticated = await adapter.authenticate(integration.credentials)
      if (!isAuthenticated) {
        throw new Error('Authentication failed')
      }

      // Determine sync window
      const endDate = new Date()
      const startDate = new Date(integration.last_sync || new Date(Date.now() - 24 * 60 * 60 * 1000))

      // Fetch transactions
      const transactions = await adapter.getTransactions(
        integration.provider_location_id || '',
        startDate,
        endDate
      )

      // Store transactions in database
      let transactionsSynced = 0
      for (const transaction of transactions) {
        const stored = await this.storeTransaction(transaction, integration)
        if (stored) transactionsSynced++
      }

      // Update integration last sync time
      await supabase
        .from('pos_integrations')
        .update({
          last_sync: endDate.toISOString(),
          error_count: 0,
          last_error: null
        })
        .eq('id', integrationId)

      return {
        success: true,
        transactionsSynced
      }

    } catch (error) {
      console.error('Error syncing integration:', error)

      // Update error count
      await supabase
        .from('pos_integrations')
        .update({
          error_count: 1, // Simplified for now
          last_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', integrationId)

      return {
        success: false,
        transactionsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Sync menu items for an integration
   */
  async syncMenuItems(integrationId: string): Promise<{
    success: boolean
    itemsSynced: number
    error?: string
  }> {
    try {
      const { data: integration, error } = await supabase
        .from('pos_integrations')
        .select('*')
        .eq('id', integrationId)
        .single()

      if (error || !integration) {
        throw new Error('Integration not found')
      }

      const adapter = this.adapters.get(integration.provider)
      if (!adapter) {
        throw new Error(`No adapter found for provider: ${integration.provider}`)
      }

      const isAuthenticated = await adapter.authenticate(integration.credentials)
      if (!isAuthenticated) {
        throw new Error('Authentication failed')
      }

      const menuItems = await adapter.getMenuItems(integration.provider_location_id || '')

      let itemsSynced = 0
      for (const item of menuItems) {
        const stored = await this.storeMenuItem(item, integration)
        if (stored) itemsSynced++
      }

      return {
        success: true,
        itemsSynced
      }

    } catch (error) {
      console.error('Error syncing menu items:', error)
      return {
        success: false,
        itemsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Sync all active integrations
   */
  async syncAllIntegrations(organizationId?: string): Promise<{
    totalIntegrations: number
    successfulSyncs: number
    totalTransactions: number
    errors: Array<{ integrationId: string; error: string }>
  }> {
    try {
      let query = supabase
        .from('pos_integrations')
        .select('*')
        .eq('status', 'active')

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: integrations, error } = await query

      if (error) throw error

      const results = {
        totalIntegrations: integrations?.length || 0,
        successfulSyncs: 0,
        totalTransactions: 0,
        errors: [] as Array<{ integrationId: string; error: string }>
      }

      if (!integrations) return results

      for (const integration of integrations) {
        const syncResult = await this.syncIntegration(integration.id)

        if (syncResult.success) {
          results.successfulSyncs++
          results.totalTransactions += syncResult.transactionsSynced
        } else {
          results.errors.push({
            integrationId: integration.id,
            error: syncResult.error || 'Unknown error'
          })
        }
      }

      return results

    } catch (error) {
      console.error('Error syncing all integrations:', error)
      return {
        totalIntegrations: 0,
        successfulSyncs: 0,
        totalTransactions: 0,
        errors: [{ integrationId: 'all', error: error instanceof Error ? error.message : 'Unknown error' }]
      }
    }
  }

  /**
   * Process webhook data for real-time updates
   */
  async processWebhook(provider: string, data: any): Promise<{
    success: boolean
    transactionsProcessed: number
    error?: string
  }> {
    try {
      const adapter = this.adapters.get(provider as any)
      if (!adapter || !adapter.supportsWebhooks() || !adapter.processWebhookData) {
        throw new Error(`Webhook not supported for provider: ${provider}`)
      }

      const transactions = adapter.processWebhookData(data)

      // Find integration for this webhook
      // This would typically be done by matching webhook signatures or location IDs
      const { data: integrations, error } = await supabase
        .from('pos_integrations')
        .select('*')
        .eq('provider', provider)
        .eq('status', 'active')

      if (error || !integrations?.length) {
        throw new Error('No active integration found for webhook')
      }

      let transactionsProcessed = 0
      for (const transaction of transactions) {
        // Try to match transaction to integration based on location
        const integration = integrations.find(i =>
          i.provider_location_id === transaction.locationId
        ) || integrations[0]

        const stored = await this.storeTransaction(transaction, integration)
        if (stored) transactionsProcessed++
      }

      return {
        success: true,
        transactionsProcessed
      }

    } catch (error) {
      console.error('Error processing webhook:', error)
      return {
        success: false,
        transactionsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(transaction: POSTransaction, integration: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pos_transactions')
        .upsert({
          organization_id: integration.organization_id,
          integration_id: integration.id,
          external_transaction_id: transaction.externalTransactionId,
          transaction_date: transaction.transactionDate,
          items: transaction.items,
          total_amount: transaction.totalAmount,
          location_id: transaction.locationId,
          staff_member: transaction.staffMember,
          metadata: transaction.metadata || {}
        }, {
          onConflict: 'integration_id,external_transaction_id'
        })

      return !error
    } catch (error) {
      console.error('Error storing transaction:', error)
      return false
    }
  }

  /**
   * Store menu item in database
   */
  private async storeMenuItem(item: POSMenuItem, integration: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          organization_id: integration.organization_id,
          integration_id: integration.id,
          external_item_id: item.externalItemId,
          name: item.name,
          category: item.category,
          price: item.price,
          ingredients: item.ingredients || [],
          alcohol_content: item.alcoholContent,
          is_active: item.isActive
        }, {
          onConflict: 'integration_id,external_item_id'
        })

      return !error
    } catch (error) {
      console.error('Error storing menu item:', error)
      return false
    }
  }
}

// Adapter implementations for different POS systems

class ToastAdapter implements POSAdapter {
  name = 'Toast POS'
  provider = 'toast' as const

  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    // Mock implementation - would use actual Toast API
    return credentials.apiKey && credentials.restaurantGuid
  }

  async testConnection(): Promise<boolean> {
    // Mock implementation
    return true
  }

  async getTransactions(locationId: string, startDate: Date, endDate: Date): Promise<POSTransaction[]> {
    // Mock implementation - would fetch from Toast API
    return [
      {
        externalTransactionId: 'toast-001',
        transactionDate: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            name: 'Vodka Soda - Grey Goose',
            quantity: 1,
            price: 12.00
          }
        ],
        totalAmount: 12.00,
        locationId,
        staffMember: 'John Doe'
      }
    ]
  }

  async getMenuItems(locationId: string): Promise<POSMenuItem[]> {
    // Mock implementation - would fetch from Toast API
    return [
      {
        externalItemId: 'menu-item-1',
        name: 'Vodka Soda - Grey Goose',
        category: 'Cocktails',
        price: 12.00,
        ingredients: [
          {
            brand: 'Grey Goose',
            product: 'Vodka',
            quantityOz: 1.5
          }
        ],
        alcoholContent: 40,
        isActive: true
      }
    ]
  }

  supportsWebhooks(): boolean {
    return true
  }

  processWebhookData(data: any): POSTransaction[] {
    // Mock implementation - would parse Toast webhook format
    return []
  }
}

class SquareAdapter implements POSAdapter {
  name = 'Square POS'
  provider = 'square' as const

  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    // Mock implementation - would use Square API
    return credentials.accessToken && credentials.applicationId
  }

  async testConnection(): Promise<boolean> {
    return true
  }

  async getTransactions(locationId: string, startDate: Date, endDate: Date): Promise<POSTransaction[]> {
    // Mock implementation
    return []
  }

  async getMenuItems(locationId: string): Promise<POSMenuItem[]> {
    // Mock implementation
    return []
  }

  supportsWebhooks(): boolean {
    return true
  }

  processWebhookData(data: any): POSTransaction[] {
    return []
  }
}

class CloverAdapter implements POSAdapter {
  name = 'Clover POS'
  provider = 'clover' as const

  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    return credentials.accessToken && credentials.merchantId
  }

  async testConnection(): Promise<boolean> {
    return true
  }

  async getTransactions(locationId: string, startDate: Date, endDate: Date): Promise<POSTransaction[]> {
    return []
  }

  async getMenuItems(locationId: string): Promise<POSMenuItem[]> {
    return []
  }

  supportsWebhooks(): boolean {
    return false
  }
}

class GenericAdapter implements POSAdapter {
  name = 'Generic POS'
  provider = 'other' as const

  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    return true // Generic adapter always authenticates
  }

  async testConnection(): Promise<boolean> {
    return true
  }

  async getTransactions(locationId: string, startDate: Date, endDate: Date): Promise<POSTransaction[]> {
    return []
  }

  async getMenuItems(locationId: string): Promise<POSMenuItem[]> {
    return []
  }

  supportsWebhooks(): boolean {
    return false
  }
}

// Export singleton instance
export const posSyncService = new POSSyncService()

// Utility functions for scheduling and automation
export async function scheduledSync(organizationId?: string): Promise<void> {
  console.log('Running scheduled POS sync...')
  const results = await posSyncService.syncAllIntegrations(organizationId)
  console.log('Sync completed:', results)

  // Log results to activity logs
  if (organizationId) {
    await supabase.from('activity_logs').insert({
      organization_id: organizationId,
      user_id: null, // System user
      action: 'pos_sync_completed',
      resource_type: 'pos_integration',
      metadata: results
    })
  }
}

export async function setupWebhookHandler(): Promise<void> {
  // This would set up Express routes or similar for webhook handling
  // Implementation depends on your backend setup
  console.log('Webhook handlers would be set up here')
}