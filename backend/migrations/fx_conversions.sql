-- FX Conversions table for logging all conversion transactions
-- Stores historical conversion data for analytics and profit tracking

CREATE TABLE IF NOT EXISTS fx_conversions (
    id SERIAL PRIMARY KEY,
    conversion_id VARCHAR(50) UNIQUE NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    original_amount DECIMAL(18, 6) NOT NULL,
    converted_amount DECIMAL(18, 6) NOT NULL,
    base_rate DECIMAL(18, 8) NOT NULL,
    rate_with_markup DECIMAL(18, 8) NOT NULL,
    markup_percent DECIMAL(5, 2) NOT NULL,
    markup_amount DECIMAL(18, 6) NOT NULL,
    profit_amount DECIMAL(18, 6) NOT NULL,
    profit_currency VARCHAR(10) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(20),
    transaction_ref VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fx_conversions_conversion_id ON fx_conversions(conversion_id);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_user_id ON fx_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_phone ON fx_conversions(phone_number);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_created_at ON fx_conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_currency_pair ON fx_conversions(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_provider ON fx_conversions(provider);

-- Index for profit analytics queries
CREATE INDEX IF NOT EXISTS idx_fx_conversions_profit ON fx_conversions(profit_amount, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_fx_conversions_updated_at 
    BEFORE UPDATE ON fx_conversions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for daily profit summary
CREATE OR REPLACE VIEW fx_daily_profit AS
SELECT 
    DATE(created_at) as date,
    from_currency,
    to_currency,
    COUNT(*) as conversion_count,
    SUM(original_amount) as total_volume_from,
    SUM(converted_amount) as total_volume_to,
    SUM(profit_amount) as total_profit,
    AVG(markup_percent) as avg_markup_percent,
    profit_currency
FROM fx_conversions
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at), from_currency, to_currency, profit_currency
ORDER BY date DESC, total_profit DESC;

-- View for hourly conversion volume (for monitoring)
CREATE OR REPLACE VIEW fx_hourly_volume AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    from_currency,
    to_currency,
    COUNT(*) as conversion_count,
    SUM(original_amount) as total_volume,
    SUM(profit_amount) as total_profit,
    provider
FROM fx_conversions
WHERE created_at > NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('hour', created_at), from_currency, to_currency, provider
ORDER BY hour DESC;

-- Function to get profit stats for a specific timeframe
CREATE OR REPLACE FUNCTION get_fx_profit_stats(
    timeframe_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_conversions BIGINT,
    total_profit NUMERIC,
    total_volume NUMERIC,
    avg_markup NUMERIC,
    currency_pair TEXT,
    profit_currency VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_conversions,
        SUM(profit_amount)::NUMERIC as total_profit,
        SUM(converted_amount)::NUMERIC as total_volume,
        AVG(markup_percent)::NUMERIC as avg_markup,
        (from_currency || '/' || to_currency)::TEXT as currency_pair,
        fx_conversions.profit_currency
    FROM fx_conversions
    WHERE created_at > NOW() - (timeframe_hours || ' hours')::INTERVAL
    GROUP BY from_currency, to_currency, fx_conversions.profit_currency
    ORDER BY total_profit DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old conversion logs (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_fx_conversions(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM fx_conversions
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data for development/testing (optional - comment out for production)
-- INSERT INTO fx_conversions (
--     conversion_id, from_currency, to_currency, original_amount, converted_amount,
--     base_rate, rate_with_markup, markup_percent, markup_amount, profit_amount,
--     profit_currency, provider
-- ) VALUES
-- ('CNV_TEST_001', 'USDC', 'NGN', 100.00, 153000.00, 1500.00, 1530.00, 2.00, 3000.00, 3000.00, 'NGN', 'binance'),
-- ('CNV_TEST_002', 'ETH', 'NGN', 1.00, 3825000.00, 2500000.00, 2550000.00, 2.00, 50000.00, 50000.00, 'NGN', 'chainlink');

COMMIT;
