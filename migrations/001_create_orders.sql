-- migration: create_orders

CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELED');

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status order_status NOT NULL DEFAULT 'PENDING',
  qr_code TEXT,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$ 
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);