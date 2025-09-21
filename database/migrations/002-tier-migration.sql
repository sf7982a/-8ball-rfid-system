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
-- This is a simplified migration - in reality, you'd want more sophisticated brand/product analysis
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

-- Migration complete!
-- Summary of changes:
-- 1. Created tiers table with 5 predefined tiers
-- 2. Added default_tier_id to brands table
-- 3. Added tier_id to bottles table (now NOT NULL)
-- 4. Made product_name_id nullable in bottles table  
-- 5. Migrated existing bottles to appropriate tiers
-- 6. Set default tiers for brands based on historical data
-- 7. Added performance indexes
-- 8. Created reporting views for tier analytics

SELECT 'Tier migration completed successfully!' as status;