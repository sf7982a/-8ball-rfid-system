export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: 'super_admin' | 'company_admin' | 'manager' | 'staff'
          organization_id: string | null
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'super_admin' | 'company_admin' | 'manager' | 'staff'
          organization_id?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'super_admin' | 'company_admin' | 'manager' | 'staff'
          organization_id?: string | null
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string
          settings: Record<string, any>
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code: string
          settings?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string
          settings?: Record<string, any>
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bottles: {
        Row: {
          id: string
          organization_id: string
          location_id: string | null
          rfid_tag: string
          brand: string
          product: string
          type: 'vodka' | 'whiskey' | 'rum' | 'gin' | 'tequila' | 'brandy' | 'liqueur' | 'wine' | 'beer' | 'other'
          size_ml: number
          cost_price: string | null
          retail_price: string | null
          current_quantity: string
          status: 'active' | 'depleted' | 'missing' | 'damaged'
          last_scanned: string | null
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          location_id?: string | null
          rfid_tag: string
          brand: string
          product: string
          type: 'vodka' | 'whiskey' | 'rum' | 'gin' | 'tequila' | 'brandy' | 'liqueur' | 'wine' | 'beer' | 'other'
          size_ml: number
          cost_price?: string | null
          retail_price?: string | null
          current_quantity?: string
          status?: 'active' | 'depleted' | 'missing' | 'damaged'
          last_scanned?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string | null
          rfid_tag?: string
          brand?: string
          product?: string
          type?: 'vodka' | 'whiskey' | 'rum' | 'gin' | 'tequila' | 'brandy' | 'liqueur' | 'wine' | 'beer' | 'other'
          size?: string
          cost_price?: string | null
          retail_price?: string | null
          current_quantity?: string
          status?: 'active' | 'depleted' | 'missing' | 'damaged'
          last_scanned?: string | null
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      scan_sessions: {
        Row: {
          id: string
          organization_id: string
          location_id: string
          user_id: string
          started_at: string
          completed_at: string | null
          bottle_count: number
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          organization_id: string
          location_id: string
          user_id: string
          started_at?: string
          completed_at?: string | null
          bottle_count?: number
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          organization_id?: string
          location_id?: string
          user_id?: string
          started_at?: string
          completed_at?: string | null
          bottle_count?: number
          metadata?: Record<string, any>
        }
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'super_admin' | 'company_admin' | 'manager' | 'staff'
      bottle_status: 'active' | 'depleted' | 'missing' | 'damaged'
      bottle_type: 'vodka' | 'whiskey' | 'rum' | 'gin' | 'tequila' | 'brandy' | 'liqueur' | 'wine' | 'beer' | 'other'
    }
  }
}