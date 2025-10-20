# Testing KudiPay with Africa's Talking Simulator

## 🚀 Complete Testing Guide

This guide will walk you through testing your complete KudiPay app (including the FX engine) using Africa's Talking simulator.

---

## ✅ Pre-Test Checklist

### 1. Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 2. Verify ngrok Tunnel
```bash
# Check ngrok status
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep public_url

# Or check processes
pgrep -la ngrok
```

### 3. Get Current ngrok URL
```bash
# Get your current public URL
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep -A 1 "https"
```

**Your callback URL should be:** `https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback`

---

## 🔧 Setup Steps

### Step 1: Ensure Backend is Running
If not running, start it:
```bash
cd /home/otowo-samuel/Documents/kudipay_backend/backend
node src/index.js
# Or with nodemon:
npm run dev
```

### Step 2: Start/Restart ngrok
If ngrok is not running:
```bash
ngrok http 3000
```

**Note:** If you restart ngrok, your URL will change and you'll need to update Africa's Talking dashboard!

### Step 3: Update Africa's Talking Dashboard
1. Go to: https://account.africastalking.com/apps/sandbox/ussd/callback
2. Update callback URL to: `https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback`
3. Ensure USSD code is: `*384*73588#`

---

## 🧪 Testing Scenarios

### Test 1: Welcome Screen
**Steps:**
1. Open AT Simulator: https://simulator.africastalking.com/
2. Enter your phone number: `+254700000000` (or any test number)
3. Dial: `*384*73588#`

**Expected Output:**
```
CON Welcome to KudiPay! Choose an option:
0. Exit
1. Register Phone Number
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help & Support
```

**✅ Pass:** Menu displays correctly
**❌ Fail:** Error message or no response

---

### Test 2: Register Phone Number
**Steps:**
1. From main menu, enter: `1`
2. Enter PIN (6 digits): `123456`
3. Confirm PIN: `123456`

**Expected Flow:**
```
CON Enter your 6-digit PIN:
> 123456

CON Confirm your PIN:
> 123456

END ✅ Phone number registered successfully!
Your KudiPay wallet is ready to use.
```

**What Happens Behind the Scenes:**
- Phone number hashed and stored in database
- PIN encrypted and saved
- Blockchain wallet created (or linked)
- Session saved to `ussd_sessions` table

**✅ Pass:** Registration successful, check database:
```bash
sudo -u postgres psql -d kudipay -c "SELECT phone_number, pin_hash FROM users WHERE phone_number LIKE '%254700000000%' LIMIT 1;"
```

---

### Test 3: Check Balance (Without FX)
**Steps:**
1. Dial: `*384*73588#`
2. Enter: `2` (Check Balance)
3. Enter PIN: `123456`

**Expected Output:**
```
CON Your KudiPay Balance:
💰 NGN: ₦0.00
💵 USD: $0.00
🪙 USDC: 0.00
⚡ ETH: 0.00
```

**✅ Pass:** Balance shows (even if zero)
**❌ Fail:** Error or "Invalid PIN"

---

### Test 4: FX Conversion Test (The Important One!)
This tests your newly fixed FX engine.

**Setup:** First, you need to add test funds to a wallet
```bash
# Add test balance via database
sudo -u postgres psql -d kudipay << EOF
UPDATE wallets 
SET usdc_balance = 1000, updated_at = NOW() 
WHERE phone_number = (
  SELECT phone_number FROM users WHERE phone_number LIKE '%254700000000%' LIMIT 1
);
EOF
```

**Steps:**
1. Dial: `*384*73588#`
2. Enter: `2` (Check Balance)
3. Enter PIN: `123456`

**Expected Output with FX:**
```
CON Your KudiPay Balance:
💰 NGN: ₦1,469,158.00  (1000 USDC × 1469.16 rate)
💵 USD: $1,000.00
🪙 USDC: 1000.00
⚡ ETH: 0.00

Last updated: 2025-10-20 22:50
```

**What This Tests:**
- ✅ FX engine fetching USD/NGN rate (1469.16)
- ✅ Converting USDC balance to NGN
- ✅ Real-time rate calculation
- ✅ All 3 providers working (Binance, Chainlink, Fallback)

**Check Logs:**
```bash
# Watch FX logs in real-time
tail -f logs/combined.log | grep -E "(FX|rate|conversion)"
```

**✅ Pass:** NGN value correctly calculated
**❌ Fail:** Shows $0 or error

---

### Test 5: Withdrawal with FX Conversion
**Steps:**
1. Dial: `*384*73588#`
2. Enter: `3` (Withdraw)
3. Choose currency: `1` (NGN) or `2` (USD)
4. Enter amount: `100000` (₦100,000 or $100)
5. Enter recipient phone: `+254722000000`
6. Enter PIN: `123456`
7. Confirm: `1` (Yes)

**Expected Flow:**
```
CON Withdraw Money
Choose currency:
1. NGN (Naira)
2. USD/USDC

> 1

CON Enter amount in NGN:
> 100000

CON Converting...
₦100,000 = $68.06 USDC
Exchange rate: 1 USD = ₦1,469.16

Recipient: +254722000000
Confirm? 1=Yes 2=No
```

**Behind the Scenes:**
- FX engine converts NGN → USD
- Checks if user has enough USDC
- Creates withdrawal transaction
- Updates balances

**✅ Pass:** Conversion accurate, transaction successful
**❌ Fail:** Wrong conversion rate

---

### Test 6: Transaction History
**Steps:**
1. Dial: `*384*73588#`
2. Enter: `4` (Transaction History)
3. Enter PIN: `123456`

**Expected Output:**
```
CON Recent Transactions:
1. Withdrawal: -₦100,000
   2025-10-20 22:45
   Status: ✅ Success

2. Deposit: +1000 USDC
   2025-10-20 21:30
   Status: ✅ Success

0. Back to menu
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network experiencing technical problems"
**Cause:** ngrok URL mismatch or backend not running

**Fix:**
```bash
# 1. Check backend
curl http://localhost:3000/health

# 2. Get ngrok URL
curl -s http://localhost:4040/api/tunnels | grep public_url

# 3. Test callback directly
curl -X POST https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+254700000000" \
  -d "text="
```

### Issue 2: FX Rates Show as $0 or ₦0
**Cause:** FX providers failing

**Check:**
```bash
# Test FX engine directly
node test-all-conversions.js

# Check logs
tail -20 logs/error.log | grep FX
```

**Fix:** Should be already fixed! But verify:
- Binance API accessible
- ExchangeRate-API working
- Fallback rate in .env: `FALLBACK_USD_NGN_RATE=1580`

### Issue 3: Invalid PIN
**Cause:** PIN comparison failing

**Fix:**
```bash
# Check if user exists
sudo -u postgres psql -d kudipay -c "SELECT * FROM users WHERE phone_number LIKE '%254700000000%';"

# Try re-registering with option 1
```

### Issue 4: Session Timeout
**Cause:** Taking too long to respond

**Fix:** Sessions timeout after 60 seconds. Complete flow faster or increase timeout in `ussdService.js`

---

## 📊 Monitoring During Tests

### Terminal 1: Backend Logs
```bash
cd backend
tail -f logs/combined.log
```

### Terminal 2: Error Logs
```bash
tail -f logs/error.log
```

### Terminal 3: Database Monitor
```bash
# Watch USSD sessions
watch -n 2 'sudo -u postgres psql -d kudipay -c "SELECT * FROM ussd_sessions ORDER BY created_at DESC LIMIT 5;"'
```

### Terminal 4: ngrok Inspector
Open browser: http://localhost:4040

Shows all HTTP requests in real-time!

---

## ✅ Success Criteria

### Your app is working if:
- ✅ Main menu loads instantly
- ✅ Registration creates user in database
- ✅ Balance shows with NGN conversion
- ✅ FX rates are accurate (±2% of real market)
- ✅ Withdrawals calculate correct conversions
- ✅ Transaction history displays
- ✅ All flows complete without errors

### FX Engine is working if:
- ✅ USD/NGN rate is ~1,469 (±50)
- ✅ USDC/NGN rate is ~1,469 (±50)
- ✅ ETH/NGN rate is ~5,850,000 (±100k)
- ✅ Conversions happen within 2 seconds
- ✅ No "Currency not supported" errors
- ✅ Fallback activates if Binance fails

---

## 🎯 Quick Test Script

Run this to test everything:
```bash
#!/bin/bash
echo "🧪 KudiPay Africa's Talking Test Suite"
echo "======================================"

# 1. Check backend
echo "1. Checking backend..."
curl -s http://localhost:3000/health && echo " ✅" || echo " ❌"

# 2. Check ngrok
echo "2. Checking ngrok..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok-free.app')
echo "   URL: $NGROK_URL"

# 3. Test USSD callback
echo "3. Testing USSD callback..."
curl -s -X POST "$NGROK_URL/api/ussd/callback" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test_$(date +%s)" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+254700000000" \
  -d "text=" | head -3

# 4. Test FX engine
echo -e "\n4. Testing FX engine..."
node test-all-conversions.js | grep -E "(passed|failed|PASSED)"

echo -e "\n✅ All checks complete!"
echo "📱 Now test in simulator: https://simulator.africastalking.com/"
echo "📞 Dial: *384*73588#"
```

Save as `test-at-integration.sh` and run:
```bash
chmod +x test-at-integration.sh
./test-at-integration.sh
```

---

## 🎉 Next Steps After Testing

1. **Monitor logs** during simulator tests
2. **Check database** to verify transactions saved
3. **Test edge cases**: wrong PIN, insufficient balance
4. **Test with real phone** (if whitelisted in AT sandbox)
5. **Deploy to production** when sandbox tests pass

---

## 📞 Support

If you encounter issues:
1. Check logs: `logs/combined.log` and `logs/error.log`
2. Verify ngrok URL matches AT dashboard
3. Run FX test: `node test-all-conversions.js`
4. Check this guide's troubleshooting section

**Everything should work now!** Your FX engine is fully fixed and tested. 🚀
