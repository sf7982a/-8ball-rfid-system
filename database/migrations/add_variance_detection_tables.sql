-- Enhanced POS Analytics & Variance Detection System
-- Migration: Add variance detection and POS integration tables
-- Date: 2025-09-27

-- ===================================================================
-- 1. POS INTEGRATIONS TABLE
-- ===================================================================

-- Create POS provider enum
DO $$ BEGIN
    CREATE TYPE pos_provider AS ENUM (
        'toast',
        'square',
        'clover',
        'lightspeed',
        'revel',
        'touchbistro',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create integration status enum
DO $$ BEGIN
    CREATE TYPE integration_status AS ENUM (
        'pending',
        'active',
        'inactive',
        'error',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- POS integrations table
CREATE TABLE IF NOT EXISTS pos_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    provider pos_provider NOT NULL,
    provider_location_id VARCHAR, -- External location ID from POS system
    name VARCHAR NOT NULL,
    status integration_status DEFAULT 'pending' NOT NULL,
    config JSONB DEFAULT '{}' NOT NULL, -- Provider-specific configuration
    credentials JSONB DEFAULT '{}' NOT NULL, -- Encrypted API keys/tokens
    last_sync TIMESTAMPTZ,
    sync_frequency_minutes INTEGER DEFAULT 15, -- How often to sync data
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===================================================================
-- 2. POS TRANSACTIONS TABLE
-- ===================================================================

-- Transaction sync table for POS data
CREATE TABLE IF NOT EXISTS pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    integration_id UUID REFERENCES pos_integrations(id) ON DELETE CASCADE NOT NULL,
    external_transaction_id VARCHAR NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    items JSONB NOT NULL, -- Array of sold items with quantities
    total_amount DECIMAL(10,2),
    location_id VARCHAR,
    staff_member VARCHAR,
    metadata JSONB DEFAULT '{}', -- Additional transaction data
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(integration_id, external_transaction_id)
);

-- ===================================================================
-- 3. VARIANCE DETECTION TABLES
-- ===================================================================

-- Create detection type enum
DO $$ BEGIN
    CREATE TYPE detection_type AS ENUM (
        'missing',
        'surplus',
        'consumption_anomaly',
        'theft_suspected',
        'reconciliation_needed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create severity enum
DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create variance status enum
DO $$ BEGIN
    CREATE TYPE variance_status AS ENUM (
        'open',
        'investigating',
        'resolved',
        'false_positive',
        'ignored'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Variance detection results
CREATE TABLE IF NOT EXISTS variance_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    bottle_id UUID REFERENCES bottles(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    detection_type detection_type NOT NULL,
    severity severity_level NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL,
    expected_quantity DECIMAL(5,2),
    actual_quantity DECIMAL(5,2),
    variance_amount DECIMAL(5,2),
    pos_sales_count INTEGER DEFAULT 0,
    rfid_scan_count INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    status variance_status DEFAULT 'open' NOT NULL,
    notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}', -- Additional detection data
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===================================================================
-- 4. PERFORMANCE METRICS TABLE
-- ===================================================================

-- Create bottle tier enum
DO $$ BEGIN
    CREATE TYPE bottle_tier AS ENUM (
        'premium',
        'mid_tier',
        'well',
        'wine',
        'beer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Performance metrics aggregation
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    bottle_tier bottle_tier,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_bottles_sold INTEGER DEFAULT 0,
    total_bottles_missing INTEGER DEFAULT 0,
    pour_cost_percentage DECIMAL(5,2),
    inventory_turnover DECIMAL(5,2),
    theft_incidents INTEGER DEFAULT 0,
    variance_detections INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, date, location_id, bottle_tier)
);

-- ===================================================================
-- 5. MENU ITEMS MAPPING TABLE
-- ===================================================================

-- Menu items to bottle mapping for ingredient tracking
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    integration_id UUID REFERENCES pos_integrations(id) ON DELETE CASCADE NOT NULL,
    external_item_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    category VARCHAR,
    price DECIMAL(8,2),
    ingredients JSONB DEFAULT '[]', -- Array of {bottle_id, quantity_oz}
    alcohol_content DECIMAL(3,2), -- Percentage alcohol
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(integration_id, external_item_id)
);

-- ===================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ===================================================================

-- POS integrations indexes
CREATE INDEX IF NOT EXISTS idx_pos_integrations_org_id ON pos_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_pos_integrations_location_id ON pos_integrations(location_id);
CREATE INDEX IF NOT EXISTS idx_pos_integrations_status ON pos_integrations(status);

-- POS transactions indexes
CREATE INDEX IF NOT EXISTS idx_pos_transactions_org_id ON pos_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_integration_id ON pos_transactions(integration_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_external_id ON pos_transactions(external_transaction_id);

-- Variance detections indexes
CREATE INDEX IF NOT EXISTS idx_variance_detections_org_id ON variance_detections(organization_id);
CREATE INDEX IF NOT EXISTS idx_variance_detections_bottle_id ON variance_detections(bottle_id);
CREATE INDEX IF NOT EXISTS idx_variance_detections_location_id ON variance_detections(location_id);
CREATE INDEX IF NOT EXISTS idx_variance_detections_detected_at ON variance_detections(detected_at);
CREATE INDEX IF NOT EXISTS idx_variance_detections_status ON variance_detections(status);
CREATE INDEX IF NOT EXISTS idx_variance_detections_severity ON variance_detections(severity);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_org_id ON performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_location_id ON performance_metrics(location_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tier ON performance_metrics(bottle_tier);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_org_id ON menu_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_integration_id ON menu_items(integration_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_external_id ON menu_items(external_item_id);

-- ===================================================================
-- 7. UPDATE BOTTLES TABLE FOR TIER CLASSIFICATION
-- ===================================================================

-- Add tier classification to bottles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'bottles' AND column_name = 'tier') THEN
        ALTER TABLE bottles ADD COLUMN tier bottle_tier;

        -- Set default tier based on bottle type and brand
        UPDATE bottles SET tier = CASE
            WHEN type IN ('wine', 'beer') THEN type::bottle_tier
            WHEN brand ILIKE ANY(ARRAY['%grey goose%', '%patron%', '%macallan%', '%hennessy%']) THEN 'premium'
            WHEN brand ILIKE ANY(ARRAY['%absolut%', '%bacardi%', '%jameson%', '%tanqueray%']) THEN 'mid_tier'
            ELSE 'well'
        END;
    END IF;
END $$;

-- ===================================================================
-- 8. RLS POLICIES FOR MULTI-TENANCY
-- ===================================================================

-- Enable RLS on all new tables
ALTER TABLE pos_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE variance_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for pos_integrations
CREATE POLICY "pos_integrations_tenant_isolation" ON pos_integrations
    USING (organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    ));

-- RLS policies for pos_transactions
CREATE POLICY "pos_transactions_tenant_isolation" ON pos_transactions
    USING (organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    ));

-- RLS policies for variance_detections
CREATE POLICY "variance_detections_tenant_isolation" ON variance_detections
    USING (organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    ));

-- RLS policies for performance_metrics
CREATE POLICY "performance_metrics_tenant_isolation" ON performance_metrics
    USING (organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    ));

-- RLS policies for menu_items
CREATE POLICY "menu_items_tenant_isolation" ON menu_items
    USING (organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
    ));

-- ===================================================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- ===================================================================

-- Update timestamps on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_pos_integrations_updated_at
    BEFORE UPDATE ON pos_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variance_detections_updated_at
    BEFORE UPDATE ON variance_detections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
    BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 10. SAMPLE DATA FOR TESTING
-- ===================================================================

-- Note: Sample data would be inserted after organization setup
-- This is just the schema migration