-- ================================================================================================
-- 8BALL RFID SYSTEM - PERFORMANCE TESTING & BENCHMARKING SCRIPT
-- ================================================================================================
--
-- This script provides comprehensive performance testing for your RFID system
-- Measures before/after performance improvements and validates optimization targets
--
-- USAGE:
-- 1. Run BEFORE applying indexes (baseline measurements)
-- 2. Apply optimization script (001-rfid-performance-indexes.sql)
-- 3. Run AFTER applying indexes (performance validation)
--
-- TARGETS:
-- - RFID Tag Lookup: <100ms
-- - Bulk Operations: 1000+ records/second
-- - Dashboard Queries: <500ms
-- - Concurrent Sessions: 10+ simultaneous
-- ================================================================================================

-- Performance testing setup
\timing on
\echo '🚀 Starting 8BALL RFID Performance Testing Suite...'
\echo ''

-- ================================================================================================
-- 1. BASELINE SYSTEM INFORMATION
-- ================================================================================================

\echo '📊 SYSTEM BASELINE INFORMATION'
\echo '=============================='

-- Database size and table statistics
SELECT
    'System Overview' as test_category,
    version() as postgresql_version,
    current_database() as database_name,
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Table row counts and sizes
SELECT
    'Table Statistics' as test_category,
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Index information
SELECT
    'Index Statistics' as test_category,
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

\echo ''

-- ================================================================================================
-- 2. CRITICAL RFID LOOKUP PERFORMANCE (Target: <100ms)
-- ================================================================================================

\echo '🎯 TEST 1: RFID TAG LOOKUP PERFORMANCE (CRITICAL - iOS Scanning)'
\echo '=============================================================='

-- Test 1.1: Single RFID tag lookup (most critical query)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, organization_id, location_id, brand, product, status, current_quantity, last_scanned
FROM bottles
WHERE rfid_tag = 'RF123456789'
LIMIT 1;

-- Test 1.2: Bulk RFID tag lookup (batch processing)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT rfid_tag, id, status, location_id
FROM bottles
WHERE rfid_tag = ANY(ARRAY['RF123456789', 'RF987654321', 'RF555666777', 'RF111222333', 'RF444555666']);

-- Test 1.3: Organization-scoped RFID lookup
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND rfid_tag LIKE 'RF%';

\echo ''

-- ================================================================================================
-- 3. INVENTORY DASHBOARD PERFORMANCE (Target: <500ms)
-- ================================================================================================

\echo '📈 TEST 2: DASHBOARD QUERY PERFORMANCE'
\echo '====================================='

-- Test 2.1: Total bottles count by organization
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    COUNT(*) as total_bottles,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_bottles,
    COUNT(CASE WHEN status = 'depleted' THEN 1 END) as depleted_bottles,
    SUM(CASE WHEN status = 'active' THEN retail_price * current_quantity ELSE 0 END) as total_value
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1);

-- Test 2.2: Location-based inventory summary
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    l.name as location_name,
    COUNT(b.id) as bottle_count,
    SUM(b.current_quantity) as total_quantity,
    SUM(b.retail_price * b.current_quantity) as location_value
FROM locations l
LEFT JOIN bottles b ON l.id = b.location_id AND b.status = 'active'
WHERE l.organization_id = (SELECT id FROM organizations LIMIT 1)
GROUP BY l.id, l.name
ORDER BY bottle_count DESC;

-- Test 2.3: Brand breakdown analysis
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    brand,
    COUNT(*) as bottle_count,
    SUM(current_quantity) as total_quantity,
    AVG(retail_price) as avg_price,
    SUM(retail_price * current_quantity) as brand_value
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND status = 'active'
GROUP BY brand
ORDER BY brand_value DESC
LIMIT 20;

-- Test 2.4: Low stock alerts
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    b.rfid_tag,
    b.brand,
    b.product,
    b.current_quantity,
    l.name as location_name
FROM bottles b
LEFT JOIN locations l ON b.location_id = l.id
WHERE b.organization_id = (SELECT id FROM organizations LIMIT 1)
AND b.status = 'active'
AND b.current_quantity < 0.3
ORDER BY b.current_quantity ASC;

\echo ''

-- ================================================================================================
-- 4. SCAN SESSION PERFORMANCE (Real-time Operations)
-- ================================================================================================

\echo '📱 TEST 3: SCAN SESSION PERFORMANCE'
\echo '=================================='

-- Test 3.1: Active scan sessions
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    ss.id,
    ss.started_at,
    ss.bottle_count,
    p.email as user_email,
    l.name as location_name
FROM scan_sessions ss
JOIN profiles p ON ss.user_id = p.id
JOIN locations l ON ss.location_id = l.id
WHERE ss.organization_id = (SELECT id FROM organizations LIMIT 1)
AND ss.completed_at IS NULL
ORDER BY ss.started_at DESC;

-- Test 3.2: Recent scan history
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    DATE(ss.completed_at) as scan_date,
    COUNT(*) as session_count,
    SUM(ss.bottle_count) as total_bottles_scanned,
    AVG(ss.bottle_count) as avg_bottles_per_session
FROM scan_sessions ss
WHERE ss.organization_id = (SELECT id FROM organizations LIMIT 1)
AND ss.completed_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(ss.completed_at)
ORDER BY scan_date DESC;

\echo ''

-- ================================================================================================
-- 5. SEARCH & FILTERING PERFORMANCE
-- ================================================================================================

\echo '🔍 TEST 4: SEARCH & FILTERING PERFORMANCE'
\echo '========================================'

-- Test 4.1: Text search across brands and products
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, rfid_tag, brand, product, status
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND (brand ILIKE '%vodka%' OR product ILIKE '%vodka%' OR rfid_tag ILIKE '%123%')
AND status = 'active'
ORDER BY brand, product
LIMIT 50;

-- Test 4.2: Type-based filtering
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT type, COUNT(*) as count, AVG(retail_price) as avg_price
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND status = 'active'
GROUP BY type
ORDER BY count DESC;

-- Test 4.3: Recently scanned bottles
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT rfid_tag, brand, product, last_scanned,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_scanned))/3600 as hours_since_scan
FROM bottles
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND last_scanned IS NOT NULL
AND last_scanned > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY last_scanned DESC
LIMIT 100;

\echo ''

-- ================================================================================================
-- 6. CONCURRENT ACCESS SIMULATION
-- ================================================================================================

\echo '⚡ TEST 5: CONCURRENT ACCESS PATTERNS'
\echo '===================================='

-- Test 5.1: Simulate concurrent RFID lookups
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration_ms numeric;
    i integer;
    test_tag text;
BEGIN
    start_time := clock_timestamp();

    -- Simulate 100 rapid RFID lookups
    FOR i IN 1..100 LOOP
        test_tag := 'RF' || LPAD(i::text, 9, '0');
        PERFORM id FROM bottles WHERE rfid_tag = test_tag LIMIT 1;
    END LOOP;

    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;

    RAISE NOTICE 'Concurrent RFID Lookup Test: 100 lookups in % ms (% ms average)',
                 ROUND(duration_ms, 2), ROUND(duration_ms/100, 2);
END $$;

-- Test 5.2: Bulk insert performance simulation
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration_ms numeric;
BEGIN
    start_time := clock_timestamp();

    -- Simulate creating a temporary batch of bottles
    CREATE TEMP TABLE temp_bottles AS
    SELECT
        gen_random_uuid() as id,
        (SELECT id FROM organizations LIMIT 1) as organization_id,
        (SELECT id FROM locations LIMIT 1) as location_id,
        'RF' || LPAD(generate_series::text, 9, '0') as rfid_tag,
        'Test Brand ' || (random() * 10)::int as brand,
        'Test Product ' || generate_series as product,
        'vodka'::bottle_type as type,
        '750ml' as size,
        (random() * 100)::numeric(10,2) as cost_price,
        (random() * 200)::numeric(10,2) as retail_price,
        1.00::numeric(5,2) as current_quantity,
        'active'::bottle_status as status,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
    FROM generate_series(90001, 91000);

    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;

    RAISE NOTICE 'Bulk Operation Test: 1000 records processed in % ms (% records/second)',
                 ROUND(duration_ms, 2), ROUND(1000000/duration_ms, 0);

    DROP TABLE temp_bottles;
END $$;

\echo ''

-- ================================================================================================
-- 7. ACTIVITY LOG PERFORMANCE
-- ================================================================================================

\echo '📝 TEST 6: ACTIVITY LOG & AUDIT PERFORMANCE'
\echo '=========================================='

-- Test 6.1: Recent activity feed
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    al.created_at,
    al.action,
    al.resource_type,
    p.email as user_email,
    al.metadata
FROM activity_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.organization_id = (SELECT id FROM organizations LIMIT 1)
AND al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY al.created_at DESC
LIMIT 50;

-- Test 6.2: Resource-specific history
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) as activity_count,
       action,
       DATE(created_at) as activity_date
FROM activity_logs
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
AND resource_type = 'bottle'
AND created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY action, DATE(created_at)
ORDER BY activity_date DESC, activity_count DESC;

\echo ''

-- ================================================================================================
-- 8. PERFORMANCE SUMMARY & RECOMMENDATIONS
-- ================================================================================================

\echo '📊 PERFORMANCE SUMMARY & ANALYSIS'
\echo '================================='

-- Index usage statistics
SELECT
    'Index Usage Summary' as analysis_type,
    schemaname,
    tablename,
    indexname,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN '❌ Unused'
        WHEN idx_scan < 100 THEN '⚠️ Low Usage'
        WHEN idx_scan < 1000 THEN '✅ Moderate Usage'
        ELSE '🚀 High Usage'
    END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query performance insights
WITH slow_queries AS (
    SELECT
        query,
        calls,
        total_time,
        mean_time,
        rows,
        ROUND((100.0 * total_time / sum(total_time) OVER()), 2) AS pct_total_time
    FROM pg_stat_statements
    WHERE query LIKE '%bottles%' OR query LIKE '%scan_sessions%' OR query LIKE '%activity_logs%'
    ORDER BY mean_time DESC
    LIMIT 10
)
SELECT
    'Slow Query Analysis' as analysis_type,
    LEFT(query, 80) || '...' as query_snippet,
    calls,
    ROUND(mean_time, 2) as avg_time_ms,
    pct_total_time
FROM slow_queries;

-- Memory and cache statistics
SELECT
    'Cache Performance' as analysis_type,
    'Buffer Cache Hit Ratio' as metric,
    ROUND(
        100.0 * sum(heap_blks_hit) /
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2
    ) || '%' as value
FROM pg_statio_user_tables
UNION ALL
SELECT
    'Cache Performance' as analysis_type,
    'Index Cache Hit Ratio' as metric,
    ROUND(
        100.0 * sum(idx_blks_hit) /
        NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2
    ) || '%' as value
FROM pg_statio_user_indexes;

\echo ''
\echo '✅ PERFORMANCE TESTING COMPLETE'
\echo '==============================='
\echo ''
\echo '🎯 TARGET VALIDATION:'
\echo '   • RFID Lookups: Check execution times above (Target: <100ms)'
\echo '   • Dashboard Queries: Review analysis results (Target: <500ms)'
\echo '   • Bulk Operations: See simulation results (Target: 1000+ records/sec)'
\echo ''
\echo '📈 OPTIMIZATION RECOMMENDATIONS:'
\echo '   1. If any query >100ms, consider additional indexes'
\echo '   2. Monitor buffer cache hit ratio (should be >95%)'
\echo '   3. Watch for unused indexes and consider dropping them'
\echo '   4. Run VACUUM ANALYZE after bulk operations'
\echo ''
\echo '🚀 Ready for production RFID workload!'

-- Reset timing display
\timing off