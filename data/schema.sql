CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE product_category AS ENUM ('electronics', 'wearables', 'accessories');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  price_php DECIMAL(12, 2) NOT NULL CHECK (price_php >= 0),
  description TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categories product_category[] NOT NULL CHECK (cardinality(categories) > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES Users(id),
  product_id INTEGER NOT NULL REFERENCES Products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_paid DECIMAL(12, 2) NOT NULL CHECK (price_paid >= 0),
  transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) NOT NULL DEFAULT 'completed'
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES Users(id),
  product_id INTEGER NOT NULL REFERENCES Products(id),
  rating_stars INTEGER NOT NULL CHECK (rating_stars BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);

-- Enable RLS before connecting the browser client.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public storefront reads only active products. Keep writes server-side or behind Supabase Auth.
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (active = TRUE);

-- These policies assume Supabase Auth is used and auth.uid() matches users.id.
CREATE POLICY "Users can read their transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read reviews" ON reviews
  FOR SELECT USING (TRUE);
CREATE POLICY "Users can create their reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
