-- Fix activity_logs table schema
-- Add missing columns and update existing records
-- Based on schema: id, organization_id, user_id, action, resource_type, resource_id, metadata, created_at

-- Add the resource_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activity_logs'
                   AND column_name = 'resource_type') THEN
        ALTER TABLE activity_logs ADD COLUMN resource_type TEXT NOT NULL DEFAULT 'bottle';
    END IF;
END $$;

-- Add the resource_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activity_logs'
                   AND column_name = 'resource_id') THEN
        ALTER TABLE activity_logs ADD COLUMN resource_id UUID;
    END IF;
END $$;

-- Add the metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'activity_logs'
                   AND column_name = 'metadata') THEN
        ALTER TABLE activity_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update existing records with appropriate resource_type values
UPDATE activity_logs
SET resource_type = CASE
    WHEN action LIKE '%bulk_inventory%' THEN 'bottles'
    WHEN action LIKE '%scan_session%' THEN 'scan_session'
    WHEN action LIKE '%bottle%' THEN 'bottle'
    ELSE 'bottle'  -- default fallback
END
WHERE resource_type IS NULL;

-- Verify the changes
SELECT
    resource_type,
    COUNT(*) as count
FROM activity_logs
GROUP BY resource_type
ORDER BY count DESC;