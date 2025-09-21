-- Database Backup Script - Execute BEFORE running tier migration
-- This creates a backup schema with current data

-- Create backup schema with timestamp
CREATE SCHEMA IF NOT EXISTS backup_20250120;

-- Backup critical tables
CREATE TABLE backup_20250120.organizations AS SELECT * FROM organizations;
CREATE TABLE backup_20250120.profiles AS SELECT * FROM profiles;
CREATE TABLE backup_20250120.locations AS SELECT * FROM locations;
CREATE TABLE backup_20250120.bottles AS SELECT * FROM bottles;
CREATE TABLE backup_20250120.brands AS SELECT * FROM brands;
CREATE TABLE backup_20250120.product_names AS SELECT * FROM product_names;
CREATE TABLE backup_20250120.scan_sessions AS SELECT * FROM scan_sessions;
CREATE TABLE backup_20250120.activity_logs AS SELECT * FROM activity_logs;

-- Backup existing enums and types (just for reference)
CREATE TABLE backup_20250120.enum_info AS
SELECT
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'bottle_status', 'bottle_type');

-- Create backup metadata
CREATE TABLE backup_20250120.backup_metadata AS
SELECT
  NOW() as backup_created,
  'Pre-tier-migration backup' as description,
  current_database() as database_name,
  current_user as backup_user,
  (SELECT COUNT(*) FROM bottles) as bottles_count,
  (SELECT COUNT(*) FROM organizations) as orgs_count,
  (SELECT COUNT(*) FROM profiles) as users_count,
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Verify backup
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'backup_20250120'
ORDER BY tablename;

SELECT 'Backup completed successfully! Schema: backup_20250120' as status;