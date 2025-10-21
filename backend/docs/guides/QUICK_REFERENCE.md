# 🚀 Quick Reference - Africa's Talking Sandbox Testing

## Quick Start (5 Minutes)

### 1. Get Credentials
- Sign up: https://account.africastalking.com/auth/register
- Username: `sandbox`
- Get API Key from Settings

### 2. Update .env
```bash
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your_key_here
```

### 3. Start Backend
```bash
cd /home/otowo-samuel/Documents/kudipay_backend/backend
npm start
```

### 4. Expose with ngrok
```bash
# Install ngrok
snap install ngrok

# Start tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
```

### 5. Configure AT Dashboard
- Go to: https://account.africastalking.com/apps/sandbox/ussd/channels
- Create channel
- Set callback: `https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback`

### 6. Test!
```bash
# Run automated test
./test-africas-talking.sh

# Or test manually
./test-ussd-manually.sh
```

---

## Testing Commands

### Quick Tests
```bash
# Test local endpoint
curl http://localhost:3000/api/ussd/test-menu

# Test main menu
curl -X POST http://localhost:3000/api/ussd/callback \
  -d "sessionId=test123" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+2348054969639" \
  -d "text="

# Test registration
curl -X POST http://localhost:3000/api/ussd/callback \
  -d "sessionId=test123" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+2348054969639" \
  -d "text=1"
```

### Check Status
```bash
# Backend running?
curl http://localhost:3000/api/ussd/test-menu

# ngrok running?
curl http://localhost:4040/api/tunnels

# Database running?
psql -U postgres -d kudipay -c "SELECT COUNT(*) FROM users;"
```

### Monitor
```bash
# Watch logs
tail -f logs/combined.log

# Watch errors
tail -f logs/error.log

# ngrok inspector
open http://localhost:4040
```

---

## USSD Response Format

### Continue Session (show menu)
```
CON Welcome to KudiPay
1. Option One
2. Option Two
```

### End Session (show message)
```
END Thank you for using KudiPay!
```

---

## Testing Checklist

- [ ] Backend running (`npm start`)
- [ ] ngrok tunnel active (`ngrok http 3000`)
- [ ] .env has AT credentials
- [ ] Callback URL set in AT dashboard
- [ ] Database is running
- [ ] Test endpoint returns success
- [ ] Main menu displays
- [ ] Can register phone number
- [ ] PIN validation works
- [ ] Balance check works

---

## Common URLs

- **AT Dashboard**: https://account.africastalking.com
- **AT Simulator**: https://developers.africastalking.com/simulator
- **AT Docs**: https://developers.africastalking.com/docs
- **ngrok Inspector**: http://localhost:4040
- **Your Backend**: http://localhost:3000

---

## Troubleshooting One-Liners

```bash
# Restart everything
pkill node && pkill ngrok && npm start & ngrok http 3000

# Check logs for errors
grep -i error logs/combined.log | tail -20

# Test database
psql -U postgres -d kudipay -c "\dt"

# Get ngrok URL
curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*'
```

---

## Phone Testing (Real Device)

1. Get USSD code from AT dashboard (e.g., `*384*73588#`)
2. Dial the code from your phone
3. Follow the menu
4. Check logs: `tail -f logs/combined.log`

---

## Test Scenarios

### New User
```
Dial → 1 → 1234 → 1234 → Success
```

### Check Balance  
```
Dial → 2 → 1234 → See balance
```

### Wrong PIN
```
Dial → 2 → 9999 → Error
```

---

## Support

- **Full Guide**: `AFRICAS_TALKING_SANDBOX_GUIDE.md`
- **AT Help**: https://help.africastalking.com
- **AT Community**: https://community.africastalking.com

---

**Ready to test? Run:**
```bash
./test-africas-talking.sh
```
