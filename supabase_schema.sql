-- Create Tables for Forsdigpay

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price BIGINT NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  account_no TEXT,
  account_name TEXT,
  status TEXT DEFAULT 'ENABLED',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Topups
CREATE TABLE IF NOT EXISTS topups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  amount BIGINT NOT NULL,
  unique_code INTEGER,
  total_amount BIGINT NOT NULL,
  payment_method JSONB,
  status TEXT DEFAULT 'PENDING_PAYMENT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ
);

-- 5. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  amount BIGINT NOT NULL,
  target TEXT,
  type TEXT,
  status TEXT DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  start_date DATE,
  end_date DATE,
  status TEXT,
  type TEXT,
  recipient_email TEXT,
  transaction_count INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Providers
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  api_key TEXT,
  username TEXT,
  secret TEXT,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'ENABLED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
