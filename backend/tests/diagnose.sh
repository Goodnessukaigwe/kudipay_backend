#!/bin/bash

# KudiPay Performance Diagnostic Tool
# Identifies bottlenecks in test execution

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  KudiPay Performance Diagnostic Tool                       ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"

# 1. System Information
echo -e "${BLUE}━━ System Information ━━${NC}"
echo "CPU Cores: $(nproc)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Node Version: $(node --version)"
echo "npm Version: $(npm --version)"
echo ""

# 2. Check Node.js Configuration
echo -e "${BLUE}━━ Node.js Configuration ━━${NC}"
echo -ne "Max Memory: "
node -e "console.log((require('os').totalmem() / 1024 / 1024 / 1024).toFixed(1) + ' GB')"
echo "Execution Mode: $(node -e "console.log(process.env.NODE_ENV || 'development')")"
echo ""

# 3. Check Dependencies
echo -e "${BLUE}━━ Critical Dependencies ━━${NC}"
cd /home/izk/Documents/kudipay_backend/backend 2>/dev/null || cd . 

for pkg in "express" "axios" "pg" "ethers" "jest" "winston"; do
    version=$(npm list --depth=0 $pkg 2>/dev/null | grep "$pkg@" | awk '{print $NF}')
    if [ -z "$version" ]; then
        echo -e "${RED}✗ $pkg${NC} - NOT INSTALLED"
    else
        echo -e "${GREEN}✓ $pkg@${version:1}${NC}"
    fi
done
echo ""

# 4. Environment Configuration
echo -e "${BLUE}━━ Environment (.env) ━━${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    grep -E "DEMO_MODE|NODE_ENV|PORT|DB_" .env 2>/dev/null | sed 's/=.*/=***/' | while read line; do
        echo "  $line"
    done
else
    echo -e "${YELLOW}⚠ .env not found (using defaults)${NC}"
fi
echo ""

# 5. Database Connection Check
echo -e "${BLUE}━━ Database Connectivity ━━${NC}"
if command -v psql &> /dev/null; then
    if psql -U postgres -d postgres -c "SELECT 1" &>/dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}"
        count=$(psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE state='active';" 2>/dev/null | tail -2 | head -1)
        echo "  Active connections: $count"
    else
        echo -e "${YELLOW}⚠ PostgreSQL not accessible${NC}"
        echo "  Start with: sudo service postgresql start"
    fi
else
    echo -e "${YELLOW}⚠ psql not installed (skip DB check)${NC}"
fi
echo ""

# 6. Server Health Check
echo -e "${BLUE}━━ Server Status ━━${NC}"
if nc -z localhost 3000 2>/dev/null; then
    echo -e "${GREEN}✓ Server is running on port 3000${NC}"
    
    # Check response time
    start=$(($(date +%s%N)/1000000))
    response=$(curl -s --max-time 5 http://localhost:3000/health)
    end=$(($(date +%s%N)/1000000))
    latency=$((end - start))
    
    if [ "$latency" -lt 100 ]; then
        echo -e "${GREEN}✓ Response time: ${latency}ms (excellent)${NC}"
    elif [ "$latency" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Response time: ${latency}ms (acceptable)${NC}"
    else
        echo -e "${RED}✗ Response time: ${latency}ms (slow)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Server not running on port 3000${NC}"
    echo "  Start with: npm run dev"
fi
echo ""

# 7. Disk Space
echo -e "${BLUE}━━ Disk Usage ━━${NC}"
usage=$(df -h . | awk 'NR==2 {print $5}')
echo "Disk used: $usage"
if [[ "${usage%\%}" -gt 90 ]]; then
    echo -e "${RED}✗ Low disk space!${NC}"
else
    echo -e "${GREEN}✓ Sufficient disk space${NC}"
fi
echo ""

# 8. Test Environment Check
echo -e "${BLUE}━━ Test Configuration ━━${NC}"
if [ -f "package.json" ]; then
    has_jest=$(grep -q '"jest"' package.json && echo "true" || echo "false")
    has_supertest=$(grep -q '"supertest"' package.json && echo "true" || echo "false")
    
    if [ "$has_jest" = "true" ]; then
        echo -e "${GREEN}✓ Jest is installed${NC}"
    else
        echo -e "${YELLOW}⚠ Jest not in package.json${NC}"
    fi
    
    if [ "$has_supertest" = "true" ]; then
        echo -e "${GREEN}✓ Supertest is installed${NC}"
    else
        echo -e "${YELLOW}⚠ Supertest not in package.json (needed for API tests)${NC}"
    fi
fi
echo ""

# 9. Performance Recommendations
echo -e "${BLUE}━━ Performance Recommendations ━━${NC}"

recommendations_made=0

# Check DEMO_MODE
if grep -q "DEMO_MODE=false" .env 2>/dev/null; then
    echo -e "${YELLOW}→ Set DEMO_MODE=true${NC} to skip real Flutterwave API calls"
    recommendations_made=$((recommendations_made + 1))
fi

# Check node memory
if ! grep -q "max-old-space-size" package.json; then
    echo -e "${YELLOW}→ Increase Node.js heap size:${NC} NODE_OPTIONS='--max-old-space-size=4096' npm test"
    recommendations_made=$((recommendations_made + 1))
fi

# Check database
if grep -q "DB_POOL_SIZE=1" .env 2>/dev/null; then
    echo -e "${YELLOW}→ Increase database pool size:${NC} DB_POOL_SIZE=10 in .env"
    recommendations_made=$((recommendations_made + 1))
fi

# Check timeouts
if ! grep -q "JEST_TIMEOUT\|TEST_TIMEOUT" .env 2>/dev/null; then
    echo -e "${YELLOW}→ Add timeout config:${NC} TEST_TIMEOUT=5000 in .env"
    recommendations_made=$((recommendations_made + 1))
fi

if [ $recommendations_made -eq 0 ]; then
    echo -e "${GREEN}✓ All recommendations already applied!${NC}"
fi
echo ""

# 10. Quick Start Guide
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Quick Start                                               ║${NC}"
echo -e "${YELLOW}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}1. Start the server:${NC}"
echo "   npm run dev"
echo ""
echo -e "${BLUE}2. Run fast API tests (in another terminal):${NC}"
echo "   bash tests/test-flutterwave-fast.sh"
echo ""
echo -e "${BLUE}3. Run all tests:${NC}"
echo "   npm test"
echo ""
echo -e "${BLUE}4. Run with performance profiling:${NC}"
echo "   NODE_OPTIONS='--max-old-space-size=4096' npm test -- --detectOpenHandles"
echo ""
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
