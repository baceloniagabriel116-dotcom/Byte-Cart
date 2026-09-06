CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  "firstName" TEXT DEFAULT '',
  "lastName" TEXT DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  "createdAt" TEXT DEFAULT NOW()::text
);

CREATE TYPE product_category AS ENUM ('electronics', 'wearables', 'accessories');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug TEXT,
  image_url TEXT DEFAULT 'assets/default-tech-placeholder.svg',
  price_php DECIMAL(12, 2) NOT NULL CHECK (price_php >= 0),
  description TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categories product_category[] NOT NULL CHECK (cardinality(categories) > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT DEFAULT NOW()::text
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  product_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_paid DECIMAL(12, 2) NOT NULL CHECK (price_paid >= 0),
  transaction_date TEXT DEFAULT NOW()::text,
  status VARCHAR(30) NOT NULL DEFAULT 'completed'
);

CREATE TABLE reviews (
  id BIGINT PRIMARY KEY,
  "productId" INTEGER,
  "userId" INTEGER,
  "userName" TEXT,
  rating NUMERIC(2,1),
  "rating_stars" INTEGER,
  comment TEXT,
  created_at TEXT DEFAULT NOW()::text
);

CREATE TABLE orders (
  id BIGINT PRIMARY KEY,
  "userId" TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  "shippingDetails" JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  "createdAt" TEXT DEFAULT NOW()::text,
  "orderNumber" TEXT
);
