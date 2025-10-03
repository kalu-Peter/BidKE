-- Migration: Create payments, commissions and payouts tables

-- Payments table (integer primary keys)
CREATE TABLE IF NOT EXISTS payments (
  payment_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  auction_id BIGINT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(64),
  transaction_ref VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commissions table (integer primary keys)
CREATE TABLE IF NOT EXISTS commissions (
  commission_id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  auction_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, deducted, settled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payouts table (integer primary keys)
CREATE TABLE IF NOT EXISTS payouts (
  payout_id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL,
  auction_id BIGINT NOT NULL,
  payment_id BIGINT REFERENCES payments(payment_id) ON DELETE SET NULL,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  payout_method VARCHAR(64),
  transaction_ref VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_auction_id ON payments(auction_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_id ON commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
-- Ensure transaction_ref is unique when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_ref_unique ON payments ((transaction_ref)) WHERE transaction_ref IS NOT NULL;
