const axios = require('axios');
const logger = require('../utils/logger');
const Transaction = require('../models/Transaction');
const { generateTxRef } = require('../utils/helpers');

class FlutterwaveService {
  constructor() {
    this.baseURL = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    
    // Mock Nigeria banks for demo
    this.nigerianBanks = [
      { code: '044', name: 'Access Bank', country: 'NG' },
      { code: '050', name: 'Ecobank', country: 'NG' },
      { code: '011', name: 'First Bank', country: 'NG' },
      { code: '070', name: 'Fidelity Bank', country: 'NG' },
      { code: '058', name: 'GTBank', country: 'NG' },
      { code: '076', name: 'Polaris Bank', country: 'NG' },
      { code: '032', name: 'Union Bank', country: 'NG' },
      { code: '033', name: 'UBA', country: 'NG' },
      { code: '057', name: 'Zenith Bank', country: 'NG' },
    ];

    // Mock Kenya banks for demo
    this.kenyaBanks = [
      { code: '63f47f9e5e0000f812345678', name: 'Kenya Commercial Bank', country: 'KE' },
      { code: '63f47f9e5e0000f812345679', name: 'Equity Bank', country: 'KE' },
      { code: '63f47f9e5e0000f812345680', name: 'Co-operative Bank', country: 'KE' },
      { code: '63f47f9e5e0000f812345681', name: 'Standard Chartered', country: 'KE' },
    ];

    // Mock mobile money providers
    this.mobileProviders = [
      { code: 'MTN', name: 'MTN Mobile Money', countries: ['NG', 'GH'] },
      { code: 'AIRTEL', name: 'Airtel Money', countries: ['NG', 'KE'] },
      { code: 'MPESA', name: 'M-Pesa', countries: ['KE'] },
      { code: 'GLO', name: 'Glo Mobile', countries: ['NG'] },
      { code: '9MOBILE', name: '9Mobile Money', countries: ['NG'] },
    ];
  }

  /**
   * Get axios instance with auth headers
   */
  getAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Initiate bank transfer for Nigeria
   */
  async initiateNigerianBankTransfer(transferData) {
    try {
      const {
        amount,
        currency,
        accountNumber,
        bankCode,
        accountName,
        phoneNumber,
        narration
      } = transferData;

      // Mock validation
      const bank = this.nigerianBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Bank not supported');
      }

      const txRef = generateTxRef();
      
      // For demo: mock Flutterwave transfer
      const transferPayload = {
        account_bank: bankCode,
        account_number: accountNumber,
        amount: amount,
        currency: currency || 'NGN',
        narration: narration || 'KudiPay withdrawal',
        reference: txRef,
        beneficiary_name: accountName,
        debit_currency: 'NGN',
        meta: {
          phoneNumber,
          timestamp: new Date().toISOString()
        }
      };

      logger.info(`[DEMO] Nigerian Bank Transfer: ${JSON.stringify(transferPayload)}`);

      // In production, make actual API call:
      // const response = await this.getAxiosInstance().post('/transfers', transferPayload);

      // Mock response for demo
      const transferId = `FW_NG_${Date.now()}`;
      
      return {
        success: true,
        transferId,
        txRef,
        status: 'pending',
        amount,
        currency: 'NGN',
        bankCode,
        accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
        accountName,
        estimatedTime: '2-24 hours',
        message: 'Transfer initiated successfully'
      };

    } catch (error) {
      logger.error('Nigerian bank transfer error:', error);
      throw error;
    }
  }

  /**
   * Initiate bank transfer for Kenya
   */
  async initiateKenyanBankTransfer(transferData) {
    try {
      const {
        amount,
        accountNumber,
        bankCode,
        accountName,
        phoneNumber,
        narration
      } = transferData;

      // Mock validation
      const bank = this.kenyaBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Bank not supported');
      }

      const txRef = generateTxRef();

      const transferPayload = {
        account_bank: bankCode,
        account_number: accountNumber,
        amount: amount,
        currency: 'KES',
        narration: narration || 'KudiPay withdrawal',
        reference: txRef,
        beneficiary_name: accountName,
        meta: {
          phoneNumber,
          timestamp: new Date().toISOString()
        }
      };

      logger.info(`[DEMO] Kenyan Bank Transfer: ${JSON.stringify(transferPayload)}`);

      // In production: await this.getAxiosInstance().post('/transfers', transferPayload);
      
      const transferId = `FW_KE_${Date.now()}`;

      return {
        success: true,
        transferId,
        txRef,
        status: 'pending',
        amount,
        currency: 'KES',
        bankCode,
        accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
        accountName,
        estimatedTime: '1-4 hours',
        message: 'Transfer initiated successfully'
      };

    } catch (error) {
      logger.error('Kenyan bank transfer error:', error);
      throw error;
    }
  }

  /**
   * Initiate mobile money transfer
   */
  async initiateMobileMoneyTransfer(transferData) {
    try {
      const {
        amount,
        currency,
        phoneNumber,
        provider,
        country,
        narration
      } = transferData;

      // Validate provider
      const providerInfo = this.mobileProviders.find(p => p.code === provider);
      if (!providerInfo) {
        throw new Error('Mobile money provider not supported');
      }

      const txRef = generateTxRef();

      const mobilePayload = {
        amount: amount,
        currency: currency || (country === 'KE' ? 'KES' : 'NGN'),
        phone_number: phoneNumber,
        provider: provider,
        narration: narration || 'KudiPay withdrawal',
        reference: txRef,
        country: country
      };

      logger.info(`[DEMO] Mobile Money Transfer: ${JSON.stringify(mobilePayload)}`);

      // In production: await this.getAxiosInstance().post('/mobile-money/transfers', mobilePayload);
      
      const transferId = `FW_MM_${Date.now()}`;

      return {
        success: true,
        transferId,
        txRef,
        status: 'pending',
        amount,
        currency: currency || (country === 'KE' ? 'KES' : 'NGN'),
        provider: providerInfo.name,
        phoneNumber: phoneNumber.slice(-4).padStart(phoneNumber.length, '*'),
        estimatedTime: '5-30 minutes',
        message: 'Mobile money transfer initiated successfully'
      };

    } catch (error) {
      logger.error('Mobile money transfer error:', error);
      throw error;
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId) {
    try {
      logger.info(`[DEMO] Checking transfer status: ${transferId}`);

      // In production:
      // const response = await this.getAxiosInstance().get(`/transfers/${transferId}`);

      // Mock response for demo
      const statuses = ['pending', 'successful', 'failed'];
      const mockStatus = statuses[Math.floor(Math.random() * statuses.length)];

      return {
        transferId,
        status: mockStatus,
        timestamp: new Date().toISOString(),
        message: `Transfer status: ${mockStatus}`
      };

    } catch (error) {
      logger.error('Get transfer status error:', error);
      throw error;
    }
  }

  /**
   * Verify account number
   */
  async verifyAccountNumber(accountNumber, bankCode, country = 'NG') {
    try {
      logger.info(`[DEMO] Verifying account: ${accountNumber} at bank ${bankCode}`);

      // In production:
      // const response = await this.getAxiosInstance().post('/accounts/resolve', {
      //   account_number: accountNumber,
      //   account_bank: bankCode
      // });

      // Mock verification for demo
      return {
        success: true,
        accountNumber,
        bankCode,
        accountName: `Demo User ${Math.floor(Math.random() * 1000)}`,
        verified: true
      };

    } catch (error) {
      logger.error('Account verification error:', error);
      return {
        success: false,
        verified: false,
        message: 'Account verification failed'
      };
    }
  }

  /**
   * Get Nigerian banks
   */
  getNigerianBanks() {
    logger.info('[DEBUG] getNigerianBanks called, returning:', this.nigerianBanks);
    return this.nigerianBanks;
  }

  /**
   * Get Kenyan banks
   */
  getKenyanBanks() {
    logger.info('[DEBUG] getKenyanBanks called, returning:', this.kenyaBanks);
    return this.kenyaBanks;
  }

  /**
   * Get mobile money providers
   */
  getMobileMoneyProviders(country = 'NG') {
    const filtered = this.mobileProviders.filter(p => p.countries.includes(country));
    logger.info(`[DEBUG] getMobileMoneyProviders called with country=${country}, returning:`, filtered);
    return filtered;
  }

  /**
   * Save transfer record to database
   */
  async saveTransferRecord(transferData) {
    try {
      const txRef = transferData.txRef || generateTxRef();
      
      const transaction = await Transaction.create({
        txRef,
        fromPhone: transferData.phoneNumber,
        fromWallet: transferData.walletAddress,
        amount: transferData.amount,
        currency: 'USDT',
        amountNgn: transferData.amountLocal,
        exchangeRate: transferData.exchangeRate,
        fee: transferData.fee || 0,
        type: 'withdrawal',
        status: 'processing',
        metadata: {
          gateway: 'flutterwave',
          transferId: transferData.transferId,
          transferMethod: transferData.method,
          country: transferData.country,
          provider: transferData.provider || null,
          bankCode: transferData.bankCode || null,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Transfer record saved: ${txRef}`);
      return transaction;

    } catch (error) {
      logger.error('Save transfer record error:', error);
      throw error;
    }
  }

  /**
   * Handle webhook callback from Flutterwave
   */
  async handleWebhookCallback(webhookData) {
    try {
      const { data } = webhookData;
      const { reference, status, tx_ref } = data;

      logger.info(`[WEBHOOK] Flutterwave callback received: ${reference} - ${status}`);

      // Update transaction status
      const transaction = await Transaction.findByRef(tx_ref);
      if (transaction) {
        await transaction.updateStatus(status, reference);
        logger.info(`Transaction updated: ${tx_ref} -> ${status}`);
      }

      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error) {
      logger.error('Webhook processing error:', error);
      throw error;
    }
  }
}

module.exports = new FlutterwaveService();
