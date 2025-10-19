const User = require('../models/User');
const UssdSession = require('../models/UssdSession');
const walletService = require('./walletService');
const fxService = require('./fxService');
const paymentService = require('./paymentService');
const ussdBuilder = require('../utils/ussdBuilder');
const ussdConfig = require('../../config/ussd');
const logger = require('../utils/logger');
const { formatPhoneNumber, normalizePhoneNumber, isValidPhoneNumber } = require('../utils/helpers');

class UssdService {
  /**
   * Process incoming USSD request
   * Automatically converts local phone format to international
   */
  async processRequest({ sessionId, serviceCode, phoneNumber, text }) {
    try {
      // Normalize phone number to international format (+234...)
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const userInput = text.trim();
      
      // Get or create session using normalized phone
      let session = await UssdSession.findActive(sessionId, normalizedPhone);
      
      if (!session || session.isExpired()) {
        // New session - show main menu
        session = await UssdSession.createOrUpdate(sessionId, normalizedPhone, 'main_menu');
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
   * Handle bank account number input
   */
  async handleBankAccountNumber(session, input) {
    // Validate Nigerian bank account format (10 digits)
    const accountNumber = input.replace(/\s+/g, '');
    
    if (!/^\d{10}$/.test(accountNumber)) {
      return 'CON Invalid account number. Enter 10 digits:';
    }
    
    await session.updateStep('bank_code', { accountNumber });
    return 'CON ' + ussdBuilder.buildBankMenu();
  }

  /**
   * Handle bank code selection
   */
  async handleBankCode(session, input) {
    const bankCodes = {
      '1': { code: '044', name: 'Access Bank' },
      '2': { code: '058', name: 'GTBank' },
      '3': { code: '011', name: 'First Bank' },
      '4': { code: '057', name: 'Zenith Bank' },
      '5': { code: '033', name: 'UBA' },
      '6': { code: '032', name: 'Union Bank' },
      '7': { code: '076', name: 'Polaris Bank' },
      '8': { code: '035', name: 'Wema Bank' },
      '9': { code: '050', name: 'Ecobank' },
      '10': { code: '070', name: 'Fidelity Bank' }
    };
    
    const bank = bankCodes[input];
    
    if (!bank) {
      return 'CON Invalid option. ' + ussdBuilder.buildBankMenu();
    }
    
    const amount = session.getData('amount');
    const accountNumber = session.getData('accountNumber');
    
    await session.updateStep('verify_pin', { 
      bankCode: bank.code,
      bankName: bank.name
    });
    
    return `CON Withdraw ₦${amount.toLocaleString()} to ${bank.name}?\nAccount: ${accountNumber}\n\nEnter your 4-digit PIN to confirm:`;
  }

  /**
   * Handle PIN verification for withdrawal
   */
  async handlePinVerification(session, input) {
    try {
      // Validate PIN format (4 digits)
      if (!/^\d{4}$/.test(input)) {
        return 'CON Invalid PIN format. Enter your 4-digit PIN:';
      }

      const user = await User.findByPhone(session.phoneNumber);
      
      if (!user) {
        await session.end();
        return 'END Account not found. Please register first.';
      }

      // Verify PIN with attempt limiting
      const verificationResult = await user.verifyPinWithLimiting(input);

      if (!verificationResult.success) {
        await session.end();
        return `END ${verificationResult.message}`;
      }

      // PIN verified successfully - process withdrawal
      const amount = session.getData('amount');
      const method = session.getData('method');

      let result;

      if (method === 'bank') {
        const accountNumber = session.getData('accountNumber');
        const bankCode = session.getData('bankCode');
        const bankName = session.getData('bankName');

        result = await paymentService.withdrawToBank(
          session.phoneNumber,
          amount,
          bankCode,
          accountNumber
        );

        await session.end();
        return `END Withdrawal of ₦${amount.toLocaleString()} to ${bankName} (${accountNumber}) initiated successfully.\n\nRef: ${result.reference}`;

      } else if (method === 'mobile_money') {
        result = await paymentService.withdrawToMobileMoney(
          session.phoneNumber,
          amount,
          'MTN' // Default provider for now
        );

        await session.end();
        return `END Withdrawal of ₦${amount.toLocaleString()} to your mobile money account initiated.\n\nRef: ${result.reference}`;

      } else if (method === 'cash_agent') {
        result = await paymentService.initiateCashPickup(
          session.phoneNumber,
          amount
        );

        await session.end();
        return `END Cash pickup code: ${result.pickupCode}\n\nShow this code to any KudiPay agent to collect ₦${amount.toLocaleString()}`;
      }

      await session.end();
      return 'END Withdrawal processed successfully!';

    } catch (error) {
      logger.error('PIN verification error:', error);
      await session.end();
      return 'END Unable to process withdrawal. Please try again later.';
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
