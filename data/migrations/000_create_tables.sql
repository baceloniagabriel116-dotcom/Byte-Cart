-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  role TEXT DEFAULT 'user',
  "createdAt" TEXT DEFAULT NOW()::text
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  categories TEXT[] DEFAULT '{}',
  price NUMERIC DEFAULT 0,
  "price_php" NUMERIC DEFAULT 0,
  "image_url" TEXT DEFAULT 'assets/default-tech-placeholder.svg',
  description TEXT,
  stock INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "created_at" TEXT DEFAULT NOW()::text
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  "price_paid" NUMERIC DEFAULT 0,
  "transaction_date" TEXT DEFAULT NOW()::text,
  status TEXT DEFAULT 'completed'
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT PRIMARY KEY,
  "productId" INTEGER,
  "userId" INTEGER,
  "userName" TEXT,
  rating NUMERIC(2,1),
  "rating_stars" INTEGER,
  comment TEXT,
  "created_at" TEXT DEFAULT NOW()::text
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY,
  "userId" TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  "shippingDetails" JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  "createdAt" TEXT DEFAULT NOW()::text,
  "orderNumber" TEXT
);
