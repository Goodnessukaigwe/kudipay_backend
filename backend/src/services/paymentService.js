const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fxService = require('./fxService');
const logger = require('../utils/logger');
const { generateTxRef, formatPhoneNumber } = require('../utils/helpers');

class PaymentService {
  constructor() {
    // Mock bank and mobile money data for MVP
    this.supportedBanks = [
      { code: '044', name: 'Access Bank' },
      { code: '014', name: 'Afribank' },
      { code: '023', name: 'Citibank' },
      { code: '050', name: 'Ecobank' },
      { code: '011', name: 'First Bank' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '058', name: 'GTBank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '301', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '076', name: 'Polaris Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered' },
      { code: '232', name: 'Sterling Bank' },
      { code: '032', name: 'Union Bank' },
      { code: '033', name: 'United Bank for Africa' },
      { code: '215', name: 'Unity Bank' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' }
    ];

    this.mobileMoneyProviders = [
      { code: 'mtn', name: 'MTN Mobile Money', countries: ['Nigeria', 'Ghana'] },
      { code: 'airtel', name: 'Airtel Money', countries: ['Nigeria', 'Kenya'] },
      { code: 'glo', name: 'Glo Mobile Money', countries: ['Nigeria'] },
      { code: '9mobile', name: '9mobile Money', countries: ['Nigeria'] },
      { code: 'mpesa', name: 'M-Pesa', countries: ['Kenya'] },
      { code: 'tigo', name: 'Tigo Pesa', countries: ['Ghana'] }
    ];
  }

  /**
   * Withdraw to bank account
   */
  async withdrawToBank({ phoneNumber, amount, accountNumber, bankCode, pin }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Find user
      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify PIN
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }

      // Verify bank code
      const bank = this.supportedBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Unsupported bank code');
      }

      // Verify account (mock verification)
      const accountVerification = await this.verifyBankAccount(accountNumber, bankCode);
      
      // Check balance (convert NGN to USDT for balance check)
      const requiredUSDT = await fxService.convertToUSDT(amount);
      // This would check actual blockchain balance in production
      
      // Create withdrawal transaction
      const txRef = generateTxRef();
      const transaction = await Transaction.create({
        txRef,
        fromPhone: formattedPhone,
        fromWallet: user.walletAddress,
        amount: requiredUSDT,
        currency: 'USDT',
        amountNgn: amount,
        exchangeRate: await fxService.getUSDTToNGNRate(),
        type: 'withdrawal',
        status: 'processing',
        metadata: {
          withdrawalMethod: 'bank',
          accountNumber,
          bankCode,
          bankName: bank.name,
          accountName: accountVerification.accountName
        }
      });

      // Process withdrawal (mock for MVP)
      await this.processBankWithdrawal(transaction, accountNumber, bankCode, amount);
      
      logger.info(`Bank withdrawal initiated: ${txRef} - ₦${amount} to ${bank.name}`);
      
      return {
        txRef,
        amount,
        bankName: bank.name,
        accountNumber: accountNumber.replace(/\d(?=\d{4})/g, '*'), // Mask account number
        status: 'processing',
        estimatedTime: '2-24 hours'
      };
      
    } catch (error) {
      logger.error('Withdraw to bank error:', error);
      throw error;
    }
  }

  /**
   * Withdraw to mobile money
   */
  async withdrawToMobileMoney({ phoneNumber, amount, mobileMoneyNumber, provider, pin }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Find user
      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify PIN
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }

      // Verify provider
      const providerInfo = this.mobileMoneyProviders.find(p => p.code === provider);
      if (!providerInfo) {
        throw new Error('Unsupported mobile money provider');
      }

      // Check balance
      const requiredUSDT = await fxService.convertToUSDT(amount);
      
      // Create withdrawal transaction
      const txRef = generateTxRef();
      const transaction = await Transaction.create({
        txRef,
        fromPhone: formattedPhone,
        fromWallet: user.walletAddress,
        amount: requiredUSDT,
        currency: 'USDT',
        amountNgn: amount,
        exchangeRate: await fxService.getUSDTToNGNRate(),
        type: 'withdrawal',
        status: 'processing',
        metadata: {
          withdrawalMethod: 'mobile_money',
          mobileMoneyNumber,
          provider,
          providerName: providerInfo.name
        }
      });

      // Process mobile money withdrawal (mock)
      await this.processMobileMoneyWithdrawal(transaction, mobileMoneyNumber, provider, amount);
      
      logger.info(`Mobile money withdrawal initiated: ${txRef} - ₦${amount} via ${providerInfo.name}`);
      
      return {
        txRef,
        amount,
        provider: providerInfo.name,
        mobileMoneyNumber: mobileMoneyNumber.replace(/\d(?=\d{4})/g, '*'), // Mask number
        status: 'processing',
        estimatedTime: '5-30 minutes'
      };
      
    } catch (error) {
      logger.error('Withdraw to mobile money error:', error);
      throw error;
    }
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks() {
    return this.supportedBanks;
  }

  /**
   * Get mobile money providers
   */
  async getMobileMoneyProviders() {
    return this.mobileMoneyProviders;
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      // Mock bank account verification
      // In production, integrate with Flutterwave/Paystack account verification API
      
      const bank = this.supportedBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Invalid bank code');
      }

      if (!/^\d{10}$/.test(accountNumber)) {
        throw new Error('Invalid account number format');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      return {
        accountNumber,
        accountName: 'John Doe', // Mock name
        bankName: bank.name,
        bankCode,
        isValid: true
      };
    } catch (error) {
      logger.error('Verify bank account error:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(txRef) {
    try {
      const transaction = await Transaction.findByRef(txRef);
      
      if (!transaction || transaction.type !== 'withdrawal') {
        return null;
      }

      return {
        txRef,
        amount: transaction.amountNgn,
        status: transaction.status,
        method: transaction.metadata?.withdrawalMethod,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };
    } catch (error) {
      logger.error('Get withdrawal status error:', error);
      throw error;
    }
  }

  /**
   * Process bank withdrawal (mock implementation)
   */
  async processBankWithdrawal(transaction, accountNumber, bankCode, amount) {
    try {
      // Mock processing delay
      setTimeout(async () => {
        try {
          // In production, integrate with payment provider API
          // For now, simulate successful withdrawal
          await transaction.updateStatus('completed', null, {
            processedAt: new Date().toISOString(),
            providerReference: 'BANK_' + Date.now()
          });
          
          logger.info(`Bank withdrawal completed: ${transaction.txRef}`);
        } catch (error) {
          await transaction.updateStatus('failed', null, {
            errorMessage: error.message,
            failedAt: new Date().toISOString()
          });
          logger.error(`Bank withdrawal failed: ${transaction.txRef}`, error);
        }
      }, 5000); // 5 second delay for demo
      
    } catch (error) {
      logger.error('Process bank withdrawal error:', error);
      throw error;
    }
  }

  /**
   * Process mobile money withdrawal (mock implementation)
   */
  async processMobileMoneyWithdrawal(transaction, mobileMoneyNumber, provider, amount) {
    try {
      // Mock processing delay
      setTimeout(async () => {
        try {
          // In production, integrate with mobile money API
          await transaction.updateStatus('completed', null, {
            processedAt: new Date().toISOString(),
            providerReference: 'MM_' + Date.now()
          });
          
          logger.info(`Mobile money withdrawal completed: ${transaction.txRef}`);
        } catch (error) {
          await transaction.updateStatus('failed', null, {
            errorMessage: error.message,
            failedAt: new Date().toISOString()
          });
          logger.error(`Mobile money withdrawal failed: ${transaction.txRef}`, error);
        }
      }, 2000); // 2 second delay for demo
      
    } catch (error) {
      logger.error('Process mobile money withdrawal error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
