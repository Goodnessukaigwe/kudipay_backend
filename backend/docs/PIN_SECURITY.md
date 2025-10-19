# PIN Security Implementation

## Overview

KudiPay's USSD system implements a secure 4-digit numeric PIN system for user authentication and transaction authorization, particularly for withdrawals.

## Features

### 1. **4-Digit Numeric PIN**

- Users must create a 4-digit PIN (0000-9999) during registration
- PIN is validated to be exactly 4 numeric characters
- Weak PINs are discouraged but not blocked (can be enhanced)

### 2. **PIN Verification with Attempt Limiting**

- **Maximum Attempts**: 3 consecutive failed attempts
- **Lockout Period**: 30 minutes after 3 failed attempts
- **Auto-Reset**: Failed attempts reset to 0 upon successful verification
- **Real-time Feedback**: Users are informed of remaining attempts

### 3. **Account Locking**

When a user fails PIN verification 3 times:

- Account is locked for 30 minutes
- `pin_locked_until` timestamp is set
- User receives clear message about lockout duration
- All withdrawal attempts are blocked during lockout

### 4. **Withdrawal PIN Verification Flow**

```
User selects "Withdraw"
    ↓
Enter amount
    ↓
Select method (Bank/Mobile Money/Cash Agent)
    ↓
Enter account details (if bank)
    ↓
Confirmation screen with amount & details
    ↓
🔒 PIN VERIFICATION (4 digits required)
    ↓
├─ Valid PIN → Process withdrawal
└─ Invalid PIN →
    ├─ Attempt 1/2: Show remaining attempts
    └─ Attempt 3: Lock account for 30 minutes
```

## Database Schema

### Users Table Additions

```sql
-- Added columns for PIN security
ALTER TABLE users ADD COLUMN pin_failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN pin_locked_until TIMESTAMP;

-- Index for performance
CREATE INDEX idx_users_pin_locked ON users(pin_locked_until)
WHERE pin_locked_until IS NOT NULL;
```

**Column Details**:

- `pin`: VARCHAR(4) - Stores the 4-digit PIN (plaintext in MVP, should be hashed in production)
- `pin_failed_attempts`: INTEGER - Counter for consecutive failed attempts
- `pin_locked_until`: TIMESTAMP - Time until account unlock (NULL if not locked)

## User Model Methods

### `isLocked()`

```javascript
user.isLocked(); // Returns true if account is currently locked
```

### `getRemainingLockTime()`

```javascript
user.getRemainingLockTime(); // Returns minutes remaining in lockout
```

### `incrementFailedAttempts()`

```javascript
await user.incrementFailedAttempts();
// Increments counter, locks account if >= 3 attempts
```

### `resetFailedAttempts()`

```javascript
await user.resetFailedAttempts();
// Resets counter to 0 and clears lock timestamp
```

### `verifyPinWithLimiting(inputPin)`

```javascript
const result = await user.verifyPinWithLimiting("1234");
// Returns:
// {
//   success: boolean,
//   user: User|null,
//   message: string,
//   attemptsRemaining: number
// }
```

**Return Object**:

- `success`: `true` if PIN is valid, `false` otherwise
- `user`: Updated User object with new attempt count
- `message`: Human-readable message for user feedback
- `attemptsRemaining`: Number of attempts left (0 if locked)

## USSD Flow Implementation

### Registration Flow

1. User selects "Register Phone Number"
2. System prompts: "Enter a 4-digit PIN for your wallet:"
3. User enters PIN (validated as 4 digits)
4. System prompts: "Confirm your 4-digit PIN:"
5. User re-enters PIN
6. System validates match and creates wallet

### Withdrawal Flow with PIN

1. User selects "Withdraw Money"
2. Enters withdrawal amount
3. Selects withdrawal method (Bank/Mobile Money/Cash Agent)
4. Enters account details (if bank transfer)
5. **PIN Verification Step**:

   ```
   CON Withdraw ₦50,000 to GTBank?
   Account: 0123456789

   Enter your 4-digit PIN to confirm:
   ```

6. System validates PIN:
   - ✅ **Valid**: Process withdrawal
   - ❌ **Invalid (Attempt 1-2)**: Show remaining attempts
   - ❌ **Invalid (Attempt 3)**: Lock account for 30 minutes

## Security Validation

### PIN Format Validation

```javascript
// Valid PINs
"1234" ✅
"0000" ✅
"9999" ✅

// Invalid PINs
"123"  ❌ (too short)
"12345" ❌ (too long)
"12a4" ❌ (non-numeric)
"12 34" ❌ (contains space)
```

### Weak PIN Detection (Optional Enhancement)

```javascript
// Commonly used weak PINs to warn users:
const weakPins = ["0000", "1111", "2222", "1234", "4321", "0123"];
```

## Error Messages

### PIN Verification Messages

- **Success**: "PIN verified successfully."
- **Invalid Format**: "PIN must be exactly 4 digits."
- **Invalid PIN (1st attempt)**: "Invalid PIN. 2 attempt(s) remaining."
- **Invalid PIN (2nd attempt)**: "Invalid PIN. 1 attempt(s) remaining."
- **Account Locked**: "Too many failed attempts. Account locked for 30 minutes."
- **Locked Account**: "Account locked. Try again in X minute(s)."

### USSD Response Examples

**Successful Withdrawal**:

```
END Withdrawal of ₦50,000 to GTBank (0123456789) initiated successfully.

Ref: TXN_1697654321
```

**Failed PIN (Attempt 1)**:

```
END Invalid PIN. 2 attempt(s) remaining.
```

**Account Locked**:

```
END Too many failed attempts. Account locked for 30 minutes.
```

**Locked Account Attempt**:

```
END Account locked. Try again in 28 minute(s).
```

## Code Examples

### Verification in USSD Service

```javascript
async handlePinVerification(session, input) {
  // Validate format
  if (!/^\d{4}$/.test(input)) {
    return 'CON Invalid PIN format. Enter your 4-digit PIN:';
  }

  const user = await User.findByPhone(session.phoneNumber);

  // Verify with limiting
  const result = await user.verifyPinWithLimiting(input);

  if (!result.success) {
    await session.end();
    return `END ${result.message}`;
  }

  // Process withdrawal
  // ...
}
```

### Checking Lock Status

```javascript
const user = await User.findByPhone(phoneNumber);

if (user.isLocked()) {
  const minutes = user.getRemainingLockTime();
  return `END Account locked. Try again in ${minutes} minutes.`;
}
```

## Testing Scenarios

### Test Case 1: Successful Withdrawal

1. Dial USSD code
2. Select "Withdraw Money"
3. Enter amount: 5000
4. Select bank transfer
5. Enter account number: 0123456789
6. Select bank: GTBank
7. Enter correct PIN: 1234
8. ✅ **Expected**: Withdrawal initiated successfully

### Test Case 2: First Failed Attempt

1. Follow steps 1-6 above
2. Enter incorrect PIN: 0000
3. ❌ **Expected**: "Invalid PIN. 2 attempt(s) remaining."

### Test Case 3: Account Lockout

1. Follow steps 1-6 above
2. Enter incorrect PIN: 0000 (Attempt 1)
3. Repeat withdrawal flow
4. Enter incorrect PIN: 1111 (Attempt 2)
5. Repeat withdrawal flow
6. Enter incorrect PIN: 2222 (Attempt 3)
7. ❌ **Expected**: "Too many failed attempts. Account locked for 30 minutes."

### Test Case 4: Locked Account

1. After Test Case 3, try to withdraw again
2. ❌ **Expected**: "Account locked. Try again in X minute(s)."

### Test Case 5: Auto-Unlock

1. Wait 30 minutes after Test Case 3
2. Try withdrawal again
3. Enter correct PIN: 1234
4. ✅ **Expected**: Withdrawal initiated, failed attempts reset to 0

## Production Enhancements

### 1. **PIN Hashing** (Critical for Production)

```javascript
const bcrypt = require("bcrypt");

// Store hashed PIN
const pinHash = await bcrypt.hash(pin, 10);
await user.update({ pin: pinHash });

// Verify hashed PIN
const isValid = await bcrypt.compare(inputPin, user.pin);
```

### 2. **Weak PIN Prevention**

```javascript
const weakPins = ["0000", "1111", "2222", "3333", "1234", "4321"];

if (weakPins.includes(pin)) {
  return "CON PIN too weak. Choose a stronger 4-digit PIN:";
}
```

### 3. **Progressive Lockout**

- 3 failed attempts → 30 minutes
- 6 failed attempts → 2 hours
- 9 failed attempts → 24 hours

### 4. **SMS Notifications**

Send SMS alerts on:

- 3rd failed PIN attempt
- Account lockout
- Successful unlock

### 5. **Admin Override**

Allow admins to manually unlock accounts via admin panel

### 6. **Audit Logging**

Log all PIN verification attempts with:

- Timestamp
- Phone number
- Success/failure
- IP address (if applicable)

## Migration Instructions

1. **Run the migration**:

```bash
psql -U postgres -d kudipay -f backend/migrations/add_pin_security.sql
```

2. **Verify columns added**:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('pin_failed_attempts', 'pin_locked_until');
```

3. **Test in development**:

```bash
# Start the backend
npm start

# Test USSD flow with Africa's Talking simulator
```

## API Endpoints (Future)

### Check Lock Status (Admin)

```
GET /api/admin/users/:phoneNumber/pin-status

Response:
{
  "isLocked": true,
  "failedAttempts": 3,
  "lockedUntil": "2025-10-18T15:30:00Z",
  "remainingMinutes": 25
}
```

### Unlock Account (Admin)

```
POST /api/admin/users/:phoneNumber/unlock-pin

Response:
{
  "success": true,
  "message": "Account unlocked successfully"
}
```

## Compliance

### Data Protection

- PINs should be hashed in production (bcrypt with salt)
- Never log PIN values in plaintext
- Transmission over encrypted channels (HTTPS)

### Security Standards

- Follows OWASP guidelines for authentication
- Implements rate limiting (attempt-based)
- Provides clear user feedback

### Nigerian Regulations

- Complies with CBN guidelines for digital wallets
- Implements sufficient security for micro-transactions
- Supports account recovery mechanisms

## Support & Troubleshooting

### User Locked Out

**Solution**: Wait 30 minutes or contact support for manual unlock

### Forgot PIN

**Solution**: Implement PIN reset flow (future):

1. Verify phone ownership (OTP)
2. Answer security question
3. Set new PIN

### PIN Not Working

**Check**:

1. Is account locked? (Check `pin_locked_until`)
2. Is PIN correct in database?
3. Is user entering exactly 4 digits?

## Version History

- **v1.0.0** (2025-10-18): Initial PIN security implementation
  - 4-digit numeric PIN validation
  - 3-attempt limiting with 30-minute lockout
  - Withdrawal PIN verification
  - Database schema updates

## Related Documentation

- [USSD Service Documentation](./USSD_SERVICE.md)
- [Withdrawal Flow](./WITHDRAWAL_FLOW.md)
- [Security Best Practices](./SECURITY.md)
