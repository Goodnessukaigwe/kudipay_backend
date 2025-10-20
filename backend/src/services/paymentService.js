const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fxService = require('./fxService');
const flutterwaveService = require('./flutterwaveService');
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

  // Helper to detect demo mode
  isDemoMode() {
    return process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo' || process.env.NODE_ENV === 'development';
  }

  // Legacy methods for backward compatibility
  async withdrawToBank({ phoneNumber, amount, accountNumber, bankCode, pin }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      let user;
      if (this.isDemoMode()) {
        user = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          verifyPin: (inputPin) => inputPin === '1234',
        };
      } else {
        user = await User.findByPhone(formattedPhone);
      }
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      const bank = this.supportedBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Unsupported bank code');
      }
      const accountVerification = await this.verifyBankAccount(accountNumber, bankCode);
      const requiredUSDT = await fxService.convertToUSDT(amount);
      const txRef = generateTxRef();
      let transaction;
      if (this.isDemoMode()) {
        transaction = {
          txRef,
          fromPhone: formattedPhone,
          fromWallet: user.walletAddress,
          amount: requiredUSDT,
          currency: 'USDT',
          amountNgn: amount,
          exchangeRate: 1500,
          type: 'withdrawal',
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            withdrawalMethod: 'bank',
            accountNumber,
            bankCode,
            bankName: bank.name,
            accountName: accountVerification.accountName
          },
          updateStatus: async function(status) { this.status = status; this.updatedAt = new Date().toISOString(); }
        };
      } else {
        transaction = await Transaction.create({
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
      }
      await this.processBankWithdrawal(transaction, accountNumber, bankCode, amount);
      logger.info(`Bank withdrawal initiated: ${txRef} - ₦${amount} to ${bank.name}`);
      return {
        txRef,
        amount,
        bankName: bank.name,
        accountNumber: accountNumber.replace(/\d(?=\d{4})/g, '*'),
        status: 'processing',
        estimatedTime: '2-24 hours'
      };
    } catch (error) {
      logger.error('Withdraw to bank error:', error);
      throw error;
    }
  }

  async withdrawToMobileMoney({ phoneNumber, amount, mobileMoneyNumber, provider, pin }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      let user;
      if (this.isDemoMode()) {
        user = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          verifyPin: (inputPin) => inputPin === '1234',
        };
      } else {
        user = await User.findByPhone(formattedPhone);
      }
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      const providerInfo = this.mobileMoneyProviders.find(p => p.code === provider);
      if (!providerInfo) {
        throw new Error('Unsupported mobile money provider');
      }
      const requiredUSDT = await fxService.convertToUSDT(amount);
      const txRef = generateTxRef();
      let transaction;
      if (this.isDemoMode()) {
        transaction = {
          txRef,
          fromPhone: formattedPhone,
          fromWallet: user.walletAddress,
          amount: requiredUSDT,
          currency: 'USDT',
          amountNgn: amount,
          exchangeRate: 1500,
          type: 'withdrawal',
          status: 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            withdrawalMethod: 'mobile_money',
            mobileMoneyNumber,
            provider,
            providerName: providerInfo.name
          },
          updateStatus: async function(status) { this.status = status; this.updatedAt = new Date().toISOString(); }
        };
      } else {
        transaction = await Transaction.create({
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
      }
      await this.processMobileMoneyWithdrawal(transaction, mobileMoneyNumber, provider, amount);
      logger.info(`Mobile money withdrawal initiated: ${txRef} - ₦${amount} via ${providerInfo.name}`);
      return {
        txRef,
        amount,
        provider: providerInfo.name,
        mobileMoneyNumber: mobileMoneyNumber.replace(/\d(?=\d{4})/g, '*'),
        status: 'processing',
        estimatedTime: '5-30 minutes'
      };
    } catch (error) {
      logger.error('Withdraw to mobile money error:', error);
      throw error;
    }
  }

  // Flutterwave integration methods
  // All Flutterwave logic is delegated to flutterwaveService. No Flutterwave-specific data or logic should be here.
  async withdrawToNigerianBank({ phoneNumber, amount, accountNumber, bankCode, pin, accountName }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      let user;
      if (this.isDemoMode()) {
        user = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          verifyPin: (inputPin) => inputPin === '1234',
        };
      } else {
        user = await User.findByPhone(formattedPhone);
      }
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      const banks = flutterwaveService.getNigerianBanks();
      const bank = banks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Bank not supported in Nigeria');
      }
      const verification = await flutterwaveService.verifyAccountNumber(accountNumber, bankCode, 'NG');
      if (!verification.verified) {
        throw new Error('Account verification failed');
      }
      const requiredUSDT = await fxService.convertToUSDT(amount);
      const exchangeRate = await fxService.getUSDTToNGNRate();
      const transfer = await flutterwaveService.initiateNigerianBankTransfer({
        amount,
        currency: 'NGN',
        accountNumber,
        bankCode,
        accountName: verification.accountName || accountName,
        phoneNumber: formattedPhone,
        narration: `KudiPay withdrawal - ${formattedPhone}`
      });
      let txRecord;
      if (this.isDemoMode()) {
        txRecord = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          amount: requiredUSDT,
          amountLocal: amount,
          exchangeRate,
          method: 'bank',
          country: 'NG',
          bankCode,
          transferId: transfer.transferId,
          txRef: transfer.txRef,
          updateStatus: async function(status) { this.status = status; this.updatedAt = new Date().toISOString(); }
        };
      } else {
        txRecord = await flutterwaveService.saveTransferRecord({
          phoneNumber: formattedPhone,
          walletAddress: user.walletAddress,
          amount: requiredUSDT,
          amountLocal: amount,
          exchangeRate,
          method: 'bank',
          country: 'NG',
          bankCode,
          transferId: transfer.transferId,
          txRef: transfer.txRef
        });
      }
      logger.info(`Nigerian bank withdrawal initiated: ${transfer.txRef} - ₦${amount}`);
      return {
        success: true,
        transferId: transfer.transferId,
        txRef: transfer.txRef,
        amount,
        currency: 'NGN',
        bank: bank.name,
        accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
        status: 'pending',
        estimatedTime: transfer.estimatedTime,
        message: transfer.message
      };
    } catch (error) {
      logger.error('Nigerian bank withdrawal error:', error);
      throw error;
    }
  }

  async withdrawToKenyanBank({ phoneNumber, amount, accountNumber, bankCode, pin, accountName }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber, '+254');
      let user;
      if (this.isDemoMode()) {
        user = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          verifyPin: (inputPin) => inputPin === '1234',
        };
      } else {
        user = await User.findByPhone(formattedPhone);
      }
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      const banks = flutterwaveService.getKenyanBanks();
      const bank = banks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Bank not supported in Kenya');
      }
      const verification = await flutterwaveService.verifyAccountNumber(accountNumber, bankCode, 'KE');
      if (!verification.verified) {
        throw new Error('Account verification failed');
      }
      const kesRate = 140;
      const amountKES = amount * kesRate;
      const requiredUSDT = amount / 1500;
      const transfer = await flutterwaveService.initiateKenyanBankTransfer({
        amount: amountKES,
        accountNumber,
        bankCode,
        accountName: verification.accountName || accountName,
        phoneNumber: formattedPhone,
        narration: `KudiPay withdrawal - ${formattedPhone}`
      });
      let txRecord;
      if (this.isDemoMode()) {
        txRecord = {
          phoneNumber: formattedPhone,
          walletAddress: user.walletAddress,
          amount: requiredUSDT,
          amountLocal: amountKES,
          exchangeRate: kesRate,
          method: 'bank',
          country: 'KE',
          bankCode,
          transferId: transfer.transferId,
          txRef: transfer.txRef,
          updateStatus: async function(status) { this.status = status; this.updatedAt = new Date().toISOString(); }
        };
      } else {
        txRecord = await flutterwaveService.saveTransferRecord({
          phoneNumber: formattedPhone,
          walletAddress: user.walletAddress,
          amount: requiredUSDT,
          amountLocal: amountKES,
          exchangeRate: kesRate,
          method: 'bank',
          country: 'KE',
          bankCode,
          transferId: transfer.transferId,
          txRef: transfer.txRef
        });
      }
      logger.info(`Kenyan bank withdrawal initiated: ${transfer.txRef} - KES${amountKES}`);
      return {
        success: true,
        transferId: transfer.transferId,
        txRef: transfer.txRef,
        amount: amountKES,
        currency: 'KES',
        bank: bank.name,
        accountNumber: accountNumber.slice(-4).padStart(accountNumber.length, '*'),
        status: 'pending',
        estimatedTime: transfer.estimatedTime,
        message: transfer.message
      };
    } catch (error) {
      logger.error('Kenyan bank withdrawal error:', error);
      throw error;
    }
  }

  async withdrawToMobileMoneyFlutterwave({ phoneNumber, amount, recipientPhone, provider, pin, country = 'NG' }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      let user;
      if (this.isDemoMode()) {
        user = {
          phoneNumber: formattedPhone,
          walletAddress: 'demo_wallet',
          verifyPin: (inputPin) => inputPin === '1234',
        };
      } else {
        user = await User.findByPhone(formattedPhone);
      }
      if (!user) {
        throw new Error('User not found');
      }
      if (!user.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      const providers = flutterwaveService.getMobileMoneyProviders(country);
      const providerInfo = providers.find(p => p.code === provider);
      if (!providerInfo) {
        throw new Error(`Provider ${provider} not supported in ${country}`);
      }
      const currency = country === 'KE' ? 'KES' : 'NGN';
      const transfer = await flutterwaveService.initiateMobileMoneyTransfer({
        amount,
        currency,
        phoneNumber: recipientPhone,
        provider,
        country,
        narration: `KudiPay withdrawal - ${formattedPhone}`
      });
      const requiredUSDT = country === 'KE' 
        ? amount / 140
        : await fxService.convertToUSDT(amount);
      let txRecord;
      if (this.isDemoMode()) {
        txRecord = {
          phoneNumber: formattedPhone,
          walletAddress: user.walletAddress,
          amount: requiredUSDT,
          amountLocal: amount,
          exchangeRate: country === 'KE' ? 140 : 1500,
          method: 'mobile_money',
          country,
          provider,
          transferId: transfer.transferId,
          txRef: transfer.txRef,
          updateStatus: async function(status) { this.status = status; this.updatedAt = new Date().toISOString(); }
        };
      } else {
        txRecord = await flutterwaveService.saveTransferRecord({
          phoneNumber: formattedPhone,
          walletAddress: user.walletAddress,
          amount: requiredUSDT,
          amountLocal: amount,
          exchangeRate: country === 'KE' ? 140 : await fxService.getUSDTToNGNRate(),
          method: 'mobile_money',
          country,
          provider,
          transferId: transfer.transferId,
          txRef: transfer.txRef
        });
      }
      logger.info(`Mobile money withdrawal initiated: ${transfer.txRef} - ${currency}${amount} via ${providerInfo.name}`);
      return {
        success: true,
        transferId: transfer.transferId,
        txRef: transfer.txRef,
        amount,
        currency,
        provider: providerInfo.name,
        recipientPhone: recipientPhone.slice(-4).padStart(recipientPhone.length, '*'),
        status: 'pending',
        estimatedTime: transfer.estimatedTime,
        message: transfer.message
      };
    } catch (error) {
      logger.error('Mobile money withdrawal error:', error);
      throw error;
    }
  }

  async getFlutterwaveTransferStatus(transferId) {
    try {
      const status = await flutterwaveService.getTransferStatus(transferId);
      return status;
    } catch (error) {
      logger.error('Get transfer status error:', error);
      throw error;
    }
  }

  async getNigerianBanksFlutterwave() {
    logger.info('[DEBUG] paymentService.getNigerianBanksFlutterwave called');
    return flutterwaveService.getNigerianBanks();
  }

  async getKenyanBanksFlutterwave() {
    logger.info('[DEBUG] paymentService.getKenyanBanksFlutterwave called');
    return flutterwaveService.getKenyanBanks();
  }

  async getMobileMoneyProvidersFlutterwave(country = 'NG') {
    logger.info(`[DEBUG] paymentService.getMobileMoneyProvidersFlutterwave called with country=${country}`);
    return flutterwaveService.getMobileMoneyProviders(country);
  }

  async verifyAccountFlutterwave(accountNumber, bankCode, country = 'NG') {
    try {
      return await flutterwaveService.verifyAccountNumber(accountNumber, bankCode, country);
    } catch (error) {
      logger.error('Account verification error:', error);
      throw error;
    }
  }

  // Utility methods
  async getSupportedBanks() {
    return this.supportedBanks;
  }

  async getMobileMoneyProviders() {
    return this.mobileMoneyProviders;
  }

  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const bank = this.supportedBanks.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Invalid bank code');
      }

      if (!/^\d{10}$/.test(accountNumber)) {
        throw new Error('Invalid account number format');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        accountNumber,
        accountName: 'John Doe',
        bankName: bank.name,
        bankCode,
        isValid: true
      };
    } catch (error) {
      logger.error('Verify bank account error:', error);
      throw error;
    }
  }

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

  async processBankWithdrawal(transaction, accountNumber, bankCode, amount) {
    try {
      setTimeout(async () => {
        try {
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
      }, 5000);
      
    } catch (error) {
      logger.error('Process bank withdrawal error:', error);
      throw error;
    }
  }

  async processMobileMoneyWithdrawal(transaction, mobileMoneyNumber, provider, amount) {
    try {
      setTimeout(async () => {
        try {
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
      }, 2000);
      
    } catch (error) {
      logger.error('Process mobile money withdrawal error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
