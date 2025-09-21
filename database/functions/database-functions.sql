-- Database Functions for 8Ball RFID System
-- Execute this script in Supabase SQL Editor after RLS policies are in place

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

-- Function to create bottles with proper validation
CREATE OR REPLACE FUNCTION create_bottle_with_validation(
  rfid_tag_param TEXT,
  brand_param TEXT,
  product_param TEXT,
  brand_id_param UUID,
  product_name_id_param UUID,
  tier_id_param UUID,
  type_param TEXT,
  size_param TEXT,
  cost_price_param DECIMAL DEFAULT NULL,
  retail_price_param DECIMAL DEFAULT NULL,
  location_id_param UUID DEFAULT NULL
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

  -- Validate RFID tag is unique within organization
  IF EXISTS (SELECT 1 FROM bottles WHERE rfid_tag = rfid_tag_param AND organization_id = org_id) THEN
    RAISE EXCEPTION 'RFID tag already exists in this organization';
  END IF;

  -- Create the bottle
  INSERT INTO bottles (
    organization_id,
    location_id,
    rfid_tag,
    brand,
    product,
    brand_id,
    product_name_id,
    tier_id,
    type,
    size,
    cost_price,
    retail_price,
    current_quantity,
    status,
    last_scanned
  ) VALUES (
    org_id,
    location_id_param,
    rfid_tag_param,
    brand_param,
    product_param,
    brand_id_param,
    product_name_id_param,
    tier_id_param,
    type_param::bottle_type,
    size_param,
    cost_price_param,
    retail_price_param,
    1.00,
    'active',
    NOW()
  ) RETURNING id INTO bottle_id;

  -- Log the creation activity
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
    'created',
    'bottle',
    bottle_id,
    jsonb_build_object(
      'rfid_tag', rfid_tag_param,
      'brand', brand_param,
      'product', product_param,
      'tier_id', tier_id_param
    )
  );

  RETURN bottle_id;
END;
$$;

-- Function to update bottle tier with learning system
CREATE OR REPLACE FUNCTION update_bottle_tier(
  bottle_id_param UUID,
  new_tier_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  bottle_brand_id UUID;
  old_tier_id UUID;
BEGIN
  -- Get user's organization
  SELECT get_user_organization_id() INTO org_id;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'User not associated with any organization';
  END IF;

  -- Get bottle details and verify ownership
  SELECT brand_id, tier_id INTO bottle_brand_id, old_tier_id
  FROM bottles
  WHERE id = bottle_id_param
    AND organization_id = org_id;

  IF bottle_brand_id IS NULL THEN
    RAISE EXCEPTION 'Bottle not found or access denied';
  END IF;

  -- Update bottle tier
  UPDATE bottles
  SET tier_id = new_tier_id,
      updated_at = NOW()
  WHERE id = bottle_id_param;

  -- Update brand default tier if this is an override
  IF old_tier_id != new_tier_id AND bottle_brand_id IS NOT NULL THEN
    -- Check if this tier is becoming more common for this brand
    IF (
      SELECT COUNT(*)
      FROM bottles
      WHERE brand_id = bottle_brand_id
        AND tier_id = new_tier_id
        AND organization_id = org_id
    ) > (
      SELECT COUNT(*)
      FROM bottles
      WHERE brand_id = bottle_brand_id
        AND tier_id = old_tier_id
        AND organization_id = org_id
    ) THEN
      -- Update brand default tier
      UPDATE brands
      SET default_tier_id = new_tier_id
      WHERE id = bottle_brand_id;
    END IF;
  END IF;

  -- Log the tier change
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
    'tier_updated',
    'bottle',
    bottle_id_param,
    jsonb_build_object(
      'old_tier_id', old_tier_id,
      'new_tier_id', new_tier_id,
      'brand_id', bottle_brand_id
    )
  );

  RETURN TRUE;
END;
$$;

-- Function to get tier statistics for organization
CREATE OR REPLACE FUNCTION get_tier_stats(org_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  tier_display_name TEXT,
  sort_order INTEGER,
  bottle_count BIGINT,
  total_value DECIMAL,
  average_price DECIMAL
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    t.id as tier_id,
    t.name::text as tier_name,
    t.display_name as tier_display_name,
    t.sort_order,
    COUNT(b.id) as bottle_count,
    SUM(CAST(b.current_quantity AS DECIMAL) * CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as total_value,
    AVG(CAST(COALESCE(b.retail_price, '0') AS DECIMAL)) as average_price
  FROM tiers t
  LEFT JOIN bottles b ON b.tier_id = t.id
    AND b.status = 'active'
    AND (org_id_param IS NULL OR b.organization_id = org_id_param)
  GROUP BY t.id, t.name, t.display_name, t.sort_order
  ORDER BY t.sort_order;
$$;

-- Function to audit RLS policy effectiveness
CREATE OR REPLACE FUNCTION audit_data_access()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  user_id UUID,
  organization_id UUID,
  access_count BIGINT,
  last_access TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- This is a placeholder for audit functionality
  -- In a real implementation, you'd need to enable logging and parse logs
  SELECT
    'audit_placeholder'::text as table_name,
    'policy_placeholder'::text as policy_name,
    auth.uid() as user_id,
    (SELECT organization_id FROM profiles WHERE id = auth.uid()) as organization_id,
    0::bigint as access_count,
    NOW() as last_access
  WHERE FALSE; -- This ensures no data is returned for the placeholder
$$;

SELECT 'Database functions created successfully!' as status;