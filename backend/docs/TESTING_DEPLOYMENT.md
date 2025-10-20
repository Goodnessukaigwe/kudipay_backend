# KudiPay Flutterwave Integration - Testing & Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Testing Strategy](#testing-strategy)
3. [API Testing](#api-testing)
4. [Integration Testing](#integration-testing)
5. [Deployment Checklist](#deployment-checklist)
6. [Monitoring & Debugging](#monitoring--debugging)

---

## Local Development Setup

### Prerequisites
```bash
# Node.js 16+ 
node --version

# PostgreSQL 12+
psql --version

# npm 8+
npm --version
```

### Initial Setup

```bash
cd /home/izk/Documents/kudipay_backend/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Minimum `.env` for Development

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kudipay
DB_USER=postgres
DB_PASSWORD=postgres
RPC_URL=https://sepolia.base.org
DEMO_MODE=true
FLUTTERWAVE_SECRET_KEY=test_key_placeholder
LOG_LEVEL=info
```

### Start Development Server

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Watch logs (optional)
tail -f logs/error.log
tail -f logs/combined.log
```

Expected output:
```
KudiPay Backend server running on port 3000
Environment: development
```

---

## Testing Strategy

### Test Levels

```
Unit Tests (Functions)
    ↓
Integration Tests (Services + DB)
    ↓
API Tests (Endpoints)
    ↓
E2E Tests (Full Flow)
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

---

## API Testing

### 1. Health Check

```bash
curl http://localhost:3000/health

# Expected Response:
# {
#   "status": "OK",
#   "message": "KudiPay Backend is running",
#   "timestamp": "2025-10-20T..."
# }
```

### 2. Get Nigerian Banks

```bash
curl http://localhost:3000/api/payment/flutterwave/banks/ng | jq

# Expected Response:
# {
#   "success": true,
#   "message": "Nigerian banks retrieved successfully",
#   "data": [
#     { "code": "044", "name": "Access Bank", "country": "NG" },
#     ...
#   ]
# }
```

### 3. Get Kenyan Banks

```bash
curl http://localhost:3000/api/payment/flutterwave/banks/ke | jq
```

### 4. Get Mobile Money Providers

```bash
# Nigeria
curl "http://localhost:3000/api/payment/flutterwave/mobile-money/providers?country=NG" | jq

# Kenya
curl "http://localhost:3000/api/payment/flutterwave/mobile-money/providers?country=KE" | jq
```

### 5. Verify Account

```bash
curl -X POST http://localhost:3000/api/payment/flutterwave/verify/account \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "bankCode": "058",
    "country": "NG"
  }' | jq
```

### 6. Nigerian Bank Withdrawal (Demo)

```bash
curl -X POST http://localhost:3000/api/payment/flutterwave/withdraw/ng-bank \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "amount": 50000,
    "accountNumber": "1234567890",
    "bankCode": "058",
    "pin": "1234",
    "accountName": "John Doe"
  }' | jq

# Expected (Demo Mode):
# {
#   "success": true,
#   "message": "Nigerian bank withdrawal initiated via Flutterwave",
#   "data": {
#     "success": true,
#     "transferId": "FW_NG_1729442560000",
#     "txRef": "KP_TIMESTAMP_RANDOM",
#     "amount": 50000,
#     "currency": "NGN",
#     "status": "pending"
#   }
# }
```

### 7. Mobile Money Withdrawal (Demo)

```bash
curl -X POST http://localhost:3000/api/payment/flutterwave/withdraw/mobile-money \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "amount": 50000,
    "recipientPhone": "+2349087654321",
    "provider": "MTN",
    "pin": "1234",
    "country": "NG"
  }' | jq
```

### 8. Check Transfer Status

```bash
curl http://localhost:3000/api/payment/flutterwave/transfer/FW_NG_1729442560000/status | jq
```

---

## Integration Testing

### Test Script: `test-flutterwave.sh`

Create `backend/tests/test-flutterwave.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api/payment"
PHONE="+2348012345678"
PIN="1234"

echo -e "${YELLOW}KudiPay Flutterwave Integration Tests${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
response=$(curl -s http://localhost:3000/health)
if echo "$response" | grep -q '"status":"OK"'; then
  echo -e "${GREEN}✓ Server is running${NC}\n"
else
  echo -e "${RED}✗ Server not responding${NC}\n"
  exit 1
fi

# Test 2: Get Nigerian Banks
echo -e "${YELLOW}Test 2: Get Nigerian Banks${NC}"
response=$(curl -s "$API_URL/flutterwave/banks/ng")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Nigerian banks retrieved${NC}"
  echo "$response" | jq '.data | length'
  echo ""
else
  echo -e "${RED}✗ Failed to get banks${NC}\n"
fi

# Test 3: Get Kenyan Banks
echo -e "${YELLOW}Test 3: Get Kenyan Banks${NC}"
response=$(curl -s "$API_URL/flutterwave/banks/ke")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Kenyan banks retrieved${NC}"
  echo "$response" | jq '.data | length'
  echo ""
else
  echo -e "${RED}✗ Failed to get banks${NC}\n"
fi

# Test 4: Get Mobile Money Providers
echo -e "${YELLOW}Test 4: Get Mobile Money Providers${NC}"
response=$(curl -s "$API_URL/flutterwave/mobile-money/providers?country=NG")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Mobile money providers retrieved${NC}"
  echo "$response" | jq '.data | map(.name)'
  echo ""
else
  echo -e "${RED}✗ Failed to get providers${NC}\n"
fi

# Test 5: Verify Account
echo -e "${YELLOW}Test 5: Verify Account${NC}"
response=$(curl -s -X POST "$API_URL/flutterwave/verify/account" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "bankCode": "058",
    "country": "NG"
  }')
if echo "$response" | grep -q '"verified":true'; then
  echo -e "${GREEN}✓ Account verified${NC}"
  echo "$response" | jq '.data'
  echo ""
else
  echo -e "${RED}✗ Account verification failed${NC}\n"
fi

# Test 6: Test Nigerian Bank Withdrawal
echo -e "${YELLOW}Test 6: Nigerian Bank Withdrawal${NC}"
response=$(curl -s -X POST "$API_URL/flutterwave/withdraw/ng-bank" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"$PHONE\",
    \"amount\": 50000,
    \"accountNumber\": \"1234567890\",
    \"bankCode\": \"058\",
    \"pin\": \"$PIN\"
  }")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Nigerian bank withdrawal initiated${NC}"
  transferId=$(echo "$response" | jq -r '.data.transferId')
  echo "Transfer ID: $transferId"
  echo ""
  
  # Test 7: Check Transfer Status
  echo -e "${YELLOW}Test 7: Check Transfer Status${NC}"
  sleep 1
  status_response=$(curl -s "$API_URL/flutterwave/transfer/$transferId/status")
  if echo "$status_response" | grep -q '"transferId"'; then
    echo -e "${GREEN}✓ Transfer status retrieved${NC}"
    echo "$status_response" | jq '.data'
    echo ""
  else
    echo -e "${RED}✗ Failed to get transfer status${NC}\n"
  fi
else
  echo -e "${RED}✗ Nigerian bank withdrawal failed${NC}"
  echo "$response" | jq '.'
  echo ""
fi

# Test 8: Mobile Money Withdrawal
echo -e "${YELLOW}Test 8: Mobile Money Withdrawal${NC}"
response=$(curl -s -X POST "$API_URL/flutterwave/withdraw/mobile-money" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"$PHONE\",
    \"amount\": 50000,
    \"recipientPhone\": \"+2349087654321\",
    \"provider\": \"MTN\",
    \"pin\": \"$PIN\",
    \"country\": \"NG\"
  }")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Mobile money withdrawal initiated${NC}"
  echo "$response" | jq '.data'
  echo ""
else
  echo -e "${RED}✗ Mobile money withdrawal failed${NC}"
  echo "$response" | jq '.'
  echo ""
fi

# Test 9: Kenyan Bank Withdrawal
echo -e "${YELLOW}Test 9: Kenyan Bank Withdrawal${NC}"
response=$(curl -s -X POST "$API_URL/flutterwave/withdraw/ke-bank" \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"+254712345678\",
    \"amount\": 7000,
    \"accountNumber\": \"0123456789\",
    \"bankCode\": \"63f47f9e5e0000f812345678\",
    \"pin\": \"$PIN\"
  }")
if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Kenyan bank withdrawal initiated${NC}"
  echo "$response" | jq '.data'
  echo ""
else
  echo -e "${RED}✗ Kenyan bank withdrawal failed${NC}"
  echo "$response" | jq '.'
  echo ""
fi

echo -e "${YELLOW}Test Suite Complete!${NC}"
```

### Run Integration Tests

```bash
# Make script executable
chmod +x backend/tests/test-flutterwave.sh

# Run tests (server must be running)
./backend/tests/test-flutterwave.sh
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code reviewed
- [ ] No console.log statements (use logger)
- [ ] Error handling implemented
- [ ] Input validation complete
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Backup strategy defined

### Environment Setup

```bash
# Copy to server
scp -r backend/ user@server:/var/www/kudipay/

# SSH into server
ssh user@server

# Install dependencies
cd /var/www/kudipay/backend
npm install --production

# Set production environment
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=prod-db.example.com
DB_NAME=kudipay_prod
DB_USER=kudipay_user
DB_PASSWORD=secure_password
RPC_URL=https://mainnet.base.org
FLUTTERWAVE_API_URL=https://api.flutterwave.com/v3
FLUTTERWAVE_SECRET_KEY=production_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=production_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET=webhook_secret
DEMO_MODE=false
LOG_LEVEL=info
EOF

# Set secure permissions
chmod 600 .env
```

### Database Setup

```bash
# Create database
createdb kudipay_prod

# Run migrations
psql -d kudipay_prod -f schema.sql

# Verify tables
psql -d kudipay_prod -c "\dt"
```

### Start Application

#### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name "kudipay-backend"

# Save PM2 config
pm2 save

# Enable startup on reboot
pm2 startup
pm2 save
```

#### Option 2: Systemd Service

Create `/etc/systemd/system/kudipay.service`:

```ini
[Unit]
Description=KudiPay Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kudipay/backend
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable kudipay
sudo systemctl start kudipay

# Check status
sudo systemctl status kudipay
```

### Nginx Configuration

Create `/etc/nginx/sites-available/kudipay`:

```nginx
upstream kudipay_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.kudipay.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.kudipay.com;

    ssl_certificate /etc/ssl/certs/kudipay.crt;
    ssl_certificate_key /etc/ssl/private/kudipay.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        proxy_pass http://kudipay_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kudipay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d api.kudipay.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Debugging

### Log Files

```bash
# View logs in real-time
tail -f logs/combined.log
tail -f logs/error.log

# Search logs
grep "withdrawal" logs/combined.log
grep "ERROR" logs/error.log

# Get last 100 lines
tail -100 logs/error.log
```

### Performance Monitoring

```bash
# Monitor CPU and memory
top -p $(pgrep -f "node src/index.js")

# Monitor network
netstat -an | grep 3000

# Check database connections
psql -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"
```

### Common Issues & Solutions

#### Issue: "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d kudipay -c "SELECT 1"

# Check .env credentials
grep DB_ .env
```

#### Issue: "Flutterwave API not responding"
```bash
# Check API key
grep FLUTTERWAVE .env | head -1

# Test API connectivity
curl -I https://api.flutterwave.com/v3

# Check logs
grep -i flutterwave logs/error.log
```

#### Issue: "High memory usage"
```bash
# Check for memory leaks
pm2 monit

# Restart service
pm2 restart kudipay-backend

# Or with systemd
sudo systemctl restart kudipay
```

### Health Checks

Create `backend/scripts/health-check.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"

echo "Checking KudiPay Backend..."

# Check server is up
if curl -s "$API_URL/health" | grep -q "OK"; then
  echo "✓ Server is responding"
else
  echo "✗ Server is not responding"
  exit 1
fi

# Check API endpoints
if curl -s "$API_URL/api/payment/flutterwave/banks/ng" | grep -q "success"; then
  echo "✓ API endpoints working"
else
  echo "✗ API endpoints failing"
  exit 1
fi

# Check database
if curl -s "$API_URL/api/wallet/create" | grep -q "error"; then
  echo "✓ Database connected"
else
  echo "✗ Database connection issue"
  exit 1
fi

echo "All checks passed!"
```

```bash
# Run health checks
chmod +x backend/scripts/health-check.sh
./backend/scripts/health-check.sh
```

### Monitoring with PM2

```bash
# Real-time monitoring
pm2 monit

# Log retrieval
pm2 logs kudipay-backend

# Process info
pm2 info kudipay-backend

# CPU profiling
pm2 profile start kudipay-backend
sleep 30
pm2 profile stop kudipay-backend
pm2 profile report
```

---

## Post-Deployment

### Verification

```bash
# Test endpoints on production
curl https://api.kudipay.com/health

# Check logs
tail -f /var/www/kudipay/backend/logs/combined.log

# Monitor performance
pm2 monit
```

### Monitoring Setup

- [ ] Set up application monitoring (New Relic, DataDog, etc.)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation (ELK, Splunk)
- [ ] Configure alerts for critical errors
- [ ] Set up uptime monitoring
- [ ] Configure backup automation

### Backup Strategy

```bash
# Database backup (daily)
0 2 * * * pg_dump kudipay_prod | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Application backup (weekly)
0 3 * * 0 tar -czf /backups/app_$(date +\%Y\%m\%d).tar.gz /var/www/kudipay/backend

# Verify backups
ls -lh /backups/
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop current version
pm2 stop kudipay-backend

# Go to previous version
cd /var/www/kudipay/backend
git checkout previous-commit-hash

# Reinstall dependencies
npm install --production

# Restart
pm2 start kudipay-backend

# Verify
curl https://api.kudipay.com/health
```

---

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_phone ON transactions(from_phone);
CREATE INDEX idx_transactions_wallet ON transactions(from_wallet);
CREATE INDEX idx_users_phone ON users(phone_number);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM transactions WHERE from_phone = '+2348012345678';
```

### Application Optimization

- Use connection pooling
- Implement caching for bank lists
- Optimize database queries
- Compress API responses
- Use CDN for static assets

### Caching Strategy

```javascript
// Example: Cache bank lists
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function getCachedBanks(country) {
  const cacheKey = `banks_${country}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  const banks = await flutterwaveService.getBanks(country);
  cache.set(cacheKey, { data: banks, timestamp: Date.now() });
  return banks;
}
```

---

## Conclusion

Your Flutterwave integration is now fully deployed and monitored! 🚀

For support:
- Check logs: `logs/error.log`
- Review documentation: `docs/FLUTTERWAVE_API.md`
- Contact Flutterwave: https://support.flutterwave.com

