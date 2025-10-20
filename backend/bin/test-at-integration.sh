#!/bin/bash
# KudiPay Africa's Talking Integration Test Script

echo "🧪 KudiPay Africa's Talking Test Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check backend
echo -n "1. Checking backend health... "
if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   Start with: cd backend && node src/index.js"
    exit 1
fi

# 2. Check ngrok
echo -n "2. Checking ngrok tunnel... "
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok-free.app' | head -1)
if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Not running${NC}"
    echo "   Start with: ngrok http 3000"
    exit 1
else
    echo -e "${GREEN}✅ Active${NC}"
    echo "   URL: $NGROK_URL"
fi

# 3. Test USSD callback
echo -n "3. Testing USSD callback endpoint... "
RESPONSE=$(curl -s -X POST "$NGROK_URL/api/ussd/callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "ngrok-skip-browser-warning: true" \
  -d "sessionId=test_$(date +%s)" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+254700000000" \
  -d "text=")

if echo "$RESPONSE" | grep -q "Welcome to KudiPay"; then
    echo -e "${GREEN}✅ Working${NC}"
    echo "   Response: $(echo $RESPONSE | head -c 50)..."
else
    echo -e "${RED}❌ Failed${NC}"
    echo "   Response: $RESPONSE"
fi

# 4. Test FX engine
echo ""
echo "4. Testing FX Engine..."
echo "   Running comprehensive FX tests..."
if node test-all-conversions.js 2>&1 | grep -q "ALL TESTS PASSED"; then
    echo -e "   ${GREEN}✅ FX Engine Working Perfectly${NC}"
    
    # Show sample rates
    echo ""
    echo "   📊 Current Exchange Rates:"
    node -e "
    const BinanceProvider = require('./src/services/fx/providers/BinanceProvider');
    const binance = new BinanceProvider();
    
    (async () => {
      try {
        const usdNgn = await binance.getRate('USD', 'NGN');
        const usdcNgn = await binance.getRate('USDC', 'NGN');
        const ethNgn = await binance.getRate('ETH', 'NGN');
        
        console.log('   • 1 USD  = ₦' + usdNgn.toLocaleString('en-NG', {maximumFractionDigits: 2}));
        console.log('   • 1 USDC = ₦' + usdcNgn.toLocaleString('en-NG', {maximumFractionDigits: 2}));
        console.log('   • 1 ETH  = ₦' + (ethNgn/1000000).toFixed(2) + 'M');
      } catch(e) {
        console.log('   Error fetching rates:', e.message);
      }
    })();
    " 2>/dev/null
else
    echo -e "   ${YELLOW}⚠️  Some tests failed (check details above)${NC}"
fi

# 5. Check database
echo ""
echo -n "5. Checking database connection... "
if sudo -u postgres psql -d kudipay -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connected${NC}"
    
    # Count users
    USER_COUNT=$(sudo -u postgres psql -d kudipay -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    echo "   Registered users: $USER_COUNT"
else
    echo -e "${YELLOW}⚠️  Cannot check (sudo required)${NC}"
fi

# 6. Environment check
echo ""
echo "6. Environment Configuration:"
echo "   • USSD Code: *384*73588#"
echo "   • Callback URL: $NGROK_URL/api/ussd/callback"
echo "   • Database: kudipay"
echo ""

# Final instructions
echo "========================================"
echo -e "${GREEN}✅ All checks complete!${NC}"
echo ""
echo "🎯 Next Steps:"
echo "1. Update Africa's Talking Dashboard:"
echo "   URL: https://account.africastalking.com/apps/sandbox/ussd/callback"
echo "   Callback: $NGROK_URL/api/ussd/callback"
echo ""
echo "2. Open AT Simulator:"
echo "   URL: https://simulator.africastalking.com/"
echo "   Dial: *384*73588#"
echo "   Phone: +254700000000 (or any test number)"
echo ""
echo "3. Monitor logs:"
echo "   Terminal 1: tail -f logs/combined.log"
echo "   Terminal 2: tail -f logs/error.log"
echo "   Browser: http://localhost:4040 (ngrok inspector)"
echo ""
echo "📖 Full testing guide: TESTING_WITH_AT_SIMULATOR.md"
echo ""
