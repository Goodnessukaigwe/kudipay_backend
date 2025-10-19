# 🔐 PIN Security - Quick Reference Card

## 📋 At a Glance

| Feature            | Details                                    |
| ------------------ | ------------------------------------------ |
| **PIN Length**     | Exactly 4 digits                           |
| **Character Type** | Numeric only (0-9)                         |
| **Max Attempts**   | 3 per session                              |
| **Lockout Time**   | 30 minutes                                 |
| **When Required**  | All withdrawals (bank, mobile money, cash) |
| **Auto-Unlock**    | Yes, after 30 minutes                      |

---

## 🔄 Quick Flow

```
Withdrawal → Amount → Method → Details → PIN → Process
                                          ↓
                                    ✅ Correct: Success
                                    ❌ Wrong: -1 attempt
                                    🔒 3 fails: Lock 30min
```

---

## 🎯 User Messages

| Scenario        | Message                                                    |
| --------------- | ---------------------------------------------------------- |
| **Success**     | "Withdrawal of ₦X initiated. Ref: TXN_XXX"                 |
| **1st Fail**    | "Invalid PIN. 2 attempt(s) remaining."                     |
| **2nd Fail**    | "Invalid PIN. 1 attempt(s) remaining."                     |
| **Locked**      | "Too many failed attempts. Account locked for 30 minutes." |
| **During Lock** | "Account locked. Try again in X minute(s)."                |
| **Bad Format**  | "PIN must be exactly 4 digits."                            |

---

## 💾 Database Fields

```sql
users.pin                    VARCHAR(4)
users.pin_failed_attempts    INTEGER DEFAULT 0
users.pin_locked_until       TIMESTAMP
```

---

## 🧪 Test Commands

### Check Status

```sql
SELECT phone_number, pin_failed_attempts,
       pin_locked_until > NOW() as is_locked
FROM users WHERE phone_number = '+234XXX';
```

### Manual Unlock

```sql
UPDATE users
SET pin_failed_attempts = 0, pin_locked_until = NULL
WHERE phone_number = '+234XXX';
```

### Simulate Lock

```sql
UPDATE users
SET pin_failed_attempts = 3,
    pin_locked_until = NOW() + INTERVAL '30 minutes'
WHERE phone_number = '+234XXX';
```

---

## 📁 Modified Files

✅ `src/models/User.js` - PIN methods  
✅ `src/services/ussdService.js` - Verification handlers  
✅ `src/utils/ussdBuilder.js` - Bank menu  
✅ `config/ussd.js` - Messages  
✅ `migrations/add_pin_security.sql` - DB schema

---

## 🚀 Deploy Steps

1. **Run Migration**

   ```bash
   psql -U user -d db -f migrations/add_pin_security.sql
   ```

2. **Restart Backend**

   ```bash
   npm start
   ```

3. **Test**
   - Dial USSD code
   - Try withdrawal with wrong PIN 3x
   - Verify lock works

---

## 🆘 Troubleshooting

| Problem               | Solution                                         |
| --------------------- | ------------------------------------------------ |
| PIN always fails      | Check: `SELECT pin FROM users WHERE phone = 'X'` |
| Won't unlock          | Check: `pin_locked_until` timestamp              |
| Columns missing       | Rerun migration SQL                              |
| Attempts not counting | Check User model `incrementFailedAttempts()`     |

---

## 📚 Full Docs

- **Implementation Details**: `docs/PIN_SECURITY.md`
- **Testing Scenarios**: `docs/PIN_TESTING_GUIDE.md`
- **Summary**: `docs/PIN_IMPLEMENTATION_SUMMARY.md`
- **Complete Guide**: `docs/PIN_IMPLEMENTATION_COMPLETE.md`

---

## 🎓 Code Snippet

```javascript
// In USSD handler
const user = await User.findByPhone(phoneNumber);
const result = await user.verifyPinWithLimiting(inputPin);

if (!result.success) {
  return `END ${result.message}`;
}

// Continue with withdrawal
```

---

## ✅ Checklist

- [ ] Migration run
- [ ] Backend restarted
- [ ] Test scenario 1: Correct PIN
- [ ] Test scenario 2: Wrong PIN (1x)
- [ ] Test scenario 3: Lock account (3x)
- [ ] Test scenario 4: Locked attempt
- [ ] Test scenario 5: Auto-unlock
- [ ] Test scenario 6: Invalid format
- [ ] Verify database updates
- [ ] Test on sandbox

---

**Status**: ✅ Implementation Complete  
**Version**: 1.0.0  
**Date**: Oct 18, 2025

_Keep this card handy for quick reference!_
