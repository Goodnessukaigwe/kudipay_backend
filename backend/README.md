# KudiPay Backend 🚀# KudiPay Backend



A Node.js backend API for KudiPay - A hybrid USSD-blockchain remittance system for Africa.A Node.js backend API for KudiPay - A hybrid USSD-blockchain remittance system for Africa.



[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)## 🚀 Features

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-blue)](https://www.postgresql.org/)

[![Base Network](https://img.shields.io/badge/Base-Sepolia-orange)](https://base.org/)- **USSD Integration**: Works with any phone (no smartphone required)

- **Account Abstraction**: Gas-free blockchain transactions

## 🚀 Features- **Phone-to-Wallet Mapping**: Each phone number gets a permanent blockchain wallet

- **Real-time FX Conversion**: Automatic crypto-to-fiat conversion

- ✅ **USSD Integration** - Works with any phone via Africa's Talking- **Multi-channel Payouts**: Bank accounts, mobile money, cash agents

- ✅ **Account Abstraction** - Gas-free blockchain transactions on Base

- ✅ **Phone-to-Wallet Mapping** - Permanent blockchain wallet per phone number## 📁 Project Structure

- ✅ **Multi-Provider FX Engine** - Real-time crypto-to-fiat (93.75% uptime)

- ✅ **Multi-channel Payouts** - Banks, mobile money via Flutterwave```

- ✅ **PIN Security** - Secure authentication with bcryptbackend/

- ✅ **Comprehensive Testing** - 15/16 integration tests passing├── src/

│   ├── index.js              # Entry point

## 📁 Project Structure│   ├── routes/               # API routes

│   │   ├── ussd.js          # USSD endpoints

```│   │   ├── wallet.js        # Wallet operations

backend/│   │   ├── fx.js            # Exchange rates

├── bin/                  # Executable scripts (setup, testing)│   │   ├── payment.js       # Payments/withdrawals

├── config/               # Configuration (blockchain, db, ussd)│   │   └── user.js          # User management

├── docs/                 # Documentation│   ├── controllers/          # Request handlers

│   └── guides/          # User guides and tutorials│   ├── services/            # Business logic

├── migrations/           # Database migrations│   │   ├── ussdService.js   # USSD menu logic

├── src/                  # Source code│   │   ├── walletService.js # Blockchain operations

│   ├── controllers/     # Request handlers│   │   ├── fxService.js     # Exchange rates

│   ├── models/          # Database models│   │   └── blockchainService.js # Low-level blockchain

│   ├── routes/          # API routes│   ├── models/              # Database models

│   ├── services/        # Business logic│   │   ├── User.js          # User model

│   │   └── fx/          # FX engine (3 providers)│   │   ├── Transaction.js   # Transaction model

│   └── utils/           # Helpers│   │   └── UssdSession.js   # USSD session model

└── tests/                # Test suites│   ├── middleware/          # Express middleware

    └── integration/     # Integration tests│   ├── validators/          # Input validation

```│   └── utils/               # Helper functions

├── config/                  # Configuration files

## 🛠️ Quick Start├── tests/                   # Test files

├── docs/                    # API documentation

### Prerequisites└── package.json

- Node.js >= 16.0.0```

- PostgreSQL >= 12

- Base Sepolia RPC access## 🛠️ Setup

- Africa's Talking account (sandbox)

### Prerequisites

### Installation

- Node.js >= 16.0.0

```bash- PostgreSQL >= 12

# 1. Install dependencies- Base network RPC access

npm install

### Installation

# 2. Setup environment

cp .env.example .env1. **Clone the repository**

# Edit .env with your values

```bash

# 3. Setup databasegit clone https://github.com/Goodnessukaigwe/KudiPay-smartcontract.git

createdb kudipaycd KudiPay-smartcontract/backend

psql kudipay < schema.sql```

psql kudipay < migrations/*.sql

2. **Install dependencies**

# 4. Start server

npm start```bash

```npm install

```

## 🧪 Testing

3. **Environment setup**

```bash

# Run all tests```bash

npm testcp .env.example .env

# Edit .env with your configuration

# Test FX engine (3 providers)```

npm run test:fx

4. **Database setup**

# Test USSD integration

npm run test:ussd```bash

```# Create PostgreSQL database

createdb kudipay

**Current Test Results**: 15/16 passing (93.75%)

- ✅ Binance: 10/10 (including USD/NGN fiat conversion)# Run migrations (create schema.sql first)

- ✅ Chainlink: 2/3 (BigInt fixes applied)psql -d kudipay -f schema.sql

- ✅ Fallback: 3/3 (CoinGecko, CryptoCompare, ExchangeRate-API)```



## 📚 Documentation5. **Start the server**



### Getting Started```bash

- **[Quick Start](docs/QUICK_START_ORGANIZED.md)** - 5-minute setup guide# Development

- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Complete architecturenpm run dev

- **[Quick Reference](docs/guides/QUICK_REFERENCE.md)** - Common commands

# Production

### Integration Guidesnpm start

- **[FX Engine Guide](docs/guides/FX_QUICKSTART.md)** - Multi-provider FX system```

- **[Africa's Talking Setup](docs/guides/AFRICAS_TALKING_SANDBOX_GUIDE.md)** - USSD integration

- **[Testing Guide](docs/guides/TESTING_WITH_AT_SIMULATOR.md)** - Simulator testing## 🔧 Configuration

- **[Flutterwave Integration](docs/FLUTTERWAVE_README.md)** - Payment gateway

### Environment Variables

### Implementation Summaries

- **[FX Implementation](docs/guides/FX_IMPLEMENTATION_SUMMARY.md)** - Detailed FX engine docs| Variable                  | Description       | Example                    |

- **[Completion Summary](docs/COMPLETION_SUMMARY.md)** - Project completion status| ------------------------- | ----------------- | -------------------------- |

- **[Organization Summary](docs/ORGANIZATION_SUMMARY.md)** - Codebase organization| `NODE_ENV`                | Environment       | `development`              |

| `PORT`                    | Server port       | `3000`                     |

## 🏗️ Architecture Highlights| `DB_HOST`                 | Database host     | `localhost`                |

| `RPC_URL`                 | Base network RPC  | `https://sepolia.base.org` |

### FX Engine (Multi-Provider Fallback)| `AFRICAS_TALKING_API_KEY` | USSD provider key | `your_api_key`             |

1. **Primary**: Binance Spot API - Fast, free, real-time crypto prices

2. **Secondary**: Chainlink Price Feeds - On-chain, decentralized oracles### USSD Configuration

3. **Tertiary**: Multiple HTTP APIs - CoinGecko, CryptoCompare, ExchangeRate-API

The USSD menu structure is defined in `config/ussd.js`:

**Conversion Flow**: `ETH → USD → NGN`

- Uses composite rates for unsupported pairs```javascript

- 5-minute caching with stale fallbackmenu: {

- Automatic provider failover  mainMenu: {

    '1': 'Register Phone Number',

### USSD Flow    '2': 'Check Balance',

```    '3': 'Withdraw Money',

User dials *384*73588# → Africa's Talking webhook → Session management → Menu logic → Blockchain/Payment    '4': 'Transaction History',

```    '0': 'Exit'

  }

### Blockchain Integration}

- **Base Sepolia** testnet (low gas)```

- **Account Abstraction** (gas-free for users)

- **Phone-Wallet Mapping** (on-chain storage)## 📱 USSD Flow



## 🔑 Key Environment Variables### Registration Flow



```bash1. User dials `*123*1#`

# Server2. System prompts for 4-digit PIN

PORT=30003. PIN confirmation

NODE_ENV=development4. Wallet created and mapped to phone number



# Database### Transaction Flow

DB_HOST=localhost

DB_NAME=kudipay1. User dials `*123#`

DB_USER=postgres2. Select "Check Balance" or "Withdraw Money"

3. Enter PIN for authentication

# Blockchain (Base Sepolia)4. Complete transaction

CHAIN_ID=84532

RPC_URL=https://sepolia.base.org## 🔗 API Endpoints

DEPLOYER_PRIVATE_KEY=your_key

### USSD Routes

# USSD (Africa's Talking)

AFRICAS_TALKING_USERNAME=sandbox- `POST /api/ussd/callback` - Main USSD handler

AFRICAS_TALKING_API_KEY=your_key- `GET /api/ussd/sessions/active` - Active sessions

USSD_SHORT_CODE=*384*73588#

### Wallet Routes

# Payment (Flutterwave)

FLUTTERWAVE_SECRET_KEY=your_key- `POST /api/wallet/create` - Create wallet

- `GET /api/wallet/phone/:phoneNumber` - Get wallet by phone

# Security- `POST /api/wallet/send` - Send transaction

JWT_SECRET=your_secret

PHONE_SALT=kudipay-salt-2024### FX Routes

```

- `GET /api/fx/rates` - Current exchange rates

## 📦 Available Scripts- `POST /api/fx/convert` - Convert currencies



```bash### Payment Routes

npm start           # Start production server

npm run dev         # Development server (nodemon)- `POST /api/payment/withdraw/bank` - Bank withdrawal

npm test            # Run all tests- `POST /api/payment/withdraw/mobile-money` - Mobile money

npm run test:fx     # Test FX engine

npm run test:ussd   # Test USSD integration## 🗄️ Database Schema

npm run logs        # View application logs

npm run setup:at    # Setup Africa's Talking### Users Table

```

```sql

## 🔧 TroubleshootingCREATE TABLE users (

  id SERIAL PRIMARY KEY,

### FX Engine Issues  phone_number VARCHAR(20) UNIQUE NOT NULL,

- ✅ **"Currency USD not supported"** - Fixed with fiat-to-fiat handling  wallet_address VARCHAR(42) UNIQUE NOT NULL,

- ✅ **"Cannot convert BigInt"** - Fixed with `.toString()` conversion  private_key VARCHAR(66) NOT NULL,

- ✅ **Rate limiting (429)** - Handled with caching + stale fallback  pin VARCHAR(4) NOT NULL,

  is_active BOOLEAN DEFAULT true,

### USSD Issues  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

- Check ngrok URL matches Africa's Talking dashboard  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- Phone normalization handles +234/0 prefixes automatically);

```

### Blockchain Issues

- Ensure RPC_URL matches CHAIN_ID (84532)### Transactions Table

- Deployer needs testnet ETH

```sql

## 🤝 ContributingCREATE TABLE transactions (

  id SERIAL PRIMARY KEY,

1. Fork the repository  tx_ref VARCHAR(50) UNIQUE NOT NULL,

2. Create feature branch (`git checkout -b feature/name`)  from_phone VARCHAR(20),

3. Commit changes (`git commit -m 'feat: Description'`)  to_phone VARCHAR(20),

4. Push to branch (`git push origin feature/name`)  from_wallet VARCHAR(42),

5. Open Pull Request  to_wallet VARCHAR(42),

  amount DECIMAL(18,6) NOT NULL,

## 📄 License  currency VARCHAR(10) DEFAULT 'USDT',

  amount_ngn DECIMAL(15,2),

MIT License - See [LICENSE](LICENSE) file  exchange_rate DECIMAL(10,4),

  fee DECIMAL(18,6) DEFAULT 0,

## 🙏 Acknowledgments  status VARCHAR(20) DEFAULT 'pending',

  type VARCHAR(20) NOT NULL,

- Africa's Talking - USSD infrastructure  blockchain_hash VARCHAR(66),

- Base Network - L2 blockchain  metadata JSONB,

- Binance - Primary FX data  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

- Chainlink - Decentralized oracles  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

- Flutterwave - Payment gateway);

```

---

## 💱 FX Engine (NEW!)

**Built with ❤️ for financial inclusion in Africa**

A production-ready foreign exchange engine that converts crypto to local currency with profitable markup.

📧 support@kudipay.com | 📱 Dial *384# (prod) or *384*73588# (sandbox)

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
