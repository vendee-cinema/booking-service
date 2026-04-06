-- migration: create_tickets

CREATE TYPE ticket_status AS ENUM ('RESERVED', 'PAID', 'CANCELLED');

CREATE TABLE
  tickets (
    id TEXT PRIMARY KEY,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status ticket_status NOT NULL DEFAULT 'RESERVED',
    paid_at TIMESTAMPTZ,
    session_id TEXT NOT NULL,
    hall_id TEXT NOT NULL,
    seat_id TEXT NOT NULL,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE UNIQUE INDEX uniq_ticket_session_seat ON tickets (session_id, seat_id);

CREATE
OR REPLACE FUNCTION update_timestamp () 
RETURNS TRIGGER AS $$ 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();