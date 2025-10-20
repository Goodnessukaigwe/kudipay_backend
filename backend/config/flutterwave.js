// Flutterwave configuration
const flutterwaveConfig = {
  // API Configuration
  apiUrl: process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3',
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
  webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || '',

  // Supported countries
  countries: {
    NG: {
      name: 'Nigeria',
      code: 'NG',
      currency: 'NGN',
      minWithdrawal: 100,
      maxWithdrawal: 500000,
      bankTransferEstimate: '2-24 hours',
      mobileMoneyEstimate: '5-30 minutes'
    },
    KE: {
      name: 'Kenya',
      code: 'KE',
      currency: 'KES',
      minWithdrawal: 100,
      maxWithdrawal: 500000,
      bankTransferEstimate: '1-4 hours',
      mobileMoneyEstimate: '5-30 minutes'
    }
  },

  // Withdrawal methods
  withdrawalMethods: {
    BANK_TRANSFER: 'bank',
    MOBILE_MONEY: 'mobile_money',
    CASH_PICKUP: 'cash_pickup',
    WALLET: 'wallet'
  },

  // Transfer status
  transferStatus: {
    PENDING: 'pending',
    SUCCESSFUL: 'successful',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Nigerian banks mock data
  nigeriaBanks: [
    { code: '044', name: 'Access Bank', country: 'NG' },
    { code: '050', name: 'Ecobank', country: 'NG' },
    { code: '011', name: 'First Bank', country: 'NG' },
    { code: '070', name: 'Fidelity Bank', country: 'NG' },
    { code: '058', name: 'GTBank', country: 'NG' },
    { code: '076', name: 'Polaris Bank', country: 'NG' },
    { code: '032', name: 'Union Bank', country: 'NG' },
    { code: '033', name: 'UBA', country: 'NG' },
    { code: '057', name: 'Zenith Bank', country: 'NG' }
  ],

  // Kenyan banks mock data
  kenyaBanks: [
    { code: '63f47f9e5e0000f812345678', name: 'Kenya Commercial Bank', country: 'KE' },
    { code: '63f47f9e5e0000f812345679', name: 'Equity Bank', country: 'KE' },
    { code: '63f47f9e5e0000f812345680', name: 'Co-operative Bank', country: 'KE' },
    { code: '63f47f9e5e0000f812345681', name: 'Standard Chartered', country: 'KE' }
  ],

  // Mobile money providers
  mobileMoneyProviders: [
    { code: 'MTN', name: 'MTN Mobile Money', countries: ['NG', 'GH'], minAmount: 50, maxAmount: 100000 },
    { code: 'AIRTEL', name: 'Airtel Money', countries: ['NG', 'KE'], minAmount: 50, maxAmount: 100000 },
    { code: 'MPESA', name: 'M-Pesa', countries: ['KE'], minAmount: 100, maxAmount: 150000 },
    { code: 'GLO', name: 'Glo Mobile', countries: ['NG'], minAmount: 50, maxAmount: 100000 },
    { code: '9MOBILE', name: '9Mobile Money', countries: ['NG'], minAmount: 50, maxAmount: 100000 }
  ],

  // Fees (in percentages)
  fees: {
    bank_transfer: 0.5,  // 0.5% for bank transfers
    mobile_money: 1.0,   // 1% for mobile money
    cash_pickup: 1.5     // 1.5% for cash pickup
  },

  // API Endpoints
  endpoints: {
    transfer: '/transfers',
    resolveAccount: '/accounts/resolve',
    transferStatus: '/transfers/:id',
    webhookVerify: '/webhooks/verify',
    bankList: '/banks/:country',
    mobileMoneyList: '/mobile-money/providers'
  },

  // Error messages
  messages: {
    success: 'Operation completed successfully',
    invalidAmount: 'Invalid amount',
    insufficientFunds: 'Insufficient balance',
    invalidAccount: 'Invalid account details',
    networkError: 'Network error. Please try again',
    invalidPhone: 'Invalid phone number',
    invalidProvider: 'Invalid payment provider'
  }
};

module.exports = flutterwaveConfig;
