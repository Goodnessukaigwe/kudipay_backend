# KudiPay Flutterwave Demo - Frontend Quick Start Guide

This guide shows you how to integrate the Flutterwave payment endpoints into your frontend application.

## Installation

```bash
npm install axios  # or your preferred HTTP client
```

## Frontend Examples

### 1. Service Class Setup

Create a `flutterwaveService.js` file in your frontend:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/payment';

class FlutterwaveService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Nigerian Bank Withdrawal
  async withdrawToNigerianBank(data) {
    try {
      const response = await this.client.post('/flutterwave/withdraw/ng-bank', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Kenyan Bank Withdrawal
  async withdrawToKenyanBank(data) {
    try {
      const response = await this.client.post('/flutterwave/withdraw/ke-bank', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Mobile Money Withdrawal
  async withdrawToMobileMoneyFlutterwave(data) {
    try {
      const response = await this.client.post('/flutterwave/withdraw/mobile-money', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get Nigerian Banks
  async getNigerianBanks() {
    try {
      const response = await this.client.get('/flutterwave/banks/ng');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get Kenyan Banks
  async getKenyanBanks() {
    try {
      const response = await this.client.get('/flutterwave/banks/ke');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get Mobile Money Providers
  async getMobileMoneyProviders(country = 'NG') {
    try {
      const response = await this.client.get('/flutterwave/mobile-money/providers', {
        params: { country }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Verify Account
  async verifyAccount(accountNumber, bankCode, country = 'NG') {
    try {
      const response = await this.client.post('/flutterwave/verify/account', {
        accountNumber,
        bankCode,
        country
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Get Transfer Status
  async getTransferStatus(transferId) {
    try {
      const response = await this.client.get(`/flutterwave/transfer/${transferId}/status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new FlutterwaveService();
```

### 2. React Component Example

```javascript
import React, { useState, useEffect } from 'react';
import flutterwaveService from './flutterwaveService';

export default function WithdrawalForm() {
  const [country, setCountry] = useState('NG');
  const [method, setMethod] = useState('bank');
  const [banks, setBanks] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    phoneNumber: '+2348012345678',
    amount: 50000,
    accountNumber: '',
    bankCode: '',
    recipientPhone: '',
    provider: '',
    pin: ''
  });

  // Load banks on country change
  useEffect(() => {
    loadBanks();
    loadMobileMoneyProviders();
  }, [country]);

  const loadBanks = async () => {
    try {
      const response = country === 'NG' 
        ? await flutterwaveService.getNigerianBanks()
        : await flutterwaveService.getKenyanBanks();
      setBanks(response.data || []);
    } catch (error) {
      setMessage(`Error loading banks: ${error.message}`);
    }
  };

  const loadMobileMoneyProviders = async () => {
    try {
      const response = await flutterwaveService.getMobileMoneyProviders(country);
      setProviders(response.data || []);
    } catch (error) {
      setMessage(`Error loading providers: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        phoneNumber: formData.phoneNumber,
        amount: parseFloat(formData.amount),
        accountNumber: formData.accountNumber,
        bankCode: formData.bankCode,
        pin: formData.pin
      };

      const response = country === 'NG'
        ? await flutterwaveService.withdrawToNigerianBank(payload)
        : await flutterwaveService.withdrawToKenyanBank(payload);

      if (response.success) {
        setMessage(`✓ Withdrawal successful! Ref: ${response.data.txRef}`);
        // Clear form or redirect to success page
      } else {
        setMessage(`✗ ${response.message}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message || 'Withdrawal failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileMoneyTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const payload = {
        phoneNumber: formData.phoneNumber,
        amount: parseFloat(formData.amount),
        recipientPhone: formData.recipientPhone,
        provider: formData.provider,
        pin: formData.pin,
        country
      };

      const response = await flutterwaveService.withdrawToMobileMoneyFlutterwave(payload);

      if (response.success) {
        setMessage(`✓ Mobile money transfer successful! Ref: ${response.data.txRef}`);
      } else {
        setMessage(`✗ ${response.message}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message || 'Transfer failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdrawal-form">
      <h2>Flutterwave Withdrawal</h2>

      {message && (
        <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form>
        <div className="form-group">
          <label>Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="NG">Nigeria (NGN)</option>
            <option value="KE">Kenya (KES)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="bank">Bank Transfer</option>
            <option value="mobile">Mobile Money</option>
          </select>
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="+2348012345678"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount ({country === 'NG' ? 'NGN' : 'KES'})</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="50000"
            min="100"
            required
          />
        </div>

        {method === 'bank' ? (
          <>
            <div className="form-group">
              <label>Bank</label>
              <select
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                required
              >
                <option value="">Select bank...</option>
                {banks.map(bank => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="1234567890"
                maxLength="10"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Mobile Money Provider</label>
              <select
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                required
              >
                <option value="">Select provider...</option>
                {providers.map(provider => (
                  <option key={provider.code} value={provider.code}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Recipient Phone</label>
              <input
                type="tel"
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={handleInputChange}
                placeholder="+2349087654321"
                required
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>PIN</label>
          <input
            type="password"
            name="pin"
            value={formData.pin}
            onChange={handleInputChange}
            placeholder="****"
            maxLength="4"
            required
          />
        </div>

        <button
          type="submit"
          onClick={method === 'bank' ? handleBankTransfer : handleMobileMoneyTransfer}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Withdraw'}
        </button>
      </form>
    </div>
  );
}
```

### 3. Vue.js Component Example

```vue
<template>
  <div class="withdrawal-form">
    <h2>Flutterwave Withdrawal</h2>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Country</label>
        <select v-model="country" @change="loadBanks">
          <option value="NG">Nigeria (NGN)</option>
          <option value="KE">Kenya (KES)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <select v-model="method">
          <option value="bank">Bank Transfer</option>
          <option value="mobile">Mobile Money</option>
        </select>
      </div>

      <div class="form-group">
        <label>Phone Number</label>
        <input v-model="formData.phoneNumber" type="tel" required />
      </div>

      <div class="form-group">
        <label>Amount ({{ country === 'NG' ? 'NGN' : 'KES' }})</label>
        <input v-model.number="formData.amount" type="number" min="100" required />
      </div>

      <template v-if="method === 'bank'">
        <div class="form-group">
          <label>Bank</label>
          <select v-model="formData.bankCode" required>
            <option value="">Select bank...</option>
            <option v-for="bank in banks" :key="bank.code" :value="bank.code">
              {{ bank.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Account Number</label>
          <input v-model="formData.accountNumber" type="text" maxlength="10" required />
        </div>
      </template>

      <template v-else>
        <div class="form-group">
          <label>Mobile Money Provider</label>
          <select v-model="formData.provider" required>
            <option value="">Select provider...</option>
            <option v-for="provider in providers" :key="provider.code" :value="provider.code">
              {{ provider.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Recipient Phone</label>
          <input v-model="formData.recipientPhone" type="tel" required />
        </div>
      </template>

      <div class="form-group">
        <label>PIN</label>
        <input v-model="formData.pin" type="password" maxlength="4" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Processing...' : 'Withdraw' }}
      </button>
    </form>
  </div>
</template>

<script>
import flutterwaveService from './flutterwaveService';

export default {
  data() {
    return {
      country: 'NG',
      method: 'bank',
      banks: [],
      providers: [],
      loading: false,
      message: '',
      messageType: '',
      formData: {
        phoneNumber: '+2348012345678',
        amount: 50000,
        accountNumber: '',
        bankCode: '',
        recipientPhone: '',
        provider: '',
        pin: ''
      }
    };
  },
  mounted() {
    this.loadBanks();
  },
  methods: {
    async loadBanks() {
      try {
        const response = this.country === 'NG'
          ? await flutterwaveService.getNigerianBanks()
          : await flutterwaveService.getKenyanBanks();
        this.banks = response.data || [];
        
        const provResponse = await flutterwaveService.getMobileMoneyProviders(this.country);
        this.providers = provResponse.data || [];
      } catch (error) {
        this.showMessage('Error loading data', 'error');
      }
    },
    async handleSubmit() {
      this.loading = true;
      this.message = '';

      try {
        let response;
        if (this.method === 'bank') {
          const payload = {
            phoneNumber: this.formData.phoneNumber,
            amount: this.formData.amount,
            accountNumber: this.formData.accountNumber,
            bankCode: this.formData.bankCode,
            pin: this.formData.pin
          };
          response = this.country === 'NG'
            ? await flutterwaveService.withdrawToNigerianBank(payload)
            : await flutterwaveService.withdrawToKenyanBank(payload);
        } else {
          response = await flutterwaveService.withdrawToMobileMoneyFlutterwave({
            phoneNumber: this.formData.phoneNumber,
            amount: this.formData.amount,
            recipientPhone: this.formData.recipientPhone,
            provider: this.formData.provider,
            pin: this.formData.pin,
            country: this.country
          });
        }

        if (response.success) {
          this.showMessage(`✓ Success! Ref: ${response.data.txRef}`, 'success');
        } else {
          this.showMessage(`✗ ${response.message}`, 'error');
        }
      } catch (error) {
        this.showMessage(`✗ ${error.message || 'Operation failed'}`, 'error');
      } finally {
        this.loading = false;
      }
    },
    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
    }
  }
};
</script>

<style scoped>
.withdrawal-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
```

## Testing

Use Postman or any HTTP client to test the endpoints:

1. **Get Nigerian Banks:**
   - GET `http://localhost:3000/api/payment/flutterwave/banks/ng`

2. **Nigerian Bank Withdrawal:**
   - POST `http://localhost:3000/api/payment/flutterwave/withdraw/ng-bank`
   - Body:
   ```json
   {
     "phoneNumber": "+2348012345678",
     "amount": 50000,
     "accountNumber": "1234567890",
     "bankCode": "058",
     "pin": "1234"
   }
   ```

3. **Check Transfer Status:**
   - GET `http://localhost:3000/api/payment/flutterwave/transfer/FW_NG_1729442560000/status`

## Error Handling

Always wrap API calls in try-catch blocks:

```javascript
try {
  const response = await flutterwaveService.withdrawToNigerianBank(data);
  // Handle success
} catch (error) {
  console.error('Withdrawal failed:', error);
  // Handle error
}
```

## Production Checklist

- [ ] Update Flutterwave secret key in `.env`
- [ ] Update Flutterwave encryption key
- [ ] Set webhook secret for Flutterwave callbacks
- [ ] Enable production API endpoint in `flutterwaveService.js`
- [ ] Set `NODE_ENV=production`
- [ ] Test with real transactions
- [ ] Implement proper error logging
- [ ] Set up monitoring and alerts

