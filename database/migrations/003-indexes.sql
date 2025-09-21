-- Database Indexes for Brand/Product Normalization Performance
-- Execute these in Supabase SQL Editor for optimal performance

-- 1. Index on bottles.brand_id for faster brand lookups
CREATE INDEX IF NOT EXISTS idx_bottles_brand_id ON bottles(brand_id);

-- 2. Index on bottles.product_name_id for faster product lookups  
CREATE INDEX IF NOT EXISTS idx_bottles_product_name_id ON bottles(product_name_id);

-- 3. Index on product_names.brand_id for faster brand-product relationships
CREATE INDEX IF NOT EXISTS idx_product_names_brand_id ON product_names(brand_id);

-- 4. Index on brands.name for faster brand name searches
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- 5. Index on product_names.name for faster product name searches  
CREATE INDEX IF NOT EXISTS idx_product_names_name ON product_names(name);

-- 6. Composite index for organization-specific brand queries
CREATE INDEX IF NOT EXISTS idx_bottles_organization_brand ON bottles(organization_id, brand_id);

-- 7. Composite index for legacy search functionality
CREATE INDEX IF NOT EXISTS idx_bottles_search ON bottles(brand, product, rfid_tag);

-- 8. Additional recommended indexes for full-text search (optional)
CREATE INDEX IF NOT EXISTS idx_brands_name_gin ON brands USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_product_names_name_gin ON product_names USING gin(to_tsvector('english', name));