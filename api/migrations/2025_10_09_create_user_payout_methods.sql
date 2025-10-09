-- Migration: Create user payout methods table

-- User payout methods table
CREATE TABLE IF NOT EXISTS user_payout_methods (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('bank_transfer', 'mpesa', 'paypal')),
  
  -- Bank transfer details
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  account_name VARCHAR(100),
  branch_code VARCHAR(20),
  
  -- M-Pesa details
  phone_number VARCHAR(20),
  
  -- PayPal details
  paypal_email VARCHAR(100),
  
  -- Common fields
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Foreign key constraint (assuming users table exists)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_payout_methods_user_id ON user_payout_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payout_methods_default ON user_payout_methods(user_id, is_default) WHERE is_default = TRUE;

-- Ensure only one default method per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_payout_methods_one_default 
ON user_payout_methods(user_id) WHERE is_default = TRUE;

-- Add constraints to ensure required fields are present based on method type
-- Bank transfer requires bank details
ALTER TABLE user_payout_methods ADD CONSTRAINT chk_bank_transfer_fields
CHECK (
  method_type != 'bank_transfer' OR 
  (bank_name IS NOT NULL AND account_number IS NOT NULL AND account_name IS NOT NULL)
);

-- M-Pesa requires phone number
ALTER TABLE user_payout_methods ADD CONSTRAINT chk_mpesa_fields
CHECK (
  method_type != 'mpesa' OR 
  phone_number IS NOT NULL
);

-- PayPal requires email
ALTER TABLE user_payout_methods ADD CONSTRAINT chk_paypal_fields
CHECK (
  method_type != 'paypal' OR 
  paypal_email IS NOT NULL
);

-- Update trigger to set updated_at
CREATE OR REPLACE FUNCTION update_user_payout_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_payout_methods_updated_at
    BEFORE UPDATE ON user_payout_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_user_payout_methods_updated_at();

-- Function to ensure only one default method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a method as default, unset all other defaults for this user
    IF NEW.is_default = TRUE THEN
        UPDATE user_payout_methods 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ensure_single_default_payout_method
    BEFORE INSERT OR UPDATE ON user_payout_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payout_method();