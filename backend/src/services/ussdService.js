const User = require('../models/User');
const UssdSession = require('../models/UssdSession');
const walletService = require('./walletService');
const fxService = require('./fxService');
const paymentService = require('./paymentService');
const ussdBuilder = require('../utils/ussdBuilder');
const ussdConfig = require('../../config/ussd');
const logger = require('../utils/logger');
const { formatPhoneNumber, isValidPhoneNumber } = require('../utils/helpers');

class UssdService {
  /**
   * Process incoming USSD request
   */
  async processRequest({ sessionId, serviceCode, phoneNumber, text }) {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const userInput = text.trim();
      
      // Get or create session
      let session = await UssdSession.findActive(sessionId, formattedPhone);
      
      if (!session || session.isExpired()) {
        // New session - show main menu
        session = await UssdSession.createOrUpdate(sessionId, formattedPhone, 'main_menu');
        return this.getMainMenuResponse();
      }
      
      // Process based on current step and user input
      return await this.processUserInput(session, userInput);
      
    } catch (error) {
      logger.error('USSD process request error:', error);
      return 'END Service temporarily unavailable. Please try again later.';
    }
  }

  /**
   * Process user input based on current session step
   */
  async processUserInput(session, userInput) {
    const currentStep = session.currentStep;
    const phoneNumber = session.phoneNumber;
    
    switch (currentStep) {
      case 'main_menu':
        return await this.handleMainMenuInput(session, userInput);
        
      case 'registration_pin':
        return await this.handleRegistrationPin(session, userInput);
        
      case 'pin_confirmation':
        return await this.handlePinConfirmation(session, userInput);
        
      case 'withdraw_amount':
        return await this.handleWithdrawAmount(session, userInput);
        
      case 'withdraw_method':
        return await this.handleWithdrawMethod(session, userInput);
        
      case 'bank_account_number':
        return await this.handleBankAccountNumber(session, userInput);
        
      case 'bank_code':
        return await this.handleBankCode(session, userInput);
        
      case 'verify_pin':
        return await this.handlePinVerification(session, userInput);
        
      default:
        await session.end();
        return this.getMainMenuResponse();
    }
  }

  /**
   * Handle main menu selection
   */
  async handleMainMenuInput(session, input) {
    switch (input) {
      case '1': // Register Phone Number
        const existingUser = await User.findByPhone(session.phoneNumber);
        if (existingUser) {
          await session.end();
          return 'END Your phone number is already registered with KudiPay.';
        }
        await session.updateStep('registration_pin');
        return 'CON Enter a 4-digit PIN for your wallet:';
        
      case '2': // Check Balance
        return await this.handleCheckBalance(session);
        
      case '3': // Withdraw Money
        return await this.handleWithdrawStart(session);
        
      case '4': // Transaction History
        return await this.handleTransactionHistory(session);
        
      case '5': // Help & Support
        await session.end();
        return 'END For help, call +234-XXX-XXXX or email support@kudipay.com';
        
      case '0': // Exit
        await session.end();
        return 'END Thank you for using KudiPay!';
        
      default:
        return 'CON ' + ussdConfig.messages.invalidOption + '\n\n' + this.getMainMenu();
    }
  }

  /**
   * Handle registration PIN input
   */
  async handleRegistrationPin(session, input) {
    if (!/^\d{4}$/.test(input)) {
      return 'CON Invalid PIN. Please enter a 4-digit PIN:';
    }
    
    await session.updateStep('pin_confirmation', { pin: input });
    return 'CON Confirm your 4-digit PIN:';
  }

  /**
   * Handle PIN confirmation
   */
  async handlePinConfirmation(session, input) {
    const originalPin = session.getData('pin');
    
    if (input !== originalPin) {
      await session.updateStep('registration_pin');
      return 'CON PINs do not match. Please enter a 4-digit PIN:';
    }
    
    try {
      // Create wallet
      const walletData = await walletService.createWallet(session.phoneNumber, input);
      await session.end();
      
      return `END Registration successful! Your wallet address is: ${walletData.walletAddress.substring(0, 10)}...`;
    } catch (error) {
      logger.error('Registration error:', error);
      await session.end();
      return 'END Registration failed. Please try again later.';
    }
  }

  /**
   * Handle check balance
   */
  async handleCheckBalance(session) {
    try {
      const user = await User.findByPhone(session.phoneNumber);
      if (!user) {
        await session.end();
        return 'END You need to register first. Dial *123*1# to register.';
      }
      
      const balance = await walletService.getBalance(user.walletAddress);
      const ngnBalance = await fxService.convertToNGN(balance.usdt);
      
      await session.end();
      return `END Your current balance is: ₦${ngnBalance.toLocaleString()} (${balance.usdt} USDT)`;
    } catch (error) {
      logger.error('Check balance error:', error);
      await session.end();
      return 'END Unable to fetch balance. Please try again later.';
    }
  }

  /**
   * Handle withdraw start
   */
  async handleWithdrawStart(session) {
    const user = await User.findByPhone(session.phoneNumber);
    if (!user) {
      await session.end();
      return 'END You need to register first. Dial *123*1# to register.';
    }
    
    await session.updateStep('withdraw_amount');
    return 'CON Enter amount to withdraw (NGN):';
  }

  /**
   * Handle withdraw amount input
   */
  async handleWithdrawAmount(session, input) {
    const amount = ussdBuilder.parseAmount(input);
    
    if (!amount || amount < 100) {
      return 'CON Invalid amount. Minimum withdrawal is ₦100. Enter amount:';
    }
    
    // Check if user has sufficient balance
    try {
      const user = await User.findByPhone(session.phoneNumber);
      const balance = await walletService.getBalance(user.walletAddress);
      const ngnBalance = await fxService.convertToNGN(balance.usdt);
      
      if (amount > ngnBalance) {
        await session.end();
        return `END Insufficient balance. Your balance is ₦${ngnBalance.toLocaleString()}`;
      }
      
      await session.updateStep('withdraw_method', { amount });
      return 'CON ' + ussdBuilder.buildWithdrawMenu();
    } catch (error) {
      logger.error('Withdraw amount error:', error);
      await session.end();
      return 'END Unable to process withdrawal. Please try again later.';
    }
  }

  /**
   * Handle withdraw method selection
   */
  async handleWithdrawMethod(session, input) {
    const amount = session.getData('amount');
    
    switch (input) {
      case '1': // Bank Account
        await session.updateStep('bank_account_number', { method: 'bank' });
        return 'CON Enter your bank account number:';
        
      case '2': // Mobile Money
        await session.updateStep('verify_pin', { method: 'mobile_money' });
        return 'CON Enter your PIN to confirm withdrawal to your mobile money account:';
        
      case '3': // Cash Agent
        await session.updateStep('verify_pin', { method: 'cash_agent' });
        return 'CON Enter your PIN to confirm cash pickup:';
        
      case '0': // Back to Main Menu
        await session.updateStep('main_menu');
        return 'CON ' + this.getMainMenu();
        
      default:
        return 'CON Invalid option. ' + ussdBuilder.buildWithdrawMenu();
    }
  }

  /**
   * Handle transaction history
   */
  async handleTransactionHistory(session) {
    try {
      const user = await User.findByPhone(session.phoneNumber);
      if (!user) {
        await session.end();
        return 'END You need to register first. Dial *123*1# to register.';
      }
      
      const transactions = await Transaction.findByPhone(session.phoneNumber, 5);
      await session.end();
      
      return 'END ' + ussdBuilder.buildTransactionHistory(transactions);
    } catch (error) {
      logger.error('Transaction history error:', error);
      await session.end();
      return 'END Unable to fetch transaction history. Please try again later.';
    }
  }

  /**
   * Get main menu response
   */
  getMainMenuResponse() {
    return 'CON ' + this.getMainMenu();
  }

  /**
   * Get main menu string
   */
  getMainMenu() {
    return ussdBuilder.buildMainMenu();
  }
}

module.exports = new UssdService();
