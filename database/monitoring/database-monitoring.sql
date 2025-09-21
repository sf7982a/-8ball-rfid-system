-- Database Monitoring and Health Checks for 8Ball RFID System
-- Execute this script to set up monitoring views and functions

-- System health monitoring view
CREATE OR REPLACE VIEW system_health AS
SELECT
  'bottles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) FILTER (WHERE status = 'active') as active_records,
  COUNT(*) FILTER (WHERE last_scanned > NOW() - INTERVAL '24 hours') as scanned_last_24h
FROM bottles
UNION ALL
SELECT
  'scan_sessions' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as active_records,
  COUNT(*) FILTER (WHERE completed_at > NOW() - INTERVAL '24 hours') as scanned_last_24h
FROM scan_sessions
UNION ALL
SELECT
  'activity_logs' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) as active_records,
  0 as scanned_last_24h
FROM activity_logs
UNION ALL
SELECT
  'organizations' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) as active_records,
  0 as scanned_last_24h
FROM organizations
UNION ALL
SELECT
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
  COUNT(*) as active_records,
  0 as scanned_last_24h
FROM profiles;

-- Performance monitoring view
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

-- Index usage monitoring
CREATE OR REPLACE VIEW index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  idx_scan::float / GREATEST(idx_tup_read::float, 1) as efficiency_ratio
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Database size monitoring
CREATE OR REPLACE VIEW database_size_stats AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes_total
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- RFID scanning activity monitoring
CREATE OR REPLACE VIEW rfid_activity_stats AS
SELECT
  DATE_TRUNC('hour', last_scanned) as scan_hour,
  COUNT(*) as scans_count,
  COUNT(DISTINCT location_id) as unique_locations,
  COUNT(DISTINCT brand_id) as unique_brands,
  COUNT(DISTINCT tier_id) as unique_tiers
FROM bottles
WHERE last_scanned > NOW() - INTERVAL '7 days'
  AND last_scanned IS NOT NULL
GROUP BY DATE_TRUNC('hour', last_scanned)
ORDER BY scan_hour DESC;

-- Organization activity summary
CREATE OR REPLACE VIEW organization_activity AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  COUNT(DISTINCT b.id) as total_bottles,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'active') as active_bottles,
  COUNT(DISTINCT b.id) FILTER (WHERE b.last_scanned > NOW() - INTERVAL '24 hours') as scanned_last_24h,
  COUNT(DISTINCT l.id) as total_locations,
  COUNT(DISTINCT p.id) as total_users,
  MAX(b.last_scanned) as last_scan_time,
  SUM(CAST(b.current_quantity AS DECIMAL) * CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as total_inventory_value
FROM organizations o
LEFT JOIN bottles b ON b.organization_id = o.id
LEFT JOIN locations l ON l.organization_id = o.id
LEFT JOIN profiles p ON p.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY total_bottles DESC;

-- Tier distribution analysis
CREATE OR REPLACE VIEW tier_distribution_analysis AS
SELECT
  o.name as organization_name,
  t.display_name as tier_name,
  COUNT(b.id) as bottle_count,
  ROUND(COUNT(b.id) * 100.0 / SUM(COUNT(b.id)) OVER (PARTITION BY o.id), 2) as percentage,
  SUM(CAST(b.current_quantity AS DECIMAL) * CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as tier_value,
  AVG(CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as avg_price
FROM organizations o
JOIN bottles b ON b.organization_id = o.id
JOIN tiers t ON t.id = b.tier_id
WHERE b.status = 'active'
GROUP BY o.id, o.name, t.id, t.display_name, t.sort_order
ORDER BY o.name, t.sort_order;

-- Error and anomaly detection
CREATE OR REPLACE VIEW data_anomalies AS
-- Bottles without RFID tags
SELECT
  'missing_rfid_tag' as anomaly_type,
  COUNT(*) as count,
  'Bottles without RFID tags' as description
FROM bottles
WHERE rfid_tag IS NULL OR rfid_tag = ''
UNION ALL
-- Bottles with duplicate RFID tags
SELECT
  'duplicate_rfid_tags' as anomaly_type,
  COUNT(*) as count,
  'Duplicate RFID tags found' as description
FROM (
  SELECT rfid_tag
  FROM bottles
  WHERE rfid_tag IS NOT NULL
  GROUP BY rfid_tag
  HAVING COUNT(*) > 1
) duplicates
UNION ALL
-- Bottles without tier assignment
SELECT
  'missing_tier' as anomaly_type,
  COUNT(*) as count,
  'Bottles without tier assignment' as description
FROM bottles
WHERE tier_id IS NULL
UNION ALL
-- Bottles with invalid prices
SELECT
  'invalid_prices' as anomaly_type,
  COUNT(*) as count,
  'Bottles with negative or zero prices' as description
FROM bottles
WHERE CAST(COALESCE(retail_price, '0') AS DECIMAL) <= 0
  AND status = 'active'
UNION ALL
-- Orphaned scan sessions
SELECT
  'orphaned_scan_sessions' as anomaly_type,
  COUNT(*) as count,
  'Scan sessions without completion time older than 24h' as description
FROM scan_sessions
WHERE completed_at IS NULL
  AND started_at < NOW() - INTERVAL '24 hours';

-- Function to create daily backup metadata
CREATE OR REPLACE FUNCTION create_backup_metadata()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  backup_info jsonb;
BEGIN
  SELECT jsonb_build_object(
    'backup_date', NOW(),
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'total_bottles', (SELECT COUNT(*) FROM bottles),
    'total_organizations', (SELECT COUNT(*) FROM organizations),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_bottles', (SELECT COUNT(*) FROM bottles WHERE status = 'active'),
    'last_24h_scans', (SELECT COUNT(*) FROM bottles WHERE last_scanned > NOW() - INTERVAL '24 hours'),
    'tier_distribution', (
      SELECT jsonb_object_agg(
        t.display_name,
        COUNT(b.id)
      )
      FROM tiers t
      LEFT JOIN bottles b ON b.tier_id = t.id AND b.status = 'active'
      GROUP BY t.id, t.display_name
    )
  ) INTO backup_info;

  RETURN backup_info;
END;
$$;

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  value TEXT,
  threshold TEXT,
  is_healthy BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Database Size'::text as check_name,
    'INFO'::text as status,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'N/A'::text as threshold,
    TRUE as is_healthy
  UNION ALL
  SELECT
    'Active Bottles'::text,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'WARNING' END as status,
    COUNT(*)::text as value,
    '> 0'::text as threshold,
    COUNT(*) > 0 as is_healthy
  FROM bottles WHERE status = 'active'
  UNION ALL
  SELECT
    'Recent Scans (24h)'::text,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'INFO' END as status,
    COUNT(*)::text as value,
    '> 0 recommended'::text as threshold,
    TRUE as is_healthy  -- Not critical
  FROM bottles WHERE last_scanned > NOW() - INTERVAL '24 hours'
  UNION ALL
  SELECT
    'Data Anomalies'::text,
    CASE WHEN SUM(count) = 0 THEN 'OK' ELSE 'WARNING' END as status,
    SUM(count)::text as value,
    '0'::text as threshold,
    SUM(count) = 0 as is_healthy
  FROM data_anomalies
  UNION ALL
  SELECT
    'Organizations'::text,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ERROR' END as status,
    COUNT(*)::text as value,
    '> 0'::text as threshold,
    COUNT(*) > 0 as is_healthy
  FROM organizations;
END;
$$;

-- Function to generate daily report
CREATE OR REPLACE FUNCTION generate_daily_report()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'report_date', CURRENT_DATE,
    'generated_at', NOW(),
    'system_health', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'check', check_name,
          'status', status,
          'value', value,
          'healthy', is_healthy
        )
      )
      FROM check_system_health()
    ),
    'activity_summary', (
      SELECT jsonb_build_object(
        'total_bottles', COUNT(*),
        'active_bottles', COUNT(*) FILTER (WHERE status = 'active'),
        'scans_last_24h', COUNT(*) FILTER (WHERE last_scanned > NOW() - INTERVAL '24 hours'),
        'new_bottles_today', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE)
      )
      FROM bottles
    ),
    'tier_stats', (
      SELECT jsonb_object_agg(
        tier_display_name,
        jsonb_build_object(
          'bottle_count', bottle_count,
          'total_value', total_value,
          'average_price', average_price
        )
      )
      FROM tier_inventory_stats
    ),
    'top_organizations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', organization_name,
          'bottles', total_bottles,
          'value', total_inventory_value,
          'last_scan', last_scan_time
        )
      )
      FROM (
        SELECT * FROM organization_activity
        ORDER BY total_bottles DESC
        LIMIT 10
      ) top_orgs
    ),
    'anomalies', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', anomaly_type,
          'count', count,
          'description', description
        )
      )
      FROM data_anomalies
      WHERE count > 0
    )
  ) INTO report;

  -- Store the report in activity logs for audit purposes
  INSERT INTO activity_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    metadata
  ) VALUES (
    NULL,  -- System-level report
    NULL,  -- System user
    'daily_report_generated',
    'system',
    report
  );

  RETURN report;
END;
$$;

-- Create indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_bottles_last_scanned_24h ON bottles(last_scanned)
  WHERE last_scanned > NOW() - INTERVAL '24 hours';

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_date ON activity_logs(DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_scan_sessions_completion ON scan_sessions(completed_at, started_at);

SELECT 'Database monitoring setup completed successfully!' as status;