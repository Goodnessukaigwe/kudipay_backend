# Flutterwave Integration Guide

## Quick Start

The KudiPay backend now has full Flutterwave integration for processing bank transfers and mobile money withdrawals in Nigeria and Kenya.

### What's New?

- ✅ Nigerian & Kenyan bank withdrawals
- ✅ Mobile money transfers (MTN, Airtel, M-Pesa, etc.)
- ✅ Account verification
- ✅ Transfer status tracking
- ✅ USSD support for feature phones
- ✅ Complete REST API endpoints
- ✅ Production-ready code

---

## Installation

No additional dependencies needed! All integrations use existing packages:
- `axios` for API calls
- `pg` for database transactions
- `winston` for logging

---

## Configuration

### 1. Update `.env`

Copy `.env.example` to `.env` and add Flutterwave credentials:

```bash
cp .env.example .env
```

Add to `.env`:
```
FLUTTERWAVE_API_URL=https://api.flutterwave.com/v3
FLUTTERWAVE_SECRET_KEY=your_secret_key_here
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key_here
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_here
DEMO_MODE=false  # Set to false for production
```

### 2. Start the Server

```bash
npm run dev  # Development with nodemon
# or
npm start   # Production
```

The server will start on `http://localhost:3000`

---

## API Endpoints

### Get Banks

```bash
# Nigeria
GET /api/payment/flutterwave/banks/ng

# Kenya
GET /api/payment/flutterwave/banks/ke
```

### Get Mobile Money Providers

```bash
GET /api/payment/flutterwave/mobile-money/providers?country=NG
```

### Withdraw to Bank

```bash
POST /api/payment/flutterwave/withdraw/ng-bank
# or
POST /api/payment/flutterwave/withdraw/ke-bank

Body:
{
  "phoneNumber": "+2348012345678",
  "amount": 50000,
  "accountNumber": "1234567890",
  "bankCode": "058",
  "pin": "1234"
}
```

### Withdraw to Mobile Money

```bash
POST /api/payment/flutterwave/withdraw/mobile-money

Body:
{
  "phoneNumber": "+2348012345678",
  "amount": 50000,
  "recipientPhone": "+2349087654321",
  "provider": "MTN",
  "pin": "1234",
  "country": "NG"
}
```

---

## Frontend Integration

See `docs/FRONTEND_INTEGRATION.md` for complete examples in:
- React
- Vue.js
- Vanilla JavaScript

Quick example:

```javascript
const response = await fetch('http://localhost:3000/api/payment/flutterwave/withdraw/ng-bank', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2348012345678',
    amount: 50000,
    accountNumber: '1234567890',
    bankCode: '058',
    pin: '1234'
  })
});

const result = await response.json();
console.log(result);
```

---

## USSD Integration

Users can access Flutterwave withdrawals via USSD:

1. Dial `*123#`
2. Select `3. Withdraw Money`
3. Select `4. Flutterwave`
4. Choose country (Nigeria/Kenya)
5. Choose payment method (Bank/Mobile Money)
6. Follow prompts for account details
7. Enter PIN to confirm

---

## File Structure

```
backend/
├── config/
│   └── flutterwave.js              # Configuration
├── src/
│   ├── controllers/
│   │   └── paymentController.js    # HTTP handlers
│   ├── routes/
│   │   └── payment.js              # API routes
│   ├── services/
│   │   ├── flutterwaveService.js   # Core Flutterwave logic
│   │   ├── paymentService.js       # Payment orchestration
│   │   └── ussdService.js          # USSD integration
│   └── utils/
│       ├── ussdBuilder.js          # USSD UI builder
│       ├── helpers.js              # Utility functions
│       └── logger.js               # Winston logger
├── docs/
│   ├── FLUTTERWAVE_API.md          # Complete API reference
│   ├── FRONTEND_INTEGRATION.md     # Frontend examples
│   └── IMPLEMENTATION_SUMMARY.md   # Implementation details
└── .env.example                    # Environment template
```

---

## Key Classes & Functions

### FlutterwaveService

```javascript
// src/services/flutterwaveService.js

// Bank transfers
await flutterwaveService.initiateNigerianBankTransfer(transferData);
await flutterwaveService.initiateKenyanBankTransfer(transferData);

// Mobile money
await flutterwaveService.initiateMobileMoneyTransfer(transferData);

// Verification & Status
await flutterwaveService.verifyAccountNumber(accountNumber, bankCode);
await flutterwaveService.getTransferStatus(transferId);

// Utilities
flutterwaveService.getNigerianBanks();
flutterwaveService.getKenyanBanks();
flutterwaveService.getMobileMoneyProviders(country);
```

### PaymentService

```javascript
// src/services/paymentService.js

// Flutterwave methods
await paymentService.withdrawToNigerianBank({...});
await paymentService.withdrawToKenyanBank({...});
await paymentService.withdrawToMobileMoneyFlutterwave({...});
await paymentService.getFlutterwaveTransferStatus(transferId);
```

---

## Testing

### 1. Using cURL

```bash
# Get Nigerian banks
curl http://localhost:3000/api/payment/flutterwave/banks/ng

# Test withdrawal
curl -X POST http://localhost:3000/api/payment/flutterwave/withdraw/ng-bank \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "amount": 50000,
    "accountNumber": "1234567890",
    "bankCode": "058",
    "pin": "1234"
  }'
```

### 2. Using Postman

Import the collection from API docs and test each endpoint.

### 3. Using Python

```python
import requests

url = 'http://localhost:3000/api/payment/flutterwave/banks/ng'
response = requests.get(url)
print(response.json())
```

---

## Demo Mode vs Production

### Demo Mode (Default)
- All transfers are simulated
- No real money movement
- Perfect for testing UI/UX
- Set `DEMO_MODE=true` in `.env`

### Production Mode
- Real Flutterwave API integration
- Live transactions
- Set `DEMO_MODE=false` in `.env`
- Requires valid Flutterwave credentials

To enable production:

1. Get Flutterwave API keys from https://dashboard.flutterwave.com
2. Update `.env` with credentials
3. Set `DEMO_MODE=false`
4. Test with small amounts first

---

## Supported Methods

### Nigeria
- **Banks**: GTBank, Access Bank, Zenith Bank, etc. (9 total)
- **Mobile Money**: MTN, Airtel, Glo, 9Mobile
- **Currency**: NGN (Nigerian Naira)

### Kenya
- **Banks**: KCB, Equity Bank, Co-op Bank, Standard Chartered
- **Mobile Money**: M-Pesa, Airtel Money
- **Currency**: KES (Kenyan Shilling)

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- `Invalid PIN` - PIN verification failed
- `User not found` - Phone number not registered
- `Bank not supported` - Selected bank unavailable
- `Insufficient balance` - Not enough funds
- `Account verification failed` - Invalid account details

---

## Security

✅ **PIN Protection**: All withdrawals require PIN verification
✅ **Data Masking**: Sensitive info masked in responses
✅ **Encryption**: Sensitive data encrypted at rest
✅ **Logging**: All transactions logged
✅ **Validation**: Input validation on all endpoints

---

## Troubleshooting

### "Invalid PIN" Error
- Ensure PIN is correct
- PIN should be 4 digits
- Check user is properly registered

### "Bank not supported" Error
- Verify bank code is correct
- Check supported banks endpoint
- Use exact bank code from list

### "Account verification failed" Error
- Verify account number format
- Ensure account number is 10 digits for Nigeria
- Check bank code is valid

### Slow Response Times
- Check network connection
- Verify API keys are correct
- Check database connection
- Review server logs: `tail -f logs/error.log`

---

## Documentation

- **Complete API Reference**: `docs/FLUTTERWAVE_API.md`
- **Frontend Integration Guide**: `docs/FRONTEND_INTEGRATION.md`
- **Implementation Details**: `docs/IMPLEMENTATION_SUMMARY.md`
- **Flutterwave Official Docs**: https://developer.flutterwave.com

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test API endpoints with cURL
3. ✅ Build frontend UI (see examples)
4. ✅ Integrate into your app
5. ✅ Get production credentials
6. ✅ Test with real transactions
7. ✅ Deploy to production

---

## Support

- **Issues**: Check logs in `logs/` directory
- **Questions**: See docs in `backend/docs/`
- **Flutterwave Help**: https://support.flutterwave.com
- **Email**: support@kudipay.com

---

## License

MIT - See LICENSE file

---

**Happy coding! 🚀**

