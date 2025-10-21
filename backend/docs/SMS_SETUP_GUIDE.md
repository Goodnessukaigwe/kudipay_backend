# SMS Setup Guide - Africa's Talking Sandbox

## 📱 SMS Integration Complete!

### What Was Implemented:
✅ SMS notifications for:
- **Registration** - Welcome message with wallet address
- **Balance Check** - SMS with current balances sent every time balance is checked
- **Money Sent** - Confirmation to sender with transaction details
- **Money Received** - Notification to recipient with sender info
- **Currency Conversion** - Conversion details and rates
- **Withdrawals** - Status updates (processing/completed/failed)

---

## 🔧 Setup Steps for SMS Testing

### Step 1: Add Your Phone as a Test Number

Since you're using **SANDBOX mode**, you need to register test phone numbers:

1. Go to: https://account.africastalking.com/apps/sandbox/test/numbers
2. Click "Add Test Number"
3. Enter your phone number: `+2347083247105`
4. You'll receive a verification SMS with a code
5. Enter the code to verify
6. ✅ Your number is now whitelisted for sandbox SMS!

**Without this step**: SMS will fail silently (API will accept but won't deliver)

---

### Step 2: Test SMS Service

```bash
cd /home/otowo-samuel/Documents/kudipay_backend/backend

# Run SMS test script
node scripts/test_sms.js
```

You should receive 3 test SMS messages on your phone!

---

### Step 3: Test via USSD Flow

Now your USSD app will automatically send SMS:

1. **Register** (Option 1): SMS with wallet address
2. **Check Balance** (Option 2): SMS with balance details
3. **Send Money** (Option 3): SMS to both sender and receiver

---

## 📝 Environment Variables

Already configured in your `.env`:
```
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=atsk_a19d2f1936d5320eb5b99d84834d22764ff25a005fcb52f02eefe2884b603e85a0b1435b
```

Optional (for custom sender ID):
```
SMS_SENDER_ID=KudiPay
```

---

## 🚀 Going to Production

When ready for real users:

1. **Upgrade to Production**:
   - Go to https://account.africastalking.com
   - Switch from Sandbox to Production app
   - Top up your account (SMS costs ~₦2-4 per message)

2. **Update Environment**:
   ```
   NODE_ENV=production
   AFRICAS_TALKING_USERNAME=YourProductionUsername
   AFRICAS_TALKING_API_KEY=YourProductionAPIKey
   ```

3. **No code changes needed** - SMS will work with all numbers automatically!

---

## 🧪 Testing Checklist

- [ ] Add test phone number in AT dashboard
- [ ] Verify phone number with SMS code
- [ ] Run `node scripts/test_sms.js`
- [ ] Check phone for 3 test messages
- [ ] Test via USSD registration flow
- [ ] Test via USSD balance check
- [ ] Test via USSD send money (with another test number)

---

## 📊 SMS Message Examples

### Registration:
```
Welcome to KudiPay! 🎉

Your wallet has been created successfully.

Wallet Address:
0x810d9Db7E1298D274df6eBC2Ba84eE81029b517D

You can now:
- Send & receive money
- Convert currencies
- Check balance

Dial *384*73588# to get started!
```

### Balance Check:
```
KudiPay Balance 💰

Wallet: 0x810d9Db...29b517D

NGN: ₦50,000.00
USD: $50.00
ETH: 0.025000

Last checked: Oct 21, 2025, 1:30 AM
```

### Money Received:
```
Money Received! 💸

You received ₦10,000.00
From: +2348012345678

Transaction: 0x4aef1dd...

Check your balance:
Dial *384*73588# → Option 2
```

---

## ⚠️ Sandbox Limitations

| Feature | Sandbox | Production |
|---------|---------|------------|
| Cost | Free | ~₦2-4 per SMS |
| Recipients | Test numbers only | Any number |
| Message Limit | No limit | Depends on balance |
| Sender ID | "AFRICASTKNG" | Custom (KudiPay) |
| Delivery Reports | Yes | Yes |

---

## 🔍 Troubleshooting

### SMS not received?
1. ✅ Check phone is added as test number in dashboard
2. ✅ Verify phone number is verified (check for verification SMS)
3. ✅ Check logs: `tail -f backend/logs/combined.log`
4. ✅ Ensure API key is correct in `.env`

### SMS says "Failed"?
- In sandbox, this usually means phone isn't whitelisted
- Check error message in logs for details

### Want to test with multiple phones?
- Add each phone as a test number in AT dashboard
- Each needs verification

---

## 📞 Support

- AT Docs: https://developers.africastalking.com/docs/sms/overview
- AT Dashboard: https://account.africastalking.com
- Help Center: https://help.africastalking.com

---

## 🎯 Next Steps

1. Add your phone as test number: https://account.africastalking.com/apps/sandbox/test/numbers
2. Run: `node scripts/test_sms.js`
3. Test registration via USSD: `*384*73588#`
4. Check your phone for SMS! 📱

