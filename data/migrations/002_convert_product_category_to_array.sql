-- Supabase/PostgreSQL migration: converts the former single category into a category array.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS categories product_category[];

UPDATE products
SET categories = ARRAY[category]::product_category[]
WHERE categories IS NULL AND category IS NOT NULL;

ALTER TABLE products
  ALTER COLUMN categories SET NOT NULL;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_categories_not_empty;

ALTER TABLE products
  ADD CONSTRAINT products_categories_not_empty CHECK (cardinality(categories) > 0);

ALTER TABLE products
  DROP COLUMN IF EXISTS category;
