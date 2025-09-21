# 8Ball RFID Production Database Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the production database with tier migration, performance indexes, and Row Level Security (RLS) policies.

## Prerequisites
- Supabase project set up and accessible
- Database connection with admin privileges
- Backup of existing data (if applicable)

## Deployment Steps

### Step 1: Execute Tier Migration Script

Execute the complete tier migration script in your Supabase SQL Editor:

```sql
-- Tier Classification System Migration Script
-- This script migrates the system from product names to tier classification

-- 1. Create tier enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier') THEN
    CREATE TYPE tier AS ENUM ('rail', 'call', 'premium', 'super_premium', 'ultra_premium');
  END IF;
END $$;

-- 2. Create tiers table with predefined tier options
CREATE TABLE IF NOT EXISTS tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name tier NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Insert predefined tiers if they don't exist
INSERT INTO tiers (name, display_name, description, sort_order) VALUES
  ('rail', 'Rail', 'House/well brands - lowest cost options', 1),
  ('call', 'Call', 'Mid-tier, recognizable brands', 2),
  ('premium', 'Premium', 'Higher-end, quality brands', 3),
  ('super_premium', 'Super Premium', 'Top-shelf, luxury brands', 4),
  ('ultra_premium', 'Ultra Premium', 'Rare/exclusive products', 5)
ON CONFLICT (name) DO NOTHING;

-- 4. Add default_tier_id to brands table
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS default_tier_id UUID REFERENCES tiers(id);

-- 5. Add tier_id to bottles table and make product_name_id nullable
ALTER TABLE bottles
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES tiers(id);

-- Make product_name_id nullable for migration
ALTER TABLE bottles
ALTER COLUMN product_name_id DROP NOT NULL;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bottles_tier_id ON bottles(tier_id);
CREATE INDEX IF NOT EXISTS idx_brands_default_tier_id ON brands(default_tier_id);
CREATE INDEX IF NOT EXISTS idx_bottles_brand_tier ON bottles(brand_id, tier_id) WHERE tier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tiers_sort_order ON tiers(sort_order);

-- 7. Migrate existing bottles to tiers based on brand and product analysis
DO $$
DECLARE
  rail_tier_id UUID;
  call_tier_id UUID;
  premium_tier_id UUID;
  super_premium_tier_id UUID;
  ultra_premium_tier_id UUID;
BEGIN
  -- Get tier IDs
  SELECT id INTO rail_tier_id FROM tiers WHERE name = 'rail';
  SELECT id INTO call_tier_id FROM tiers WHERE name = 'call';
  SELECT id INTO premium_tier_id FROM tiers WHERE name = 'premium';
  SELECT id INTO super_premium_tier_id FROM tiers WHERE name = 'super_premium';
  SELECT id INTO ultra_premium_tier_id FROM tiers WHERE name = 'ultra_premium';

  -- Update bottles based on brand name patterns (simplified logic)
  -- Rail brands
  UPDATE bottles SET tier_id = rail_tier_id
  WHERE tier_id IS NULL AND (
    LOWER(brand) LIKE '%smirnoff%' OR
    LOWER(brand) LIKE '%jose cuervo%' OR
    LOWER(brand) LIKE '%captain morgan%' OR
    LOWER(brand) LIKE '%seagrams%' OR
    LOWER(brand) LIKE '%fleischmann%' OR
    LOWER(brand) LIKE '%rubinoff%'
  );

  -- Call brands
  UPDATE bottles SET tier_id = call_tier_id
  WHERE tier_id IS NULL AND (
    LOWER(brand) LIKE '%absolut%' OR
    LOWER(brand) LIKE '%stolichnaya%' OR
    LOWER(brand) LIKE '%jameson%' OR
    LOWER(brand) LIKE '%crown royal%' OR
    LOWER(brand) LIKE '%bacardi%' OR
    LOWER(brand) LIKE '%tanqueray%' OR
    LOWER(brand) LIKE '%jack daniel%'
  );

  -- Premium brands
  UPDATE bottles SET tier_id = premium_tier_id
  WHERE tier_id IS NULL AND (
    LOWER(brand) LIKE '%grey goose%' OR
    LOWER(brand) LIKE '%belvedere%' OR
    LOWER(brand) LIKE '%macallan%' OR
    LOWER(brand) LIKE '%glenfiddich%' OR
    LOWER(brand) LIKE '%johnnie walker black%' OR
    LOWER(brand) LIKE '%hennessy%' OR
    LOWER(brand) LIKE '%patron%'
  );

  -- Super Premium brands
  UPDATE bottles SET tier_id = super_premium_tier_id
  WHERE tier_id IS NULL AND (
    LOWER(brand) LIKE '%johnnie walker blue%' OR
    LOWER(brand) LIKE '%macallan 18%' OR
    LOWER(brand) LIKE '%hennessy paradis%' OR
    LOWER(brand) LIKE '%louis xiii%' OR
    LOWER(brand) LIKE '%clase azul%'
  );

  -- Ultra Premium brands
  UPDATE bottles SET tier_id = ultra_premium_tier_id
  WHERE tier_id IS NULL AND (
    LOWER(brand) LIKE '%macallan 25%' OR
    LOWER(brand) LIKE '%hennessy richard%' OR
    LOWER(brand) LIKE '%johnnie walker blue king george%' OR
    LOWER(brand) LIKE '%tequila ley%'
  );

  -- Default remaining bottles to 'call' tier
  UPDATE bottles SET tier_id = call_tier_id WHERE tier_id IS NULL;

  -- Make tier_id NOT NULL after migration
  ALTER TABLE bottles ALTER COLUMN tier_id SET NOT NULL;
END $$;

-- 8. Update brands with default tiers based on most common tier for each brand
DO $$
DECLARE
  brand_record RECORD;
  most_common_tier_id UUID;
BEGIN
  FOR brand_record IN
    SELECT DISTINCT brand_id FROM bottles WHERE brand_id IS NOT NULL
  LOOP
    -- Find the most common tier for this brand
    SELECT tier_id INTO most_common_tier_id
    FROM bottles
    WHERE brand_id = brand_record.brand_id
      AND tier_id IS NOT NULL
    GROUP BY tier_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Update the brand's default tier
    UPDATE brands
    SET default_tier_id = most_common_tier_id
    WHERE id = brand_record.brand_id;
  END LOOP;
END $$;

-- 9. Create a view for tier statistics (optional, for easy reporting)
CREATE OR REPLACE VIEW tier_inventory_stats AS
SELECT
  t.id as tier_id,
  t.name as tier_name,
  t.display_name as tier_display_name,
  t.sort_order,
  COUNT(b.id) as bottle_count,
  SUM(CAST(b.current_quantity AS DECIMAL) * CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as total_value,
  AVG(CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as average_price
FROM tiers t
LEFT JOIN bottles b ON b.tier_id = t.id AND b.status = 'active'
GROUP BY t.id, t.name, t.display_name, t.sort_order
ORDER BY t.sort_order;

-- 10. Create a view for brand tier distribution (optional)
CREATE OR REPLACE VIEW brand_tier_distribution AS
SELECT
  br.name as brand_name,
  t.display_name as tier_name,
  COUNT(b.id) as bottle_count,
  br.default_tier_id = t.id as is_default_tier
FROM brands br
LEFT JOIN bottles b ON b.brand_id = br.id
LEFT JOIN tiers t ON b.tier_id = t.id
WHERE b.status = 'active'
GROUP BY br.id, br.name, t.id, t.display_name, br.default_tier_id
ORDER BY br.name, t.sort_order;

SELECT 'Tier migration completed successfully!' as status;
```

### Step 2: Create Performance Indexes

Execute these indexes for optimal performance:

```sql
-- Performance Indexes for RFID Bottle Tracking System

-- Core bottle lookup indexes
CREATE INDEX IF NOT EXISTS idx_bottles_rfid_tag ON bottles(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_bottles_organization_id ON bottles(organization_id);
CREATE INDEX IF NOT EXISTS idx_bottles_location_id ON bottles(location_id);
CREATE INDEX IF NOT EXISTS idx_bottles_status ON bottles(status);

-- Brand and product relationship indexes
CREATE INDEX IF NOT EXISTS idx_bottles_brand_id ON bottles(brand_id);
CREATE INDEX IF NOT EXISTS idx_bottles_product_name_id ON bottles(product_name_id);
CREATE INDEX IF NOT EXISTS idx_product_names_brand_id ON product_names(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_product_names_name ON product_names(name);

-- Tier-based indexes
CREATE INDEX IF NOT EXISTS idx_bottles_tier_id ON bottles(tier_id);
CREATE INDEX IF NOT EXISTS idx_brands_default_tier_id ON brands(default_tier_id);
CREATE INDEX IF NOT EXISTS idx_bottles_brand_tier ON bottles(brand_id, tier_id) WHERE tier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tiers_sort_order ON tiers(sort_order);

-- Multi-tenant composite indexes
CREATE INDEX IF NOT EXISTS idx_bottles_organization_brand ON bottles(organization_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_bottles_organization_location ON bottles(organization_id, location_id);
CREATE INDEX IF NOT EXISTS idx_bottles_organization_status ON bottles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_bottles_organization_tier ON bottles(organization_id, tier_id);

-- Time-series and audit indexes
CREATE INDEX IF NOT EXISTS idx_bottles_last_scanned ON bottles(last_scanned);
CREATE INDEX IF NOT EXISTS idx_bottles_created_at ON bottles(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON activity_logs(resource_type);

-- Scan session indexes
CREATE INDEX IF NOT EXISTS idx_scan_sessions_organization_id ON scan_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_location_id ON scan_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_started_at ON scan_sessions(started_at);

-- Profile and organization indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Legacy search functionality (temporary during migration)
CREATE INDEX IF NOT EXISTS idx_bottles_search ON bottles(brand, product, rfid_tag);

-- Full-text search indexes (optional - for advanced search features)
CREATE INDEX IF NOT EXISTS idx_brands_name_gin ON brands USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_product_names_name_gin ON product_names USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_bottles_legacy_gin ON bottles USING gin(to_tsvector('english', brand || ' ' || product));

-- Unique constraint indexes (ensure data integrity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bottles_rfid_unique ON bottles(rfid_tag);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name_unique ON brands(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_unique ON organizations(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tiers_name_unique ON tiers(name);

SELECT 'Performance indexes created successfully!' as status;
```

### Step 3: Create Row Level Security (RLS) Policies

Execute these RLS policies to enforce multi-tenant data isolation:

```sql
-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations table policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can view all organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Organization admins can view org profiles" ON profiles
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

CREATE POLICY "Organization admins can manage org profiles" ON profiles
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin')
    )
  );

-- Locations table policies
CREATE POLICY "Organization members can view locations" ON locations
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can manage locations" ON locations
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Bottles table policies
CREATE POLICY "Organization members can view bottles" ON bottles
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create bottles" ON bottles
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update bottles" ON bottles
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can delete bottles" ON bottles
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Brands table policies (global but organization-scoped access)
CREATE POLICY "All authenticated users can view brands" ON brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update brands" ON brands
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Product names table policies
CREATE POLICY "All authenticated users can view product names" ON product_names
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create product names" ON product_names
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update product names" ON product_names
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Tiers table policies (read-only for most users)
CREATE POLICY "All authenticated users can view tiers" ON tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage tiers" ON tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Scan sessions table policies
CREATE POLICY "Organization members can view scan sessions" ON scan_sessions
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create scan sessions" ON scan_sessions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Staff can update their own scan sessions" ON scan_sessions
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- Activity logs table policies
CREATE POLICY "Organization members can view activity logs" ON activity_logs
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

SELECT 'RLS policies created successfully!' as status;
```

### Step 4: Create Additional Database Functions

```sql
-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

-- Function to check if user has required role
CREATE OR REPLACE FUNCTION user_has_role(required_role text)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (
      role = required_role OR
      (required_role = 'staff' AND role IN ('manager', 'company_admin', 'super_admin')) OR
      (required_role = 'manager' AND role IN ('company_admin', 'super_admin')) OR
      (required_role = 'company_admin' AND role = 'super_admin')
    )
  );
$$;

-- Function to safely create RFID scans
CREATE OR REPLACE FUNCTION create_rfid_scan(
  rfid_tag_param TEXT,
  location_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bottle_id UUID;
  org_id UUID;
BEGIN
  -- Get user's organization
  SELECT get_user_organization_id() INTO org_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any organization';
  END IF;

  -- Find or create bottle
  SELECT id INTO bottle_id
  FROM bottles
  WHERE rfid_tag = rfid_tag_param
    AND organization_id = org_id;

  IF bottle_id IS NOT NULL THEN
    -- Update existing bottle location and scan time
    UPDATE bottles
    SET location_id = location_id_param,
        last_scanned = NOW()
    WHERE id = bottle_id;

    -- Log the scan activity
    INSERT INTO activity_logs (
      organization_id,
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      org_id,
      auth.uid(),
      'scanned',
      'bottle',
      bottle_id,
      jsonb_build_object('rfid_tag', rfid_tag_param, 'location_id', location_id_param)
    );
  END IF;

  RETURN bottle_id;
END;
$$;

SELECT 'Database functions created successfully!' as status;
```

## Production Environment Configuration Checklist

### Supabase Project Settings

1. **Database Configuration**
   - [ ] Enable connection pooling (recommended: Transaction mode)
   - [ ] Set shared_preload_libraries = 'pg_cron' (if using scheduled jobs)
   - [ ] Configure max_connections appropriately (default: 100)
   - [ ] Enable log_statement = 'all' for debugging (temporarily)

2. **Authentication Settings**
   - [ ] Configure JWT expiry (recommended: 1 hour)
   - [ ] Enable email confirmation for new users
   - [ ] Set up proper redirect URLs for your domain
   - [ ] Configure password requirements

3. **API Settings**
   - [ ] Set appropriate rate limiting
   - [ ] Configure CORS for your domain
   - [ ] Enable real-time subscriptions
   - [ ] Set max_rows per request (recommended: 1000)

### Environment Variables

Add to your production environment:

```bash
# Required
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional but recommended
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn (for error tracking)
```

### Security Checklist

1. **Database Security**
   - [ ] All RLS policies enabled and tested
   - [ ] Service role key secured (never expose to frontend)
   - [ ] Database backups enabled
   - [ ] SSL connections enforced

2. **Application Security**
   - [ ] HTTPS enforced in production
   - [ ] Content Security Policy configured
   - [ ] API keys properly secured
   - [ ] Error messages don't expose sensitive data

## Database Backup and Monitoring Setup

### Automated Backups

Supabase provides automatic backups, but for additional safety:

```sql
-- Create a backup function (run weekly)
CREATE OR REPLACE FUNCTION create_data_backup()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Export critical tables to backup schema
  CREATE SCHEMA IF NOT EXISTS backup_$(date +%Y%m%d);

  -- Backup critical tables
  EXECUTE format('CREATE TABLE backup_%s.organizations AS SELECT * FROM organizations',
                 to_char(now(), 'YYYYMMDD'));
  EXECUTE format('CREATE TABLE backup_%s.bottles AS SELECT * FROM bottles',
                 to_char(now(), 'YYYYMMDD'));
  EXECUTE format('CREATE TABLE backup_%s.profiles AS SELECT * FROM profiles',
                 to_char(now(), 'YYYYMMDD'));
  EXECUTE format('CREATE TABLE backup_%s.locations AS SELECT * FROM locations',
                 to_char(now(), 'YYYYMMDD'));

  -- Log backup completion
  INSERT INTO activity_logs (organization_id, user_id, action, resource_type, metadata)
  VALUES (
    NULL,
    NULL,
    'system_backup',
    'database',
    jsonb_build_object('backup_date', now(), 'status', 'completed')
  );
END;
$$;
```

### Monitoring Queries

Add these monitoring views for production oversight:

```sql
-- System health monitoring
CREATE OR REPLACE VIEW system_health AS
SELECT
  'bottles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) FILTER (WHERE status = 'active') as active_records
FROM bottles
UNION ALL
SELECT
  'scan_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as active_records
FROM scan_sessions
UNION ALL
SELECT
  'activity_logs' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) as active_records
FROM activity_logs;

-- Performance monitoring
CREATE OR REPLACE VIEW performance_stats AS
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

## Post-Deployment Verification

After deployment, run these verification queries:

```sql
-- Verify tier migration
SELECT
  t.display_name,
  COUNT(b.id) as bottle_count,
  AVG(CAST(b.retail_price AS DECIMAL)) as avg_price
FROM tiers t
LEFT JOIN bottles b ON b.tier_id = t.id
GROUP BY t.id, t.display_name, t.sort_order
ORDER BY t.sort_order;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check database size and performance
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  (SELECT COUNT(*) FROM bottles) as total_bottles,
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM profiles) as total_users;
```

## Troubleshooting

### Common Issues

1. **RLS Policy Conflicts**
   ```sql
   -- Check for policy conflicts
   SELECT * FROM pg_policies WHERE schemaname = 'public';

   -- Disable RLS temporarily for debugging
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

2. **Performance Issues**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;

   -- Analyze table statistics
   ANALYZE bottles;
   ANALYZE brands;
   ANALYZE product_names;
   ```

3. **Index Usage**
   ```sql
   -- Check index usage
   SELECT
     schemaname,
     tablename,
     attname,
     n_distinct,
     correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   ORDER BY tablename, attname;
   ```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review performance stats
   - Check error logs
   - Verify backup completion

2. **Monthly**
   - Analyze query performance
   - Review storage usage
   - Update database statistics

3. **Quarterly**
   - Review and optimize indexes
   - Assess RLS policy effectiveness
   - Plan capacity scaling

### Emergency Contacts

- **Database Issues**: Check Supabase dashboard and status page
- **Performance Issues**: Use built-in monitoring views
- **Security Issues**: Review activity logs and RLS policies

---

**Deployment Complete!** Your 8Ball RFID system is now ready for production use with:
- ✅ Complete tier classification system
- ✅ Performance-optimized indexes
- ✅ Multi-tenant Row Level Security
- ✅ Monitoring and backup procedures