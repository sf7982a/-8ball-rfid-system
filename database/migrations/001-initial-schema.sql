-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create product_names table
CREATE TABLE IF NOT EXISTS product_names (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand_id UUID REFERENCES brands(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add new columns to bottles table (these will be NULL initially)
ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id),
ADD COLUMN IF NOT EXISTS product_name_id UUID REFERENCES product_names(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_product_names_brand_id ON product_names(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_names_name ON product_names(name);
CREATE INDEX IF NOT EXISTS idx_bottles_brand_id ON bottles(brand_id);
CREATE INDEX IF NOT EXISTS idx_bottles_product_name_id ON bottles(product_name_id);

-- Insert some sample brands to test (optional)
INSERT INTO brands (name) VALUES 
    ('Grey Goose'),
    ('Hennessy'),
    ('Jack Daniels'),
    ('Absolut'),
    ('Johnnie Walker')
ON CONFLICT (name) DO NOTHING;