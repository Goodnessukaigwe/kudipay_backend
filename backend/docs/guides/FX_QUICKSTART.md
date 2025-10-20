# FX Engine - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set these minimum required variables:
# - Database credentials (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
# - Base RPC URL for Chainlink (BASE_RPC_URL)
# - Optional: API keys for Binance, CryptoCompare
```

### Step 3: Database Setup

```bash
# Create database
createdb kudipay

# Run schema
psql -d kudipay -f schema.sql

# Run FX conversions migration
psql -d kudipay -f migrations/fx_conversions.sql
```

### Step 4: Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Step 5: Test the FX Engine

```bash
# Get all rates
curl http://localhost:3000/api/fx/rates

# Get specific rate
curl "http://localhost:3000/api/fx/rate/USDC/NGN?amount=100"

# Convert amount
curl -X POST http://localhost:3000/api/fx/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "fromCurrency": "USDC",
    "toCurrency": "NGN"
  }'
```

## 📊 Key Features Implemented

### ✅ Real-Time Rate Fetching
- **Binance API** for cryptocurrency spot prices
- **Chainlink Price Feeds** for on-chain oracle data  
- **Fallback APIs** (CoinGecko, CryptoCompare) for redundancy

### ✅ Profit Optimization
- Configurable markup (1-3% default)
- Dynamic pricing based on transaction size
- Volume discounts for large conversions
- Volatility-adjusted spreads

### ✅ Production-Ready Features
- Circuit breaker pattern for fault tolerance
- LRU cache with intelligent TTL
- Comprehensive conversion logging
- Profit analytics and reporting
- Health monitoring endpoints

## 🎯 API Endpoints Overview

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/fx/rates` | GET | Get all currency rates | Public |
| `/api/fx/rate/:from/:to` | GET | Get specific rate | Public |
| `/api/fx/convert` | POST | Convert with logging | Public* |
| `/api/fx/pairs` | GET | Supported pairs | Public |
| `/api/fx/health` | GET | System health | Public |
| `/api/fx/profit/stats` | GET | Profit analytics | Protected |
| `/api/fx/history` | GET | Conversion history | Protected |
| `/api/fx/admin/markup` | GET/PUT | Markup config | Admin |

*Should add rate limiting in production

## 💰 Profit Calculation Example

```
Transaction: 100 USDC → NGN

Base Rate (Binance):    1550 NGN/USDC
Markup (2%):            +31 NGN
Rate with Markup:       1581 NGN/USDC

Amount Converted:       158,100 NGN
Platform Profit:        3,100 NGN (2% of 155,000)

Profit Distribution:
- Platform (70%):       2,170 NGN
- Partner (20%):        620 NGN  
- Reserve (10%):        310 NGN
```

## 🔧 Configuration

### Markup Rates (Environment Variables)

```bash
FX_MARKUP_USDC_NGN=0.02   # 2% for stablecoins
FX_MARKUP_USDT_NGN=0.02   # 2% for stablecoins  
FX_MARKUP_ETH_NGN=0.025   # 2.5% for volatile assets
FX_MARKUP_BTC_NGN=0.025   # 2.5% for volatile assets
```

### Dynamic Markup Features

1. **Volume Discounts**
   - > $10,000: 20% markup reduction
   - > $50,000: 40% markup reduction

2. **Volatility Adjustment**
   - Stablecoins: No adjustment
   - ETH: +0.5% during high volatility
   - BTC: +0.4% during high volatility

3. **Bounds**
   - Minimum: 1% (0.01)
   - Maximum: 5% (0.05)

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3000/api/fx/health
```

Returns:
- Cache statistics
- Provider health (binance, chainlink, fallback)
- System uptime

### Profit Dashboard

```bash
# Last 24 hours
curl http://localhost:3000/api/fx/profit/stats?timeframe=24h

# Last 7 days
curl http://localhost:3000/api/fx/profit/stats?timeframe=7d
```

## 🏗️ Architecture Highlights

### Provider Chain
```
Binance (Primary)
   ↓ fails
Chainlink (Secondary)
   ↓ fails
CoinGecko/CryptoCompare (Fallback)
```

### Circuit Breaker
- Threshold: 3 consecutive failures
- Reset: After 1 minute
- Self-healing: Automatic retry

### Cache Strategy
- Stablecoins: 5-minute TTL
- Volatile crypto: 2-minute TTL
- Fiat pairs: 10-minute TTL

## 🧪 Testing

### Manual Testing

```bash
# Test conversion flow
node scripts/test_fx_engine.js

# Test provider failover
node scripts/test_circuit_breaker.js

# Load test
ab -n 1000 -c 10 -p test.json \
  http://localhost:3000/api/fx/convert
```

### Unit Tests (Coming Soon)

```bash
npm test src/services/fx/
```

## 🚨 Common Issues

### 1. "All FX providers failed"
**Solution**: 
- Check API keys in .env
- Verify network connectivity
- Check provider status pages

### 2. Stale Rates
**Solution**:
- Adjust TTL in environment variables
- Check provider response times
- Review cache logs

### 3. Database Errors
**Solution**:
- Ensure fx_conversions table exists
- Check database connection
- Verify migrations ran successfully

## 📚 Next Steps

1. **Add Authentication**
   - Implement JWT middleware
   - Protect admin endpoints
   - Add API key validation

2. **Add Rate Limiting**
   - Prevent abuse of convert endpoint
   - Per-user limits
   - IP-based throttling

3. **Monitoring & Alerts**
   - Set up DataDog/New Relic
   - Alert on provider failures
   - Track profit trends

4. **Optimization**
   - Redis cache for distributed systems
   - Database read replicas
   - CDN for static rate data

5. **Compliance**
   - KYC for large conversions
   - Transaction limits
   - Regulatory reporting

## 📞 Support

- **Documentation**: `/backend/docs/FX_ENGINE.md`
- **API Reference**: Swagger UI (coming soon)
- **Issues**: GitHub Issues
- **Email**: engineering@kudipay.com

## 📝 Version

**v1.0.0** - Production Release (October 2025)

---

**Built with ❤️ by the KudiPay Engineering Team**
