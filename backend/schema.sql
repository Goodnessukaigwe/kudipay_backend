-- KudiPay Database Schema
-- PostgreSQL Database Setup

-- Create database (run this command separately)
-- CREATE DATABASE kudipay;

-- Users table - stores phone number to wallet mappings
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    private_key VARCHAR(66) NOT NULL, -- In production, this should be encrypted
    pin VARCHAR(4) NOT NULL, -- In production, this should be hashed
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table - stores all transaction records
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tx_ref VARCHAR(50) UNIQUE NOT NULL,
    from_phone VARCHAR(20),
    to_phone VARCHAR(20),
    from_wallet VARCHAR(42),
    to_wallet VARCHAR(42),
    amount DECIMAL(18,6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDT',
    amount_ngn DECIMAL(15,2),
    exchange_rate DECIMAL(10,4),
    fee DECIMAL(18,6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('transfer', 'received', 'withdrawal', 'deposit')),
    blockchain_hash VARCHAR(66),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USSD sessions table - manages active USSD sessions
CREATE TABLE ussd_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    current_step VARCHAR(50) DEFAULT 'main_menu',
    session_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Withdrawals table - tracks withdrawal requests
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    tx_ref VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    amount_ngn DECIMAL(15,2) NOT NULL,
    withdrawal_method VARCHAR(20) NOT NULL CHECK (withdrawal_method IN ('bank', 'mobile_money', 'cash_agent')),
    account_number VARCHAR(50),
    bank_code VARCHAR(10),
    provider_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    provider_reference VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates table - stores historical exchange rates
CREATE TABLE exchange_rates (
    id SERIAL PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15,6) NOT NULL,
    source VARCHAR(50) DEFAULT 'internal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_transactions_phones ON transactions(from_phone, to_phone);
CREATE INDEX idx_transactions_wallets ON transactions(from_wallet, to_wallet);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_ussd_sessions_active ON ussd_sessions(session_id, phone_number) WHERE is_active = true;
CREATE INDEX idx_ussd_sessions_activity ON ussd_sessions(last_activity) WHERE is_active = true;
CREATE INDEX idx_withdrawals_phone ON withdrawals(phone_number);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency, created_at DESC);

-- Add foreign key constraints
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_from_phone 
    FOREIGN KEY (from_phone) REFERENCES users(phone_number) ON DELETE SET NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_to_phone 
    FOREIGN KEY (to_phone) REFERENCES users(phone_number) ON DELETE SET NULL;
ALTER TABLE ussd_sessions ADD CONSTRAINT fk_ussd_sessions_phone 
    FOREIGN KEY (phone_number) REFERENCES users(phone_number) ON DELETE CASCADE;
ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawals_phone 
    FOREIGN KEY (phone_number) REFERENCES users(phone_number) ON DELETE CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial exchange rates (mock data for development)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('USDT', 'NGN', 1500.00),
('ETH', 'NGN', 2500000.00),
('ETH', 'USD', 1667.00),
('NGN', 'USDT', 0.000667);

-- Create a view for user balances (computed from transactions)
CREATE VIEW user_balances AS
SELECT 
    u.phone_number,
    u.wallet_address,
    COALESCE(SUM(CASE 
        WHEN t.to_phone = u.phone_number THEN t.amount_ngn 
        ELSE 0 
    END), 0) as total_received,
    COALESCE(SUM(CASE 
        WHEN t.from_phone = u.phone_number THEN t.amount_ngn 
        ELSE 0 
    END), 0) as total_sent,
    COALESCE(SUM(CASE 
        WHEN t.to_phone = u.phone_number THEN t.amount_ngn 
        WHEN t.from_phone = u.phone_number THEN -t.amount_ngn 
        ELSE 0 
    END), 0) as balance_ngn
FROM users u
LEFT JOIN transactions t ON (t.from_phone = u.phone_number OR t.to_phone = u.phone_number)
    AND t.status = 'completed'
WHERE u.is_active = true
GROUP BY u.phone_number, u.wallet_address;

-- Create a function to cleanup old USSD sessions
CREATE OR REPLACE FUNCTION cleanup_old_ussd_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE ussd_sessions 
    SET is_active = false
    WHERE is_active = true 
    AND last_activity < NOW() - INTERVAL '10 minutes';
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data for development (optional)
-- INSERT INTO users (phone_number, wallet_address, private_key, pin) VALUES
-- ('+2348012345678', '0x1234567890123456789012345678901234567890', '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', '1234');

COMMIT;
