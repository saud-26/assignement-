CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_amount NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE idempotency_keys (
  key TEXT PRIMARY KEY,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'done')),
  response_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (name, email) VALUES
  ('Rahul Sharma', 'rahul@demo.com'),
  ('Priya Mehta', 'priya@demo.com'),
  ('Aman Verma', 'aman@demo.com'),
  ('Sneha Patil', 'sneha@demo.com'),
  ('Karan Singh', 'karan@demo.com');
