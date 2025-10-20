# KudiPay Flutterwave Integration API Documentation

## Overview

This document provides comprehensive API documentation for the Flutterwave integration in KudiPay, enabling users to withdraw funds via bank transfers and mobile money in Nigeria and Kenya.

---

## Base URL

```
http://localhost:3000/api/payment
```

---

## Endpoints

### 1. Nigerian Bank Withdrawal

**Endpoint:** `POST /flutterwave/withdraw/ng-bank`

**Description:** Initiate a bank transfer withdrawal to a Nigerian bank account via Flutterwave.

**Request Body:**
```json
{
  "phoneNumber": "+2348012345678",
  "amount": 50000,
  "accountNumber": "1234567890",
  "bankCode": "058",
  "pin": "1234",
  "accountName": "John Doe"
}
```

**Parameters:**
- `phoneNumber` (string, required): User's registered phone number
- `amount` (number, required): Withdrawal amount in NGN
- `accountNumber` (string, required): 10-digit bank account number
- `bankCode` (string, required): Bank code (e.g., '058' for GTBank)
- `pin` (string, required): User's 4-digit wallet PIN
- `accountName` (string, optional): Account holder name

**Response (Success):**
```json
{
  "success": true,
  "message": "Nigerian bank withdrawal initiated via Flutterwave",
  "data": {
    "success": true,
    "transferId": "FW_NG_1729442560000",
    "txRef": "KP_TIMESTAMP_RANDOM",
    "amount": 50000,
    "currency": "NGN",
    "bank": "GTBank",
    "accountNumber": "****7890",
    "status": "pending",
    "estimatedTime": "2-24 hours",
    "message": "Transfer initiated successfully"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid PIN. Withdrawal cancelled."
}
```

**Status Codes:**
- `200`: Withdrawal initiated successfully
- `400`: Invalid input or validation error
- `500`: Server error

---

### 2. Kenyan Bank Withdrawal

**Endpoint:** `POST /flutterwave/withdraw/ke-bank`

**Description:** Initiate a bank transfer withdrawal to a Kenyan bank account via Flutterwave.

**Request Body:**
```json
{
  "phoneNumber": "+254712345678",
  "amount": 7000,
  "accountNumber": "0123456789",
  "bankCode": "63f47f9e5e0000f812345678",
  "pin": "1234",
  "accountName": "Jane Smith"
}
```

**Parameters:**
- `phoneNumber` (string, required): User's registered phone number
- `amount` (number, required): Withdrawal amount in KES
- `accountNumber` (string, required): Bank account number
- `bankCode` (string, required): Flutterwave bank ID for Kenya
- `pin` (string, required): User's 4-digit wallet PIN
- `accountName` (string, optional): Account holder name

**Response (Success):**
```json
{
  "success": true,
  "message": "Kenyan bank withdrawal initiated via Flutterwave",
  "data": {
    "success": true,
    "transferId": "FW_KE_1729442560000",
    "txRef": "KP_TIMESTAMP_RANDOM",
    "amount": 980000,
    "currency": "KES",
    "bank": "Kenya Commercial Bank",
    "accountNumber": "****6789",
    "status": "pending",
    "estimatedTime": "1-4 hours",
    "message": "Transfer initiated successfully"
  }
}
```

---

### 3. Mobile Money Withdrawal

**Endpoint:** `POST /flutterwave/withdraw/mobile-money`

**Description:** Initiate a mobile money withdrawal via Flutterwave for Nigeria or Kenya.

**Request Body:**
```json
{
  "phoneNumber": "+2348012345678",
  "amount": 50000,
  "recipientPhone": "+2349087654321",
  "provider": "MTN",
  "pin": "1234",
  "country": "NG"
}
```

**Parameters:**
- `phoneNumber` (string, required): User's registered phone number
- `amount` (number, required): Withdrawal amount (NGN or KES)
- `recipientPhone` (string, required): Recipient's mobile money account number
- `provider` (string, required): Mobile money provider code (MTN, AIRTEL, MPESA, GLO, 9MOBILE)
- `pin` (string, required): User's 4-digit wallet PIN
- `country` (string, required): Country code ('NG' for Nigeria, 'KE' for Kenya)

**Response (Success):**
```json
{
  "success": true,
  "message": "Mobile money withdrawal initiated via Flutterwave",
  "data": {
    "success": true,
    "transferId": "FW_MM_1729442560000",
    "txRef": "KP_TIMESTAMP_RANDOM",
    "amount": 50000,
    "currency": "NGN",
    "provider": "MTN Mobile Money",
    "recipientPhone": "****4321",
    "status": "pending",
    "estimatedTime": "5-30 minutes",
    "message": "Mobile money transfer initiated successfully"
  }
}
```

---

### 4. Get Nigerian Banks

**Endpoint:** `GET /flutterwave/banks/ng`

**Description:** Retrieve list of supported Nigerian banks.

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "message": "Nigerian banks retrieved successfully",
  "data": [
    { "code": "044", "name": "Access Bank", "country": "NG" },
    { "code": "050", "name": "Ecobank", "country": "NG" },
    { "code": "011", "name": "First Bank", "country": "NG" },
    { "code": "070", "name": "Fidelity Bank", "country": "NG" },
    { "code": "058", "name": "GTBank", "country": "NG" }
  ]
}
```

---

### 5. Get Kenyan Banks

**Endpoint:** `GET /flutterwave/banks/ke`

**Description:** Retrieve list of supported Kenyan banks.

**Response:**
```json
{
  "success": true,
  "message": "Kenyan banks retrieved successfully",
  "data": [
    { "code": "63f47f9e5e0000f812345678", "name": "Kenya Commercial Bank", "country": "KE" },
    { "code": "63f47f9e5e0000f812345679", "name": "Equity Bank", "country": "KE" },
    { "code": "63f47f9e5e0000f812345680", "name": "Co-operative Bank", "country": "KE" }
  ]
}
```

---

### 6. Get Mobile Money Providers

**Endpoint:** `GET /flutterwave/mobile-money/providers?country=NG`

**Description:** Retrieve list of mobile money providers for a specific country.

**Query Parameters:**
- `country` (string, optional): Country code ('NG' for Nigeria, 'KE' for Kenya). Default: 'NG'

**Response:**
```json
{
  "success": true,
  "message": "Mobile money providers retrieved successfully",
  "data": [
    {
      "code": "MTN",
      "name": "MTN Mobile Money",
      "countries": ["NG", "GH"],
      "minAmount": 50,
      "maxAmount": 100000
    },
    {
      "code": "AIRTEL",
      "name": "Airtel Money",
      "countries": ["NG", "KE"],
      "minAmount": 50,
      "maxAmount": 100000
    }
  ]
}
```

---

### 7. Verify Account

**Endpoint:** `POST /flutterwave/verify/account`

**Description:** Verify a bank account before processing withdrawal.

**Request Body:**
```json
{
  "accountNumber": "1234567890",
  "bankCode": "058",
  "country": "NG"
}
```

**Parameters:**
- `accountNumber` (string, required): Bank account number
- `bankCode` (string, required): Bank code
- `country` (string, optional): Country code. Default: 'NG'

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "accountNumber": "1234567890",
    "bankCode": "058",
    "accountName": "Demo User 456",
    "verified": true
  }
}
```

---

### 8. Get Transfer Status

**Endpoint:** `GET /flutterwave/transfer/:transferId/status`

**Description:** Check the status of a Flutterwave transfer.

**Parameters:**
- `transferId` (string, required): Flutterwave transfer ID from withdrawal response

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "FW_NG_1729442560000",
    "status": "successful",
    "timestamp": "2025-10-20T10:30:00.000Z",
    "message": "Transfer status: successful"
  }
}
```

---

### 9. Webhook Callback

**Endpoint:** `POST /flutterwave/webhook`

**Description:** Receive and process Flutterwave webhook notifications for transfer status updates.

**Webhook Payload (Flutterwave sends):**
```json
{
  "data": {
    "reference": "FW_NG_1729442560000",
    "status": "successful",
    "tx_ref": "KP_TIMESTAMP_RANDOM"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Webhook processed successfully"
  }
}
```

---

## USSD Flow Integration

The Flutterwave integration is also accessible via USSD for users without smartphones.

### USSD Withdrawal Flow

1. **Main Menu** (Select "3. Withdraw Money")
2. **Withdrawal Method** (Select "4. Flutterwave")
3. **Country Selection** (Choose Nigeria or Kenya)
4. **Payment Method** (Choose Bank Transfer or Mobile Money)

#### Bank Transfer Flow:
- Select country
- Select bank from list
- Enter account number (10 digits)
- Enter PIN to confirm

#### Mobile Money Flow:
- Select country
- Select mobile money provider
- Enter recipient phone number
- Enter PIN to confirm

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | All fields required | Missing required parameters |
| 400 | Amount must be greater than 0 | Invalid amount |
| 400 | Invalid PIN | PIN verification failed |
| 400 | User not found | Phone number not registered |
| 400 | Bank not supported | Selected bank not available |
| 400 | Account verification failed | Bank account verification failed |
| 500 | Failed to process withdrawal | Server-side error |

---

## Bank Codes Reference

### Nigeria Banks
```
044: Access Bank
050: Ecobank
011: First Bank
070: Fidelity Bank
058: GTBank
076: Polaris Bank
032: Union Bank
033: United Bank for Africa
057: Zenith Bank
```

### Kenya Banks
```
KCB: Kenya Commercial Bank
EBK: Equity Bank
CBK: Co-operative Bank
SCB: Standard Chartered Bank
```

---

## Mobile Money Providers

### Nigeria
- MTN Mobile Money (code: MTN)
- Airtel Money (code: AIRTEL)
- Glo Mobile (code: GLO)
- 9Mobile Money (code: 9MOBILE)

### Kenya
- M-Pesa (code: MPESA)
- Airtel Money (code: AIRTEL)

---

## Example Requests

### cURL - Nigerian Bank Withdrawal
```bash
curl -X POST http://localhost:3000/api/payment/flutterwave/withdraw/ng-bank \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "amount": 50000,
    "accountNumber": "1234567890",
    "bankCode": "058",
    "pin": "1234",
    "accountName": "John Doe"
  }'
```

### JavaScript Fetch - Mobile Money Withdrawal
```javascript
const response = await fetch('http://localhost:3000/api/payment/flutterwave/withdraw/mobile-money', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2348012345678',
    amount: 50000,
    recipientPhone: '+2349087654321',
    provider: 'MTN',
    pin: '1234',
    country: 'NG'
  })
});

const data = await response.json();
console.log(data);
```

### Python Requests - Get Banks
```python
import requests

url = 'http://localhost:3000/api/payment/flutterwave/banks/ng'
response = requests.get(url)
banks = response.json()
print(banks)
```

---

## Demo Mode

The current implementation is in **DEMO MODE** for development purposes. Real Flutterwave API integration will require:

1. Flutterwave secret key configuration
2. Encryption key setup
3. Webhook secret configuration
4. Production API endpoint activation

To enable production mode:

1. Set environment variables:
```bash
FLUTTERWAVE_API_URL=https://api.flutterwave.com/v3
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
```

2. Uncomment production API calls in `flutterwaveService.js`
3. Replace mock implementations with actual Flutterwave SDK calls

---

## Security Considerations

- **PIN Verification**: All withdrawals require user PIN verification
- **Phone Number Masking**: Sensitive phone numbers are masked in responses
- **Account Masking**: Account numbers are masked with asterisks
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Webhook Verification**: Verify webhook signatures using `FLUTTERWAVE_WEBHOOK_SECRET`

---

## Support

For issues or questions:
- Email: support@kudipay.com
- Documentation: https://docs.kudipay.com
- Flutterwave Docs: https://developer.flutterwave.com

