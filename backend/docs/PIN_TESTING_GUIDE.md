# PIN Security Testing Guide

## Quick Test Scenarios

### Setup

```bash
# 1. Run the migration
cd /home/vahalla/Desktop/kudipay_backend/backend
psql -U your_username -d kudipay_db -f migrations/add_pin_security.sql

# 2. Restart the backend
npm start
```

## Test Flows

### ✅ Test 1: Successful Withdrawal with PIN

**USSD Flow**:

```
Dial: *123#
> Select: 3 (Withdraw Money)
> Enter: 5000 (Amount in NGN)
> Select: 1 (Bank Account)
> Enter: 0123456789 (Account Number)
> Select: 2 (GTBank)
> Enter: 1234 (Your correct PIN)

Expected Result: "END Withdrawal of ₦5,000 to GTBank..."
```

**Database Check**:

```sql
SELECT phone_number, pin_failed_attempts, pin_locked_until
FROM users
WHERE phone_number = '+2348012345678';

-- Should show:
-- pin_failed_attempts: 0
-- pin_locked_until: NULL
```

---

### ❌ Test 2: Failed PIN Attempt (1st)

**USSD Flow**:

```
Dial: *123#
> Select: 3 (Withdraw Money)
> Enter: 5000
> Select: 1 (Bank Account)
> Enter: 0123456789
> Select: 2 (GTBank)
> Enter: 9999 (Wrong PIN)

Expected Result: "END Invalid PIN. 2 attempt(s) remaining."
```

**Database Check**:

```sql
SELECT phone_number, pin_failed_attempts, pin_locked_until
FROM users
WHERE phone_number = '+2348012345678';

-- Should show:
-- pin_failed_attempts: 1
-- pin_locked_until: NULL
```

---

### ❌ Test 3: Account Lockout (3rd Failed Attempt)

**USSD Flow**:

```
Attempt 1:
> Enter wrong PIN: 9999
Result: "Invalid PIN. 2 attempt(s) remaining."

Attempt 2:
> Repeat withdrawal flow
> Enter wrong PIN: 8888
Result: "Invalid PIN. 1 attempt(s) remaining."

Attempt 3:
> Repeat withdrawal flow
> Enter wrong PIN: 7777
Result: "Too many failed attempts. Account locked for 30 minutes."
```

**Database Check**:

```sql
SELECT
    phone_number,
    pin_failed_attempts,
    pin_locked_until,
    pin_locked_until > NOW() as is_locked
FROM users
WHERE phone_number = '+2348012345678';

-- Should show:
-- pin_failed_attempts: 3
-- pin_locked_until: [timestamp 30 mins in future]
-- is_locked: true
```

---

### 🔒 Test 4: Locked Account Attempt

**USSD Flow**:

```
(Within 30 minutes of lockout)

Dial: *123#
> Select: 3 (Withdraw Money)
> Enter: 5000
> Select: 1 (Bank Account)
> Enter: 0123456789
> Select: 2 (GTBank)
> Enter: 1234 (Even correct PIN)

Expected Result: "END Account locked. Try again in 28 minute(s)."
```

---

### ✅ Test 5: Auto-Unlock After 30 Minutes

**Wait 30 minutes or manually unlock**:

**Manual Unlock (For Testing)**:

```sql
UPDATE users
SET pin_failed_attempts = 0,
    pin_locked_until = NULL
WHERE phone_number = '+2348012345678';
```

**USSD Flow**:

```
Dial: *123#
> Select: 3 (Withdraw Money)
> Enter: 5000
> Select: 1 (Bank Account)
> Enter: 0123456789
> Select: 2 (GTBank)
> Enter: 1234 (Correct PIN)

Expected Result: "END Withdrawal of ₦5,000 to GTBank..."
```

**Database Check**:

```sql
SELECT phone_number, pin_failed_attempts, pin_locked_until
FROM users
WHERE phone_number = '+2348012345678';

-- Should show:
-- pin_failed_attempts: 0 (reset)
-- pin_locked_until: NULL
```

---

### ❌ Test 6: Invalid PIN Format

**USSD Flow**:

```
Dial: *123#
> Select: 3 (Withdraw Money)
> Enter: 5000
> Select: 1 (Bank Account)
> Enter: 0123456789
> Select: 2 (GTBank)
> Enter: 123 (Only 3 digits)

Expected Result: "CON Invalid PIN format. Enter your 4-digit PIN:"

> Enter: 12345 (5 digits)
Expected Result: "CON Invalid PIN format. Enter your 4-digit PIN:"

> Enter: 12a4 (Non-numeric)
Expected Result: "CON Invalid PIN format. Enter your 4-digit PIN:"
```

**Database Check**:

```sql
-- Failed attempts should NOT increment for format errors
SELECT pin_failed_attempts FROM users WHERE phone_number = '+2348012345678';
-- Should remain: 0
```

---

## Database Queries for Testing

### Check User PIN Status

```sql
SELECT
    phone_number,
    pin,
    pin_failed_attempts,
    pin_locked_until,
    CASE
        WHEN pin_locked_until IS NULL THEN 'Not Locked'
        WHEN pin_locked_until > NOW() THEN 'Locked (' ||
            EXTRACT(MINUTE FROM (pin_locked_until - NOW())) || ' mins remaining)'
        ELSE 'Lock Expired'
    END as lock_status
FROM users
WHERE phone_number = '+2348012345678';
```

### View All Locked Accounts

```sql
SELECT
    phone_number,
    pin_failed_attempts,
    pin_locked_until,
    EXTRACT(MINUTE FROM (pin_locked_until - NOW())) as minutes_remaining
FROM users
WHERE pin_locked_until > NOW()
ORDER BY pin_locked_until DESC;
```

### Reset Specific User

```sql
-- Reset failed attempts and unlock
UPDATE users
SET pin_failed_attempts = 0,
    pin_locked_until = NULL
WHERE phone_number = '+2348012345678';
```

### Reset All Users

```sql
-- Use with caution in testing only!
UPDATE users
SET pin_failed_attempts = 0,
    pin_locked_until = NULL;
```

### Simulate Locked Account

```sql
-- Lock an account for testing
UPDATE users
SET pin_failed_attempts = 3,
    pin_locked_until = NOW() + INTERVAL '30 minutes'
WHERE phone_number = '+2348012345678';
```

---

## Expected Behavior Summary

| Scenario               | PIN Input | Failed Attempts | Lock Status       | Result               |
| ---------------------- | --------- | --------------- | ----------------- | -------------------- |
| First correct PIN      | 1234 ✅   | 0               | Unlocked          | Withdrawal success   |
| First wrong PIN        | 9999 ❌   | 1               | Unlocked          | 2 attempts remaining |
| Second wrong PIN       | 8888 ❌   | 2               | Unlocked          | 1 attempt remaining  |
| Third wrong PIN        | 7777 ❌   | 3               | **Locked 30 min** | Account locked       |
| Locked + Correct PIN   | 1234 🔒   | 3               | **Locked**        | Still locked         |
| Locked + Wrong PIN     | 9999 🔒   | 3               | **Locked**        | Still locked         |
| After unlock + Correct | 1234 ✅   | 0 (reset)       | Unlocked          | Withdrawal success   |

---

## API Testing (Alternative)

If you have API endpoints exposed:

### Check User Lock Status

```bash
curl -X GET http://localhost:3000/api/users/+2348012345678/pin-status
```

### Simulate Withdrawal with PIN

```bash
curl -X POST http://localhost:3000/api/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "amount": 5000,
    "bankCode": "058",
    "accountNumber": "0123456789",
    "pin": "1234"
  }'
```

---

## Troubleshooting

### Issue: PIN always fails even when correct

**Check**:

```sql
-- Verify stored PIN
SELECT phone_number, pin FROM users WHERE phone_number = '+2348012345678';
```

**Solution**: Ensure PIN is stored correctly (no extra spaces, correct format)

### Issue: Account never unlocks

**Check**:

```sql
-- Check lock timestamp
SELECT pin_locked_until, NOW(), pin_locked_until > NOW() as still_locked
FROM users WHERE phone_number = '+2348012345678';
```

**Solution**: Manually reset or wait for timestamp to pass

### Issue: Failed attempts not incrementing

**Check**: Review User model's `incrementFailedAttempts()` method
**Debug**:

```javascript
// Add logging in User model
console.log("Before increment:", this.pinFailedAttempts);
const result = await this.incrementFailedAttempts();
console.log("After increment:", result.pinFailedAttempts);
```

### Issue: Database columns don't exist

**Solution**: Run migration again

```bash
psql -U postgres -d kudipay_db -f backend/migrations/add_pin_security.sql
```

---

## Clean Up After Testing

```sql
-- Reset all test accounts
UPDATE users
SET pin_failed_attempts = 0,
    pin_locked_until = NULL
WHERE phone_number LIKE '+234%';

-- Delete test transactions
DELETE FROM transactions
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## Next Steps

1. ✅ Run migration
2. ✅ Test all 6 scenarios above
3. ✅ Verify database updates
4. 🔄 Test with Africa's Talking simulator
5. 🔄 Test mobile money withdrawal PIN
6. 🔄 Test cash agent withdrawal PIN
7. 📝 Document any issues found

## Success Criteria

- [ ] User can register with 4-digit PIN
- [ ] Correct PIN allows withdrawal
- [ ] Wrong PIN shows remaining attempts
- [ ] 3 wrong PINs locks account for 30 minutes
- [ ] Locked account rejects all attempts
- [ ] Account auto-unlocks after 30 minutes
- [ ] Successful verification resets failed attempts
- [ ] Invalid PIN format doesn't increment failed attempts
- [ ] Database correctly tracks all attempts
