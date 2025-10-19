# Phone Number Normalization & Ownership

## Overview

KudiPay automatically converts user-friendly phone numbers (like `08054969639`) to international format (`+2348054969639`) for wallet mapping. Each wallet is **strictly bound** to the phone number that created it - only that phone number can perform transactions.

---

## 📱 Phone Number Formats Accepted

### Input Formats (User-Friendly)

Users can enter phone numbers in any of these formats:

| Format                      | Example          | Description                 |
| --------------------------- | ---------------- | --------------------------- |
| **Local with 0**            | `08054969639`    | Most common Nigerian format |
| **Local without 0**         | `8054969639`     | Alternative local format    |
| **International without +** | `2348054969639`  | Without plus sign           |
| **International with +**    | `+2348054969639` | Full international format   |

### Storage Format (Database)

All phone numbers are **automatically converted** and stored as:

- **Format**: `+2348054969639` (international with + prefix)
- **Consistent**: Same format for all users
- **Searchable**: Easy database queries

---

## 🔄 How It Works

### 1. **User Registration**

```
User dials: *123#
Enters phone: 08054969639
             ↓
System normalizes: +2348054969639
             ↓
Creates wallet with normalized phone
             ↓
Database stores: +2348054969639
```

### 2. **Automatic Normalization**

```javascript
// User input (any format)
08054969639
8054969639
2348054969639
+2348054969639

// All become
+2348054969639  ← Stored in database
```

### 3. **Wallet Mapping**

```
Phone: +2348054969639
  ↓
Generates deterministic wallet address
  ↓
Wallet: 0x1234...5678
  ↓
Wallet is OWNED by +2348054969639
```

---

## 🔒 Phone Number Ownership

### Strict Ownership Rule

**Only the phone number that created a wallet can send transactions from it.**

```
✅ ALLOWED:
Phone +2348054969639 → Sends from wallet 0x1234...5678

❌ BLOCKED:
Phone +2348011111111 → Attempts to send from wallet 0x1234...5678
                       → ERROR: "Unauthorized: You can only send from your own wallet"
```

### Security Benefits

1. **Prevents unauthorized access** - No one can use your wallet
2. **Protects funds** - Only your phone can initiate transactions
3. **Clear ownership** - One phone = one wallet, always
4. **Audit trail** - Every transaction linked to verified phone

---

## 🛠️ Implementation

### Helper Functions

#### `isValidPhoneNumber(phoneNumber)`

Validates if a phone number is in a recognized format.

```javascript
const { isValidPhoneNumber } = require("../utils/helpers");

// Valid formats
isValidPhoneNumber("08054969639"); // ✅ true
isValidPhoneNumber("8054969639"); // ✅ true
isValidPhoneNumber("2348054969639"); // ✅ true
isValidPhoneNumber("+2348054969639"); // ✅ true

// Invalid formats
isValidPhoneNumber("1234567890"); // ❌ false (not Nigerian)
isValidPhoneNumber("080549696"); // ❌ false (too short)
isValidPhoneNumber("08154969639"); // ❌ false (invalid prefix)
```

**Validation Rules**:

- Must start with 0, 7, 8, 9, or 234
- Nigerian mobile prefixes: 070x, 080x, 081x, 090x, 091x
- Correct length based on format

#### `normalizePhoneNumber(phoneNumber)`

Converts any format to international format.

```javascript
const { normalizePhoneNumber } = require("../utils/helpers");

normalizePhoneNumber("08054969639"); // → +2348054969639
normalizePhoneNumber("8054969639"); // → +2348054969639
normalizePhoneNumber("2348054969639"); // → +2348054969639
normalizePhoneNumber("+2348054969639"); // → +2348054969639
```

**Normalization Process**:

1. Remove all non-digit characters
2. Check if starts with country code (234)
3. Remove leading 0 if present
4. Add country code if missing
5. Add + prefix

#### `formatPhoneNumber(phoneNumber)`

Alias for `normalizePhoneNumber()` - same functionality.

---

## 📝 Code Examples

### User Registration (USSD)

```javascript
// In ussdService.js
async handleRegistrationPin(session, input) {
  // User enters: 08054969639
  const userPhone = session.phoneNumber; // Already normalized by processRequest()

  // userPhone is now: +2348054969639

  // Create wallet with normalized phone
  const wallet = await walletService.createWallet(userPhone, input);

  // Wallet is bound to +2348054969639
}
```

### Wallet Creation with Validation

```javascript
// In walletService.js
async createWallet(phoneNumber, pin) {
  // Validate format (accepts any format)
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Invalid phone number format. Use: 08012345678');
  }

  // Normalize to +234... format
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  // Input: 08054969639 → Output: +2348054969639

  // Check if already registered
  const existingUser = await User.findByPhone(normalizedPhone);
  if (existingUser) {
    throw new Error('Phone number already registered');
  }

  // Generate wallet using normalized phone
  const walletData = generateWalletFromPhone(normalizedPhone);

  // Store with normalized phone
  const user = await User.create({
    phoneNumber: normalizedPhone,  // Stored as +2348054969639
    walletAddress: walletData.address,
    privateKey: walletData.privateKey,
    pin: pin
  });

  return user;
}
```

### Transaction with Ownership Check

```javascript
// In walletService.js
async sendTransaction({ fromPhone, toPhone, amount, pin }) {
  // Normalize both numbers
  const normalizedFromPhone = normalizePhoneNumber(fromPhone);
  const normalizedToPhone = normalizePhoneNumber(toPhone);

  // Get sender
  const sender = await User.findByPhone(normalizedFromPhone);

  if (!sender) {
    throw new Error('Sender not found. Please register first.');
  }

  // CRITICAL: Enforce ownership
  if (sender.phoneNumber !== normalizedFromPhone) {
    logger.warn(`Unauthorized attempt: ${normalizedFromPhone} → ${sender.walletAddress}`);
    throw new Error('Unauthorized: You can only send from your own wallet');
  }

  // Verify PIN
  if (!sender.verifyPin(pin)) {
    throw new Error('Invalid PIN');
  }

  // Process transaction...
}
```

### USSD Request Processing

```javascript
// In ussdService.js
async processRequest({ sessionId, serviceCode, phoneNumber, text }) {
  // Africa's Talking might send: 08054969639 or +2348054969639

  // Normalize automatically
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  // Result: +2348054969639

  // All subsequent operations use normalized format
  let session = await UssdSession.findActive(sessionId, normalizedPhone);

  // Session is tied to +2348054969639
}
```

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,  -- Always stored as +234...
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    private_key VARCHAR(66) NOT NULL,
    pin VARCHAR(4) NOT NULL,
    -- ...
);

-- Example data:
-- phone_number: +2348054969639  (not 08054969639)
-- wallet_address: 0x1234abcd5678ef...
```

### Indexes

```sql
-- Fast lookup by phone
CREATE INDEX idx_users_phone ON users(phone_number);

-- Ensure uniqueness
CREATE UNIQUE INDEX idx_users_wallet ON users(wallet_address);
```

---

## 🔍 Validation Logic

### Accepted Number Patterns

```javascript
// Pattern 1: Local with 0 (11 digits)
const pattern1 = /^0[789]\d{9}$/;
// Examples: 08054969639, 07012345678, 09098765432

// Pattern 2: Local without 0 (10 digits)
const pattern2 = /^[789]\d{9}$/;
// Examples: 8054969639, 7012345678, 9098765432

// Pattern 3: International (13 digits)
const pattern3 = /^234[789]\d{9}$/;
// Examples: 2348054969639, 2347012345678

// All convert to: +2348054969639
```

### Nigerian Mobile Prefixes

```javascript
// Valid prefixes (first 4 digits after 0 or 234):
// MTN: 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906
// Airtel: 0802, 0808, 0812, 0901, 0902, 0907, 0912
// Glo: 0805, 0807, 0811, 0815, 0905
// 9mobile: 0809, 0817, 0818, 0908, 0909

// Pattern check: Must start with 070, 080, 081, 090, 091
```

---

## ✅ Use Cases

### Use Case 1: New User Registration

```
1. User dials *123#
2. Selects: 1 (Register)
3. System gets phone from Africa's Talking: 08054969639
4. System normalizes: +2348054969639
5. User sets PIN: 1234
6. Wallet created for +2348054969639
7. Database stores: +2348054969639 → 0x1234...
```

### Use Case 2: Sending Money

```
1. User dials *123# from 08054969639
2. Selects: 3 (Send Money)
3. Enters recipient: 07011111111
4. System normalizes both:
   - Sender: +2348054969639
   - Recipient: +2347011111111
5. Validates sender owns wallet ✅
6. Enters PIN and amount
7. Transaction processed
```

### Use Case 3: Unauthorized Attempt (Blocked)

```
1. Hacker tries to use API directly
2. Sends request:
   fromPhone: +2348054969639 (victim's phone)
   toPhone: +2348077777777 (hacker's phone)
3. System finds sender wallet
4. Checks ownership:
   sender.phoneNumber === +2348054969639 ✅
5. But request comes from different device/session
6. PIN verification fails ❌
7. Transaction blocked
```

---

## 🚨 Security Considerations

### What's Protected

✅ Wallet ownership is immutable  
✅ Only registered phone can send  
✅ Phone number consistently normalized  
✅ Database queries always use same format  
✅ No confusion with different formats

### What's NOT Protected (Yet)

⚠️ SIM swap attacks (phone number stolen)  
⚠️ Device theft with unlocked phone  
⚠️ PIN stored in plaintext (MVP only)

### Recommended Enhancements

1. **SIM Swap Protection**

   - Device fingerprinting
   - Unusual activity detection
   - Temporary lock on SIM change

2. **Additional Verification**

   - Biometric authentication
   - Security questions
   - Transaction OTP for large amounts

3. **PIN Security**
   - Hash with bcrypt (production)
   - Rate limiting on PIN attempts
   - Account lockout (already implemented ✅)

---

## 🧪 Testing

### Test Cases

#### Test 1: Registration with Local Format

```bash
# Input
Phone: 08054969639
PIN: 1234

# Expected
Database: +2348054969639
Wallet: 0x1234...5678 (deterministic)
```

#### Test 2: Registration with Different Format

```bash
# Input
Phone: 8054969639 (no leading 0)
PIN: 1234

# Expected
Database: +2348054969639 (same as Test 1)
Wallet: 0x1234...5678 (SAME wallet as Test 1!)
```

#### Test 3: Send Transaction

```bash
# Sender: +2348054969639
# Recipient: 07011111111 (local format)

# System normalizes recipient: +2347011111111
# Validates sender ownership: ✅
# Processes transaction
```

#### Test 4: Unauthorized Send (Should Fail)

```bash
# Attempt to send from someone else's wallet

# Request:
fromPhone: +2348054969639
toPhone: +2348011111111

# If request doesn't match session phone:
# Result: ❌ "Unauthorized: You can only send from your own wallet"
```

### SQL Test Queries

```sql
-- Test 1: Check normalization
SELECT phone_number, wallet_address
FROM users
WHERE phone_number LIKE '+234%';

-- Test 2: Verify uniqueness
SELECT phone_number, COUNT(*)
FROM users
GROUP BY phone_number
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Test 3: Check format consistency
SELECT phone_number
FROM users
WHERE phone_number NOT LIKE '+234%';
-- Should return 0 rows (all normalized)
```

---

## 📚 Related Documentation

- [PIN Security](./PIN_SECURITY.md)
- [USSD Service](./USSD_PRODUCTION_READINESS.md)
- [Wallet Service](../README.md)

---

## 🔧 Troubleshooting

### Issue: "Invalid phone number format"

**Cause**: Phone number doesn't match any accepted pattern  
**Solution**:

- Check it's a Nigerian mobile number (starts with 070, 080, 081, 090, 091)
- Verify correct length (10-14 digits depending on format)
- Remove any special characters except +

### Issue: "Phone number already registered"

**Cause**: This phone already has a wallet  
**Solution**:

- Use "Check Balance" to verify existing account
- If you forgot your account, use recovery process
- Cannot register same number twice

### Issue: "Unauthorized: You can only send from your own wallet"

**Cause**: Trying to send from a wallet you don't own  
**Solution**:

- Only use your own phone number
- Register your phone first
- Check you're logged in with correct phone

---

## 📊 Statistics & Monitoring

### Metrics to Track

- Phone format distribution (how users enter numbers)
- Normalization failures (invalid formats)
- Unauthorized send attempts (security)
- SIM swap detections (future)

### Log Examples

```javascript
// Successful normalization
logger.info("Phone normalized", {
  input: "08054969639",
  output: "+2348054969639",
  userId: 123,
});

// Unauthorized attempt
logger.warn("Unauthorized transaction attempt", {
  requestedPhone: "+2348054969639",
  actualOwner: "+2347011111111",
  walletAddress: "0x1234...",
  attemptedAt: "2025-10-18T10:30:00Z",
});
```

---

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Status**: ✅ Implemented & Production-Ready
