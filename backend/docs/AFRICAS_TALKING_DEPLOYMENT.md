# Africa's Talking Sandbox Deployment Guide

## 🎯 Objective

Deploy KudiPay USSD service to Africa's Talking sandbox for testing with real phones.

---

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Africa's Talking account (sign up at https://account.africastalking.com/auth/register)
- [ ] Backend server running and accessible via public URL
- [ ] Database configured and migrations run
- [ ] npm dependencies installed (`npm install` completed)

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Africa's Talking Account

1. **Go to Africa's Talking**

   - URL: https://account.africastalking.com/auth/register
   - Or login if you already have an account: https://account.africastalking.com/auth/login

2. **Sign Up for Sandbox**

   - Click "Get Started" or "Sign Up"
   - Fill in your details:
     - Email address
     - Password
     - Company name (can be "KudiPay" or your name)
     - Country (Nigeria)
   - Verify your email

3. **Access Sandbox Dashboard**
   - After login, you'll be in the **Sandbox** environment by default
   - The sandbox is FREE and perfect for testing

---

### Step 2: Get Your API Credentials

1. **Navigate to Settings**

   - Click on your profile/username in the top right
   - Select "Settings" or "API Key"

2. **Generate/View API Key**

   ```
   Username: sandbox
   API Key: [Your API Key - looks like: atsk_xxxxxxxxxxxxxxxxxxxx]
   ```

3. **Copy Your Credentials**
   - Save these in a secure location
   - You'll need them for your `.env` file

---

### Step 3: Configure USSD Code

1. **Go to USSD Section**

   - In the left sidebar, click **"USSD"**
   - Or navigate to: https://account.africastalking.com/apps/sandbox/ussd/channels

2. **Create USSD Channel**
   - Click **"Create Channel"** or **"New USSD Code"**
3. **Configure USSD Code**

   ```
   USSD Code: Will be auto-assigned (e.g., *384*1234#)
   Channel Name: KudiPay
   Service Type: USSD Push
   ```

4. **Note Your USSD Code**
   - Example: `*384*1234#`
   - This is what users will dial to access your service
   - **Save this code!**

---

### Step 4: Set Up Public URL for Callback

Your backend needs to be accessible from the internet so Africa's Talking can send requests.

#### Option A: Using ngrok (Quick Testing)

1. **Install ngrok**

   ```bash
   # Download from https://ngrok.com/download
   # Or install via npm
   npm install -g ngrok
   ```

2. **Start Your Backend**

   ```bash
   cd /home/vahalla/Desktop/kudipay_backend/backend
   npm start
   ```

   - Your server should be running on port 3000 (or your configured port)

3. **Start ngrok**

   ```bash
   # In a new terminal
   ngrok http 3000
   ```

4. **Copy the Public URL**

   ```
   ngrok output will show:
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000

   Copy: https://abc123.ngrok.io
   ```

#### Option B: Using Render/Heroku (Production-like)

**Render Deployment:**

1. Go to https://render.com
2. Sign up/login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: kudipay-backend
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Add environment variables (see Step 5)
6. Deploy
7. Copy your Render URL: `https://kudipay-backend.onrender.com`

---

### Step 5: Configure Environment Variables

Update your `.env` file:

```bash
# Africa's Talking Configuration
AT_USERNAME=sandbox
AT_API_KEY=your_api_key_here
AT_USSD_CODE=*384*1234#

# Callback URL (ngrok or production URL)
CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/ussd/callback
# OR
CALLBACK_URL=https://kudipay-backend.onrender.com/api/ussd/callback

# Database
DATABASE_URL=postgresql://user:password@host:5432/kudipay

# Other configs
NODE_ENV=development
PORT=3000
PHONE_SALT=your-secure-salt-here
```

**Important**:

- Replace `your_api_key_here` with your actual API key from Step 2
- Replace `your-ngrok-url.ngrok.io` with your actual public URL
- Keep `AT_USERNAME=sandbox` for testing

---

### Step 6: Set Callback URL in Africa's Talking

1. **Go Back to USSD Channel Settings**

   - Dashboard → USSD → Your Channel

2. **Set Callback URL**

   ```
   Callback URL: https://your-ngrok-url.ngrok.io/api/ussd/callback
   ```

   - This is where Africa's Talking will send USSD requests
   - Must be HTTPS (ngrok provides this automatically)
   - Must be publicly accessible

3. **Save Configuration**

---

### Step 7: Run Database Migrations

Ensure your database has all necessary tables:

```bash
cd /home/vahalla/Desktop/kudipay_backend/backend

# Run schema
psql -U your_username -d your_database -f schema.sql

# Run migrations
psql -U your_username -d your_database -f migrations/add_pin_security.sql
psql -U your_username -d your_database -f migrations/fx_conversions.sql
```

---

### Step 8: Test Your Deployment

#### Test 1: Health Check

```bash
# Test if your backend is accessible
curl https://your-ngrok-url.ngrok.io/api/ussd/test-menu

# Expected response:
{
  "success": true,
  "data": {
    "menu": "CON Welcome to KudiPay! Choose an option:...",
    "timestamp": "2025-10-19T..."
  }
}
```

#### Test 2: Simulate USSD Request

```bash
# Test callback endpoint
curl -X POST https://your-ngrok-url.ngrok.io/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=ATUid_12345" \
  -d "serviceCode=*384*1234#" \
  -d "phoneNumber=08054969639" \
  -d "text="

# Expected response:
CON Welcome to KudiPay
1. Register Phone Number
2. Check Balance
3. Withdraw Money
4. Transaction History
5. Help & Support
0. Exit
```

---

### Step 9: Test on Real Phone

1. **Dial Your USSD Code**

   ```
   Dial: *384*1234#
   (Use your assigned code from Step 3)
   ```

2. **Expected Flow**

   ```
   Screen 1: Main Menu
   Welcome to KudiPay
   1. Register Phone Number
   2. Check Balance
   3. Withdraw Money
   4. Transaction History
   5. Help & Support
   0. Exit
   ```

3. **Test Registration**

   - Press `1` for Register
   - Enter 4-digit PIN
   - Confirm PIN
   - Should see: "Registration successful!"

4. **Test Other Features**
   - Check Balance (option 2)
   - Transaction History (option 4)
   - Help (option 5)

---

## 🔍 Debugging & Monitoring

### Check Logs

```bash
# Watch your backend logs
tail -f logs/combined.log

# Or if using PM2
pm2 logs kudipay-backend
```

### Check Africa's Talking Logs

1. Go to Dashboard → USSD → Logs
2. View all USSD requests and responses
3. Check for errors or failed requests

### Common Issues & Solutions

#### Issue 1: "Service Unavailable"

**Cause**: Backend not accessible  
**Solution**:

- Check if backend is running: `curl http://localhost:3000/api/ussd/test-menu`
- Check if ngrok is running: `curl https://your-ngrok-url.ngrok.io`
- Verify callback URL in AT dashboard matches ngrok URL

#### Issue 2: "Invalid Response Format"

**Cause**: Backend returning wrong format  
**Solution**:

- USSD responses must start with `CON` (continue) or `END` (terminate)
- Check `Content-Type: text/plain` header is set
- Verify no JSON is being returned

#### Issue 3: "Session Timeout"

**Cause**: User takes too long to respond  
**Solution**:

- AT sessions timeout after 30-60 seconds
- Implement session persistence in database
- Handle expired sessions gracefully

#### Issue 4: "Phone Number Not Normalizing"

**Cause**: AT sending phone in unexpected format  
**Solution**:

- Check logs to see format AT is sending
- Our normalization handles all formats, but log it for confirmation
- Add logging: `logger.info('Received phone:', phoneNumber)`

---

## 📊 Monitoring Checklist

During testing, monitor:

- [ ] Request/response logs in backend
- [ ] Database session creation
- [ ] User registration working
- [ ] PIN validation working
- [ ] Phone normalization working
- [ ] Error messages clear to users
- [ ] Session cleanup happening
- [ ] Response times < 2 seconds

---

## 🎛️ Africa's Talking Dashboard Features

### 1. **USSD Logs**

- View all requests/responses
- Check errors
- Monitor usage

### 2. **Simulator**

- Test USSD without phone
- Debug flows
- Test edge cases

### 3. **SMS (Future)**

- Send transaction confirmations
- Send OTP for verification
- Send withdrawal notifications

---

## 🔒 Security Notes

### Sandbox vs Production

**Sandbox (Testing)**:

- ✅ Free to use
- ✅ Test with real phones
- ✅ Limited to test numbers
- ⚠️ Not for real transactions

**Production (Live)**:

- 💰 Requires payment setup
- 🔒 Full security audit needed
- 📱 Available to all users
- ✅ Real money transactions

### Security Checklist Before Production

- [ ] Hash PINs with bcrypt
- [ ] Encrypt private keys in database
- [ ] Use HTTPS for callback (enforced by AT)
- [ ] Implement rate limiting
- [ ] Add request signing/verification
- [ ] Enable error monitoring (Sentry)
- [ ] Set up alerts for suspicious activity
- [ ] Implement transaction limits
- [ ] Add fraud detection

---

## 📱 Test Scenarios to Verify

### Scenario 1: New User Registration

```
1. Dial *384*1234#
2. Select: 1 (Register)
3. Enter PIN: 1234
4. Confirm PIN: 1234
5. ✅ See: "Registration successful!"
```

### Scenario 2: Existing User Login

```
1. Dial *384*1234#
2. Select: 2 (Check Balance)
3. ✅ See: "Your balance: ₦0.00"
```

### Scenario 3: Invalid Input

```
1. Dial *384*1234#
2. Select: 9 (invalid option)
3. ✅ See: "Invalid option. Please try again."
```

### Scenario 4: PIN Validation

```
1. Register user
2. Try withdrawal
3. Enter wrong PIN 3 times
4. ✅ Account locked for 30 minutes
```

### Scenario 5: Session Timeout

```
1. Dial *384*1234#
2. Wait 60 seconds
3. Enter option
4. ✅ Session expired, restart
```

---

## 🎯 Success Criteria

Your deployment is successful when:

- [x] Users can dial USSD code
- [x] Main menu displays correctly
- [x] Registration flow works
- [x] Phone numbers normalize automatically
- [x] PIN security works (3 attempts → lock)
- [x] Balance check works
- [x] Sessions persist
- [x] Error messages are clear
- [x] Logs show all activity
- [x] No crashes or errors

---

## 📞 Support Resources

### Africa's Talking Support

- Documentation: https://developers.africastalking.com/
- USSD Docs: https://developers.africastalking.com/docs/ussd
- Support Email: support@africastalking.com
- Community: https://community.africastalking.com/

### Useful Links

- API Explorer: https://developers.africastalking.com/simulator
- Sandbox Dashboard: https://account.africastalking.com/apps/sandbox
- Status Page: https://status.africastalking.com/

---

## 🔄 Next Steps After Successful Testing

1. **Document Issues**

   - Note any bugs found
   - List UX improvements needed
   - Record performance issues

2. **Iterate on Feedback**

   - Fix bugs
   - Improve error messages
   - Optimize response times

3. **Prepare for Production**

   - Complete payment integration
   - Implement all security features
   - Set up monitoring
   - Create runbook

4. **Production Deployment**
   - Move to production AT account
   - Get production USSD code
   - Deploy to production server
   - Launch to limited beta users

---

## 📝 Quick Reference

```bash
# Start Backend
cd /home/vahalla/Desktop/kudipay_backend/backend
npm start

# Start ngrok
ngrok http 3000

# Test Callback
curl -X POST https://your-url.ngrok.io/api/ussd/callback \
  -d "sessionId=test123" \
  -d "serviceCode=*384*1234#" \
  -d "phoneNumber=08054969639" \
  -d "text="

# Check Logs
tail -f logs/combined.log

# Database Check
psql -d kudipay -c "SELECT * FROM users;"
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Backend code complete
- [ ] Dependencies installed
- [ ] Database schema created
- [ ] Environment variables set
- [ ] Africa's Talking account created

### Deployment

- [ ] USSD code assigned
- [ ] Callback URL configured
- [ ] Backend accessible publicly
- [ ] Test endpoint works
- [ ] Logs configured

### Testing

- [ ] Main menu displays
- [ ] Registration works
- [ ] PIN security works
- [ ] Phone normalization works
- [ ] Error handling works
- [ ] All flows tested

### Monitoring

- [ ] Logs being captured
- [ ] Errors being tracked
- [ ] Performance acceptable
- [ ] Database queries optimized

---

**Ready to deploy? Follow this guide step by step! 🚀**

**Need help? Check the troubleshooting section or contact Africa's Talking support.**

---

**Document Version**: 1.0.0  
**Last Updated**: October 19, 2025  
**Status**: Ready for Sandbox Deployment
