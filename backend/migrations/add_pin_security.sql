-- Migration: Add PIN security fields to users table
-- Date: 2025-10-18
-- Description: Add fields for PIN attempt limiting and account locking

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP;

-- Create index for locked accounts
CREATE INDEX IF NOT EXISTS idx_users_pin_locked ON users(pin_locked_until) 
WHERE pin_locked_until IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.pin_failed_attempts IS 'Number of consecutive failed PIN attempts';
COMMENT ON COLUMN users.pin_locked_until IS 'Timestamp until which the account is locked due to failed PIN attempts';
