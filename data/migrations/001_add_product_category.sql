-- Supabase/PostgreSQL migration: run once for an existing database.
DO $$
BEGIN
  CREATE TYPE product_category AS ENUM ('electronics', 'wearables', 'accessories');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category product_category;

-- Existing products must be classified before the field becomes required.
UPDATE products
SET category = 'accessories'
WHERE category IS NULL;

ALTER TABLE products
  ALTER COLUMN category SET NOT NULL;
