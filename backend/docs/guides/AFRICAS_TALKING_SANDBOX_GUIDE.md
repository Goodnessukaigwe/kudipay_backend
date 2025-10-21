# Africa's Talking Sandbox Testing Guide

## 🎯 Quick Start Guide

This guide will help you test your KudiPay USSD application with Africa's Talking sandbox environment.

---

## 📋 Step 1: Create Africa's Talking Account

1. **Sign up for free sandbox account**
   - Go to: https://account.africastalking.com/auth/register
   - Fill in your details
   - Verify your email
   - You'll automatically be in **Sandbox** mode (FREE for testing)

2. **Access your dashboard**
   - Login at: https://account.africastalking.com/auth/login
   - You should see "Sandbox" in the top menu

---

## 🔑 Step 2: Get Your API Credentials

1. **Navigate to Settings**
   - Click your username in top-right corner
   - Select **"Settings"** or **"API Key"**

2. **Your Sandbox Credentials**
   ```
   Username: sandbox
   API Key: Your unique key (starts with "atsk_")
   ```

3. **Copy your API Key and update `.env` file**
    ```bash
    AFRICAS_TALKING_USERNAME=sandbox         # Always 'sandbox' for testing
    AFRICAS_TALKING_API_KEY=your_actual_api_key_here  # Your sandbox API key
    USSD_SHORT_CODE=*384*1234#              # Must match the code assigned in the AT dashboard
    CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/ussd/callback  # Your public callback URL
    ``` USSD_SHORT_CODE=*384*1234#              # Must match the code assigned in the AT dashboard
    CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/ussd/callback  # Your public callback URL
    ```

    - `AFRICAS_TALKING_USERNAME`: Always 'sandbox' for sandbox testing.
    - `AFRICAS_TALKING_API_KEY`: Get this from your AT dashboard (starts with 'atsk_').
    - `USSD_SHORT_CODE`: Must match the code assigned to your channel in the AT dashboard (e.g., *384*1234#).
    - `CALLBACK_URL`: The public HTTPS URL (from ngrok or your server) that AT will call for USSD requests. Must end with `/api/ussd/callback`.

    > **Tip:** Keeping CALLBACK_URL in your `.env` makes it easy to update and copy into the Africa's Talking dashboard. If your ngrok URL changes, update both `.env` and the AT dashboard.

# Africa's Talking USSD Sandbox Testing Guide (2025)

This guide is a complete, up-to-date reference for testing your KudiPay USSD backend with Africa's Talking sandbox. It covers setup, .env, whitelisting, callback, simulator, troubleshooting, and production migration.

---

## 1. Create and Configure Your Africa's Talking Account

1. **Sign up or log in:**
   - Register at https://account.africastalking.com/auth/register
   - Log in at https://account.africastalking.com/auth/login
   - You will be in **Sandbox** mode by default (free for testing)

2. **Get your API credentials:**
   - Go to your dashboard > Settings > API Key
   - Copy your API Key (starts with `atsk_`)
   - Username for sandbox is always `sandbox`

3. **Update your `.env` file:**
   ```env
   AFRICAS_TALKING_USERNAME=sandbox
   AFRICAS_TALKING_API_KEY=your_sandbox_api_key
   USSD_SHORT_CODE=*384*1234#   # Use the code assigned in the dashboard
   CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/ussd/callback
   ```
   - Replace `your_sandbox_api_key` with your actual key
   - Replace `*384*1234#` with your assigned code
   - Replace CALLBACK_URL with your ngrok/public HTTPS URL

   > **If your ngrok URL changes, update both `.env` and the AT dashboard!**

---

## 2. Whitelist Your Test Phone Numbers (for Real Device Testing)

1. Go to https://account.africastalking.com/apps/sandbox/testnumbers
2. Add your phone number(s) in international format (e.g., +2348054969639)
3. Only whitelisted numbers can use the sandbox USSD code on a real phone

> **Note:** The AT simulator does not require whitelisting.

---

## 3. Get a USSD Code (Channel)

1. In the dashboard, go to **USSD** > Channels: https://account.africastalking.com/apps/sandbox/ussd/channels
2. Click **Create Channel**
3. Fill in the details (Name, Channel Type)
4. Save and note your assigned code (e.g., *384*1234#)
5. Update your `.env` and use this code in all requests

---

## 4. Expose Your Backend (ngrok or Public Server)

Your backend must be accessible from the internet for AT to send requests.

**Using ngrok:**
```bash
snap install ngrok   # or download from https://ngrok.com/download
ngrok http 3000      # if your backend runs on port 3000
```
Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)

Update your `.env` and AT dashboard with this URL as CALLBACK_URL.

---

## 5. Set Callback URL in Africa's Talking Dashboard

1. Go to **USSD** > Channels > Your Channel > Settings
2. Set the callback URL to:
   ```
   https://your-ngrok-url.ngrok-free.app/api/ussd/callback
   ```
   - Must be HTTPS
   - Must end with `/api/ussd/callback`
   - Must match your `.env` CALLBACK_URL
3. Save changes

---

## 6. Test Your Integration

### a. Backend Health Check
```bash
curl http://localhost:3000/api/ussd/test-menu
curl https://your-ngrok-url.ngrok-free.app/api/ussd/test-menu
```
Should return a JSON with `success: true` and your menu.

### b. Simulate USSD Request (Manual)
```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=ATUid_test123" \
  -d "serviceCode=*384*1234#" \
  -d "phoneNumber=+2348054969639" \
  -d "text="
```
Should return a plain text menu starting with `CON`.

### c. Use the Africa's Talking Simulator
1. Go to https://developers.africastalking.com/simulator
2. Select **USSD** tab
3. Enter your phone number (any format)
4. Enter your callback URL
5. Click **Dial**
6. Test all menu flows

### d. Test with a Real Phone (if whitelisted)
1. Dial your assigned USSD code (e.g., *384*1234#)
2. Test registration, balance, and all flows

---

## 7. USSD Callback & Response Format

- AT sends POST requests to your CALLBACK_URL with:
  - `sessionId`, `serviceCode`, `phoneNumber`, `text`
- Requests are `application/x-www-form-urlencoded`
- Your backend must respond with:
  - Plain text
  - Start with `CON` (continue) or `END` (end session)
  - Set header: `Content-Type: text/plain`

**Example:**
```javascript
res.set('Content-Type', 'text/plain');
res.send('CON Welcome to KudiPay!\n1. Register\n2. Check Balance');
```

---

## 8. Monitoring & Debugging

- Check backend logs: `tail -f logs/combined.log`
- Check error logs: `tail -f logs/error.log`
- Use ngrok inspector: http://localhost:4040
- Check AT dashboard: USSD > Logs

---

## 9. Common Issues & Solutions

**Service Unavailable / No Response:**
- Backend not running
- ngrok tunnel closed
- Callback URL incorrect or not HTTPS
- `.env` missing required variables
- Phone number not whitelisted (for real device)

**Invalid Response Format:**
- Response does not start with `CON` or `END`
- Not plain text or wrong content type

**Not Allowed (on phone):**
- Your number is not whitelisted in sandbox

**Session Timeout:**
- User took too long to respond (AT sessions expire after 30-60s)

**Phone Number Format Issues:**
- Always use international format for whitelisting and requests

---

## 10. Testing Checklist

- [ ] Backend running on port 3000
- [ ] ngrok tunnel active and HTTPS URL copied
- [ ] `.env` file updated with AT credentials
- [ ] Callback URL set in AT dashboard
- [ ] Database running and tables created
- [ ] Test endpoint returns success
- [ ] Simulator test successful
- [ ] Main menu displays correctly
- [ ] Registration flow works
- [ ] PIN validation works
- [ ] Balance check works
- [ ] Transaction history works
- [ ] Error messages are user-friendly
- [ ] Logs show requests/responses
- [ ] Phone normalization working

---

## 11. Test Scenarios

**New User Registration:**
1. Dial USSD code
2. Select option 1 (Register)
3. Enter PIN: 1234
4. Confirm PIN: 1234
5. See success message
6. Check database for new user

**Check Balance:**
1. Dial USSD code
2. Select option 2 (Check Balance)
3. Enter PIN: 1234
4. See balance displayed

**Invalid PIN:**
1. Dial USSD code
2. Select option 2 (Check Balance)
3. Enter wrong PIN: 9999
4. See error message
5. After 3 attempts, account locked

**Session Interruption:**
1. Dial USSD code
2. Select option 1
3. Wait 60+ seconds
4. Session should timeout gracefully
5. Redial should start fresh

---

## 12. Security & Production Migration

**Sandbox Limitations:**
- Free to use
- Test with real phones (whitelisted only)
- Full API access
- Limited to test numbers
- Not for production use
- May have rate limits

**What NOT to do in Sandbox:**
- Do not use real user data
- Do not process real money
- Do not store sensitive production data
- Do not give access to real customers

**Moving to Production:**
1. Apply for production access in AT dashboard
2. Complete KYC verification
3. Upgrade to paid plan
4. Get production USSD code
5. Update credentials in `.env`
6. Deploy to a public, always-on server (not ngrok)
7. Remove test numbers and data

---

## 13. Support & Resources

- [Africa's Talking Documentation](https://developers.africastalking.com/docs)
- [Community Forum](https://community.africastalking.com/)
- [Help Center](https://help.africastalking.com/)
- [Status Page](https://status.africastalking.com/)
- [Email Support](mailto:support@africastalking.com)
- [Slack](https://slackin-africastalking.herokuapp.com/)
- [Twitter](https://twitter.com/Africastalking)

---

## 14. Quick Command Reference

```bash
# Start backend
cd /home/otowo-samuel/Documents/kudipay_backend/backend
npm start

# Start ngrok
ngrok http 3000

# Test local endpoint
curl http://localhost:3000/api/ussd/test-menu

# Test via ngrok
curl https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/test-menu

# Simulate USSD request
curl -X POST https://YOUR-NGROK-URL.ngrok-free.app/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123" \
  -d "serviceCode=*384*1234#" \
  -d "phoneNumber=+2348054969639" \
  -d "text="

# Watch logs
tail -f logs/combined.log

# Check database
psql -U postgres -d kudipay

# Check ngrok requests
open http://localhost:4040
```

---

## 15. Success Indicators

Your setup is working if:
1. Test endpoint returns success
2. USSD menu displays correctly
3. You can register a phone number
4. PIN validation works
5. Balance check returns a value
6. Logs show incoming requests
7. Database records are created
8. No errors in error.log
9. AT dashboard shows successful sessions
10. Users can complete full workflows

---

**Good luck! Your KudiPay USSD service is now ready for full sandbox testing with Africa's Talking.**

