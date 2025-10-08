# KudiPay Backend

A Node.js backend API for KudiPay - A hybrid USSD-blockchain remittance system for Africa.

## 🚀 Features

- **USSD Integration**: Works with any phone (no smartphone required)
- **Account Abstraction**: Gas-free blockchain transactions
- **Phone-to-Wallet Mapping**: Each phone number gets a permanent blockchain wallet
- **Real-time FX Conversion**: Automatic crypto-to-fiat conversion
- **Multi-channel Payouts**: Bank accounts, mobile money, cash agents

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.js              # Entry point
│   ├── routes/               # API routes
│   │   ├── ussd.js          # USSD endpoints
│   │   ├── wallet.js        # Wallet operations
│   │   ├── fx.js            # Exchange rates
│   │   ├── payment.js       # Payments/withdrawals
│   │   └── user.js          # User management
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   │   ├── ussdService.js   # USSD menu logic
│   │   ├── walletService.js # Blockchain operations
│   │   ├── fxService.js     # Exchange rates
│   │   └── blockchainService.js # Low-level blockchain
│   ├── models/              # Database models
│   │   ├── User.js          # User model
│   │   ├── Transaction.js   # Transaction model
│   │   └── UssdSession.js   # USSD session model
│   ├── middleware/          # Express middleware
│   ├── validators/          # Input validation
│   └── utils/               # Helper functions
├── config/                  # Configuration files
├── tests/                   # Test files
├── docs/                    # API documentation
└── package.json
```

## 🛠️ Setup

### Prerequisites

- Node.js >= 16.0.0
- PostgreSQL >= 12
- Base network RPC access

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Goodnessukaigwe/KudiPay-smartcontract.git
cd KudiPay-smartcontract/backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment setup**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**

```bash
# Create PostgreSQL database
createdb kudipay

# Run migrations (create schema.sql first)
psql -d kudipay -f schema.sql
```

5. **Start the server**

```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable                  | Description       | Example                    |
| ------------------------- | ----------------- | -------------------------- |
| `NODE_ENV`                | Environment       | `development`              |
| `PORT`                    | Server port       | `3000`                     |
| `DB_HOST`                 | Database host     | `localhost`                |
| `RPC_URL`                 | Base network RPC  | `https://sepolia.base.org` |
| `AFRICAS_TALKING_API_KEY` | USSD provider key | `your_api_key`             |

### USSD Configuration

The USSD menu structure is defined in `config/ussd.js`:

```javascript
menu: {
  mainMenu: {
    '1': 'Register Phone Number',
    '2': 'Check Balance',
    '3': 'Withdraw Money',
    '4': 'Transaction History',
    '0': 'Exit'
  }
}
```

## 📱 USSD Flow

### Registration Flow

1. User dials `*123*1#`
2. System prompts for 4-digit PIN
3. PIN confirmation
4. Wallet created and mapped to phone number

### Transaction Flow

1. User dials `*123#`
2. Select "Check Balance" or "Withdraw Money"
3. Enter PIN for authentication
4. Complete transaction

## 🔗 API Endpoints

### USSD Routes

- `POST /api/ussd/callback` - Main USSD handler
- `GET /api/ussd/sessions/active` - Active sessions

### Wallet Routes

- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet/phone/:phoneNumber` - Get wallet by phone
- `POST /api/wallet/send` - Send transaction

### FX Routes

- `GET /api/fx/rates` - Current exchange rates
- `POST /api/fx/convert` - Convert currencies

### Payment Routes

- `POST /api/payment/withdraw/bank` - Bank withdrawal
- `POST /api/payment/withdraw/mobile-money` - Mobile money

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  private_key VARCHAR(66) NOT NULL,
  pin VARCHAR(4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  tx_ref VARCHAR(50) UNIQUE NOT NULL,
  from_phone VARCHAR(20),
  to_phone VARCHAR(20),
  from_wallet VARCHAR(42),
  to_wallet VARCHAR(42),
  amount DECIMAL(18,6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDT',
  amount_ngn DECIMAL(15,2),
  exchange_rate DECIMAL(10,4),
  fee DECIMAL(18,6) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  type VARCHAR(20) NOT NULL,
  blockchain_hash VARCHAR(66),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 💱 FX Engine (NEW!)

A production-ready foreign exchange engine that converts crypto to local currency with profitable markup.

### Features

- **Real-time rates** from Binance, Chainlink, and fallback providers
- **1-3% configurable markup** for profit generation
- **Automatic failover** with circuit breaker pattern
- **Comprehensive logging** of all conversions for analytics
- **Volume discounts** for large transactions
- **Profit tracking** with detailed analytics

### Quick Start

```bash
# Get current rates
curl http://localhost:3000/api/fx/rates

# Convert USDC to NGN
curl -X POST http://localhost:3000/api/fx/convert \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"fromCurrency":"USDC","toCurrency":"NGN"}'

# View profit statistics
curl http://localhost:3000/api/fx/profit/stats?timeframe=24h
```

### Documentation

- **Full Guide**: [FX_ENGINE.md](./docs/FX_ENGINE.md)
- **Quick Start**: [FX_QUICKSTART.md](./FX_QUICKSTART.md)
- **Implementation**: [FX_IMPLEMENTATION_SUMMARY.md](./FX_IMPLEMENTATION_SUMMARY.md)

### Supported Pairs

- USDC/NGN, USDT/NGN (Stablecoins)
- ETH/NGN, BTC/NGN (Crypto)
- ETH/USD, BTC/USD (Crypto to USD)
- USD/NGN, NGN/USD (Fiat pairs)

### Configuration

Set markup rates in `.env`:

```bash
FX_MARKUP_USDC_NGN=0.02    # 2% markup
FX_MARKUP_ETH_NGN=0.025    # 2.5% markup for volatile assets
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Test USSD menu
curl http://localhost:3000/api/ussd/test-menu

# Test FX Engine (comprehensive)
node scripts/test_fx_engine.js
```

## 🚀 Deployment

### Using Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-specific configs

- **Development**: Uses local PostgreSQL and testnet
- **Staging**: Uses cloud database and testnet
- **Production**: Uses cloud database and mainnet

## 📊 Monitoring

- **Logs**: Winston logger with file and console output
- **Health check**: `GET /health`
- **Metrics**: Monitor USSD sessions, transaction volume

## 🔐 Security

- PIN hashing with bcrypt
- Private key encryption
- Rate limiting on API endpoints
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Email: support@kudipay.com
- Documentation: [API Docs](./docs/)
- Issues: [GitHub Issues](https://github.com/Goodnessukaigwe/KudiPay-smartcontract/issues)
