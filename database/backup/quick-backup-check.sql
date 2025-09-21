-- Quick backup verification - Run this BEFORE migration
-- This shows you what data exists and will be migrated

-- Current database state summary
SELECT 'CURRENT DATABASE STATE' as info;

-- Table row counts
SELECT
  'bottles' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE tier_id IS NOT NULL) as has_tier_id,
  COUNT(*) FILTER (WHERE brand_id IS NOT NULL) as has_brand_id,
  COUNT(*) FILTER (WHERE product_name_id IS NOT NULL) as has_product_name_id
FROM bottles
UNION ALL
SELECT
  'brands' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE default_tier_id IS NOT NULL) as has_tier_id,
  0 as has_brand_id,
  0 as has_product_name_id
FROM brands
UNION ALL
SELECT
  'organizations' as table_name,
  COUNT(*) as total_rows,
  0, 0, 0
FROM organizations
UNION ALL
SELECT
  'profiles' as table_name,
  COUNT(*) as total_rows,
  0, 0, 0
FROM profiles;

-- Check if tier system already exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tiers')
    THEN 'Tiers table EXISTS - migration may be partial update'
    ELSE 'Tiers table MISSING - fresh migration'
  END as tier_table_status;

-- Check current brand distribution (for migration reference)
SELECT
  brand,
  COUNT(*) as bottle_count,
  COUNT(DISTINCT product) as unique_products
FROM bottles
GROUP BY brand
ORDER BY bottle_count DESC
LIMIT 20;

-- Database size before migration
SELECT
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  NOW() as checked_at;

SELECT 'Pre-migration check complete!' as status;