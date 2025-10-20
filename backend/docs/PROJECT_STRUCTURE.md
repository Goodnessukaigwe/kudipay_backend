# KudiPay Backend - Project Structure

A professional, scalable USSD payment platform with blockchain integration and FX engine.

## 📁 Directory Structure

```
backend/
├── .github/                    # GitHub Actions & CI/CD
│   └── workflows/             # Automated workflows
│
├── bin/                       # Executable scripts
│   ├── test-at-integration.sh    # AT simulator integration test
│   ├── test-ussd-manually.sh     # Manual USSD testing
│   ├── test-africas-talking.sh   # AT API testing
│   └── setup-africas-talking.sh  # AT setup script
│
├── config/                    # Configuration files
│   ├── blockchain.js          # Blockchain/Web3 config
│   ├── db.js                  # Database configuration
│   └── ussd.js                # USSD service config
│
├── docs/                      # Comprehensive documentation
│   ├── api/                   # API documentation
│   ├── architecture/          # System architecture docs
│   ├── deployment/            # Deployment guides
│   └── features/              # Feature specifications
│
├── logs/                      # Application logs
│   ├── combined.log           # All logs
│   └── error.log              # Error logs only
│
├── migrations/                # Database migrations
│   ├── add_blockchain_tracking.sql
│   ├── add_pin_security.sql
│   └── fx_conversions.sql
│
├── scripts/                   # Utility scripts
│   ├── test_blockchain_integration.js
│   ├── test_contract_integration.js
│   ├── test_fx_engine.js
│   └── test_phone_normalization.js
│
├── src/                       # Source code
│   ├── controllers/           # Request handlers
│   │   ├── fxController.js
│   │   ├── paymentController.js
│   │   ├── userController.js
│   │   ├── ussdController.js
│   │   └── walletController.js
│   │
│   ├── models/                # Data models
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   └── UssdSession.js
│   │
│   ├── routes/                # API routes
│   │   ├── fx.js
│   │   ├── payment.js
│   │   ├── user.js
│   │   ├── ussd.js
│   │   └── wallet.js
│   │
│   ├── services/              # Business logic
│   │   ├── blockchainService.js
│   │   ├── fxService.js
│   │   ├── paymentService.js
│   │   ├── phoneWalletMappingService.js
│   │   ├── ussdService.js
│   │   ├── walletService.js
│   │   └── fx/                # FX Engine modules
│   │       ├── ConversionLogger.js
│   │       ├── FxEngine.js
│   │       ├── ProfitCalculator.js
│   │       ├── RateCache.js
│   │       └── providers/
│   │           ├── BinanceProvider.js
│   │           ├── ChainlinkProvider.js
│   │           └── FallbackProvider.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── helpers.js
│   │   ├── logger.js
│   │   └── ussdBuilder.js
│   │
│   └── index.js               # Application entry point
│
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   │   ├── test-all-conversions.js
│   │   ├── test-coingecko.js
│   │   └── test-ngn-rate.js
│   └── e2e/                   # End-to-end tests
│
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies & scripts
├── schema.sql                 # Database schema
└── README.md                  # Main documentation

```

## 🏗️ Architecture Layers

### 1. **Presentation Layer** (`src/routes/`, `src/controllers/`)
- HTTP request handling
- USSD menu routing
- Input validation
- Response formatting

### 2. **Business Logic Layer** (`src/services/`)
- Core business rules
- FX conversions
- Transaction processing
- Wallet operations
- Blockchain interactions

### 3. **Data Access Layer** (`src/models/`)
- Database queries
- Data validation
- Model relationships

### 4. **Infrastructure Layer** (`config/`, `src/utils/`)
- Configuration management
- Logging
- Caching
- External API integrations

## 📦 Key Modules

### FX Engine (`src/services/fx/`)
Multi-provider foreign exchange rate system:
- **BinanceProvider**: Primary crypto price source
- **ChainlinkProvider**: On-chain oracle prices
- **FallbackProvider**: Backup APIs (CoinGecko, CryptoCompare, ExchangeRate-API)
- **RateCache**: Intelligent caching layer
- **ConversionLogger**: Audit trail for conversions
- **ProfitCalculator**: Spread/markup management

### USSD Service (`src/services/ussdService.js`)
Complete USSD flow management:
- Session state management
- Menu navigation
- User authentication (PIN)
- Transaction flows

### Blockchain Service (`src/services/blockchainService.js`)
Web3 integration:
- Smart contract interactions
- Phone-to-wallet mapping
- Transaction verification
- Gas optimization

## 🧪 Testing Strategy

### Unit Tests (`tests/unit/`)
- Individual function testing
- Mock external dependencies
- Fast execution (<100ms per test)

### Integration Tests (`tests/integration/`)
- Multi-component interactions
- Real API calls (with mocking option)
- Database transactions
- Current tests:
  - `test-all-conversions.js`: FX providers
  - `test-ngn-rate.js`: NGN rate fetching
  - `test-coingecko.js`: CoinGecko API

### E2E Tests (`tests/e2e/`)
- Full user flows
- USSD simulator integration
- Real database & blockchain
- Africa's Talking webhook testing

### Scripts (`bin/`)
- `test-at-integration.sh`: Quick AT simulator validation
- `test-ussd-manually.sh`: Manual USSD flow testing
- `test-africas-talking.sh`: AT API health check

## 🔐 Environment Configuration

### Required Variables (.env)
```bash
# Server
NODE_ENV=development|production
PORT=3000

# Database
DB_HOST=localhost
DB_NAME=kudipay
DB_USER=postgres
DB_PASSWORD=***

# Blockchain
NETWORK_NAME=base-sepolia
RPC_URL=***
CHAIN_ID=84532
DEPLOYER_PRIVATE_KEY=***

# Africa's Talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=***
USSD_SHORT_CODE=*384*73588#
CALLBACK_URL=https://your-domain.com/api/ussd/callback

# FX Configuration
FALLBACK_USD_NGN_RATE=1580
BINANCE_API_URL=https://api.binance.com
BASE_RPC_URL=https://base.llamarpc.com

# Security
JWT_SECRET=***
ENCRYPTION_KEY=***
PHONE_SALT=***
```

## 🚀 Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install

# Setup database
psql -U postgres < schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### 2. Development
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### 3. Testing
```bash
# Run integration tests
node tests/integration/test-all-conversions.js

# Test AT integration
./bin/test-at-integration.sh

# Monitor logs
tail -f logs/combined.log
```

### 4. Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Run migrations
psql -U postgres -d kudipay < migrations/latest.sql
```

## 📋 Code Standards

### File Naming
- **camelCase**: `fxService.js`, `ussdController.js`
- **PascalCase**: Model classes (`User.js`, `Transaction.js`)
- **kebab-case**: Scripts (`test-at-integration.sh`)

### Code Organization
- One class per file
- Max 300 lines per file (refactor if longer)
- Clear separation of concerns
- Dependency injection where possible

### Documentation
- JSDoc comments for all functions
- README in each major directory
- Inline comments for complex logic
- API documentation in `docs/api/`

### Error Handling
- Try-catch in async functions
- Custom error classes
- Structured logging
- No silent failures

### Testing
- 80%+ code coverage target
- Test pyramid: many unit, some integration, few e2e
- Mock external dependencies
- Clean test data after each run

## 🔄 CI/CD Pipeline

### GitHub Actions (`.github/workflows/`)
```yaml
# Automated on push:
- Lint code
- Run unit tests
- Run integration tests
- Security audit
- Deploy to staging (on main branch)
- Deploy to production (on tags)
```

## 📚 Documentation

### Main Docs
- `README.md`: Project overview
- `TESTING_WITH_AT_SIMULATOR.md`: AT testing guide
- `FX_QUICKSTART.md`: FX engine guide
- `AFRICAS_TALKING_SANDBOX_GUIDE.md`: AT setup

### Technical Docs (`docs/`)
- Architecture diagrams
- API specifications
- Database schema docs
- Deployment procedures
- Security guidelines

## 🛠️ Maintenance

### Regular Tasks
- Update dependencies: `npm audit fix`
- Rotate logs: `logrotate`
- Database backups: Daily automated
- Monitor FX rates: Alert if stale
- Check blockchain gas prices

### Performance Monitoring
- Response times < 2s
- Database query optimization
- API rate limit tracking
- Error rate < 0.1%

## 🎯 Best Practices

1. **Security First**: Encrypt sensitive data, validate all inputs
2. **Fail Fast**: Validate early, fail explicitly
3. **Log Everything**: Structured logging with context
4. **Cache Wisely**: Reduce external API calls
5. **Monitor Actively**: Alerts for critical failures
6. **Document Changes**: Update docs with code changes
7. **Test Thoroughly**: Write tests before pushing
8. **Review Code**: PR reviews required
9. **Version Control**: Semantic versioning
10. **Backup Often**: Database & config backups

## 📞 Support

For questions or issues:
- Check `docs/` directory
- Review test files for examples
- Check logs in `logs/` directory
- Run health checks: `./bin/test-at-integration.sh`

---

**Last Updated**: October 20, 2025
**Version**: 2.0.0
**Maintainer**: KudiPay Team
