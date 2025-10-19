-- Migration: Add blockchain tracking fields to users table
-- Purpose: Store blockchain transaction references for on-chain registrations
-- Network: Base Sepolia (testnet) / Base Mainnet (production)

-- Add blockchain tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66);
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_block INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_network VARCHAR(50) DEFAULT 'base-sepolia';
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_registered_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_blockchain_tx ON users(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_users_blockchain_network ON users(blockchain_network);

-- Add comments
COMMENT ON COLUMN users.blockchain_tx_hash IS 'Transaction hash of on-chain phone-wallet mapping';
COMMENT ON COLUMN users.blockchain_block IS 'Block number where mapping was confirmed';
COMMENT ON COLUMN users.blockchain_network IS 'Network where mapping is registered (base-sepolia, base-mainnet)';
COMMENT ON COLUMN users.blockchain_registered_at IS 'Timestamp when blockchain registration was confirmed';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name LIKE 'blockchain%'
ORDER BY column_name;
