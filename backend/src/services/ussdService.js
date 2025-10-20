const User = require('../models/User');
const UssdSession = require('../models/UssdSession');
const walletService = require('./walletService');
const fxService = require('./fxService');
const paymentService = require('./paymentService');
const flutterwaveService = require('./flutterwaveService');
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

      case 'flutterwave_method':
        return await this.handleFlutterwaveMethod(session, userInput);

      case 'flutterwave_bank_selection':
        return await this.handleBankSelection(session, userInput);

      case 'flutterwave_account_number':
        return await this.handleFlutterwaveAccountNumber(session, userInput);

      case 'flutterwave_mobile_selection':
        return await this.handleMobileMoneySelection(session, userInput);

      case 'flutterwave_mobile_number':
        return await this.handleMobileMoneyNumber(session, userInput);

      case 'flutterwave_verify_pin':
        return await this.handleFlutterwavePinVerification(session, userInput);

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
        
      case '4': // Flutterwave
        await session.updateStep('flutterwave_method', { method: 'flutterwave', amount });
        return 'CON ' + ussdBuilder.buildCountrySelectionMenu();

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
   * Handle country selection for Flutterwave
   */
  async handleCountrySelection(session, input) {
    switch (input) {
      case '1': // Nigeria
        await session.updateStep('flutterwave_method', { country: 'NG' });
        return 'CON Select withdrawal method:\n1. Bank Account\n2. Mobile Money\n0. Back';
        
      case '2': // Kenya
        await session.updateStep('flutterwave_method', { country: 'KE' });
        return 'CON Select withdrawal method:\n1. Bank Account\n2. Mobile Money\n0. Back';
        
      case '0': // Back
        await session.updateStep('main_menu');
        return 'CON ' + this.getMainMenu();
        
      default:
        return 'CON Invalid option. ' + ussdBuilder.buildCountrySelectionMenu();
    }
  }

  /**
   * Handle Flutterwave withdrawal method selection
   */
  async handleFlutterwaveMethod(session, input) {
    const country = session.getData('country');
    
    switch (input) {
      case '1': // Bank Account
        await session.updateStep('flutterwave_bank_selection', { method: 'bank' });
        
        if (country === 'NG') {
          const banks = flutterwaveService.getNigerianBanks();
          return 'CON ' + ussdBuilder.buildNigerianBankSelectionMenu(banks);
        } else {
          const banks = flutterwaveService.getKenyanBanks();
          return 'CON ' + ussdBuilder.buildKenyanBankSelectionMenu(banks);
        }
        
      case '2': // Mobile Money
        await session.updateStep('flutterwave_mobile_selection', { method: 'mobile_money' });
        const providers = flutterwaveService.getMobileMoneyProviders(country);
        return 'CON ' + ussdBuilder.buildMobileMoneyProviderMenu(providers);
        
      case '0': // Back
        await session.updateStep('withdraw_amount');
        return 'CON ' + ussdBuilder.buildWithdrawMenu();
        
      default:
        return 'CON Invalid option. Select withdrawal method:\n1. Bank Account\n2. Mobile Money\n0. Back';
    }
  }

  /**
   * Handle bank selection
   */
  async handleBankSelection(session, input) {
    const country = session.getData('country');
    const method = session.getData('method');
    
    const banks = country === 'NG' 
      ? flutterwaveService.getNigerianBanks()
      : flutterwaveService.getKenyanBanks();
    
    const bankIndex = parseInt(input) - 1;
    
    if (bankIndex < 0 || bankIndex >= banks.length) {
      if (input === '0') {
        await session.updateStep('flutterwave_method');
        return 'CON Select withdrawal method:\n1. Bank Account\n2. Mobile Money\n0. Back';
      }
      return 'CON Invalid selection. Try again.';
    }
    
    const selectedBank = banks[bankIndex];
    await session.updateStep('flutterwave_account_number', { 
      bankCode: selectedBank.code,
      bankName: selectedBank.name
    });
    
    return 'CON ' + ussdBuilder.buildAccountNumberPrompt();
  }

  /**
   * Handle account number input for bank transfer
   */
  async handleFlutterwaveAccountNumber(session, input) {
    if (!/^\d{10}$/.test(input)) {
      return 'CON Invalid account number. Please enter 10 digits:';
    }
    
    await session.updateStep('flutterwave_verify_pin', { accountNumber: input });
    return 'CON Enter your PIN to confirm:';
  }

  /**
   * Handle mobile money provider selection
   */
  async handleMobileMoneySelection(session, input) {
    const country = session.getData('country');
    const providers = flutterwaveService.getMobileMoneyProviders(country);
    
    const providerIndex = parseInt(input) - 1;
    
    if (providerIndex < 0 || providerIndex >= providers.length) {
      if (input === '0') {
        await session.updateStep('flutterwave_method');
        return 'CON Select withdrawal method:\n1. Bank Account\n2. Mobile Money\n0. Back';
      }
      return 'CON Invalid selection. Try again.';
    }
    
    const selectedProvider = providers[providerIndex];
    await session.updateStep('flutterwave_mobile_number', { 
      provider: selectedProvider.code,
      providerName: selectedProvider.name
    });
    
    return 'CON ' + ussdBuilder.buildMobileMoneyNumberPrompt();
  }

  /**
   * Handle mobile money number input
   */
  async handleMobileMoneyNumber(session, input) {
    if (!/^\d{10,15}$/.test(input)) {
      return 'CON Invalid phone number. Please enter valid format:';
    }
    
    await session.updateStep('flutterwave_verify_pin', { recipientPhone: input });
    return 'CON Enter your PIN to confirm:';
  }

  /**
   * Handle Flutterwave PIN verification and process withdrawal
   */
  async handleFlutterwavePinVerification(session, input) {
    try {
      const user = await User.findByPhone(session.phoneNumber);
      if (!user) {
        await session.end();
        return 'END You need to register first.';
      }

      // Verify PIN
      if (!user.verifyPin(input)) {
        await session.end();
        return 'END Invalid PIN. Withdrawal cancelled.';
      }

      const data = session.getData();
      const method = data.method;
      const country = data.country;
      const amount = data.amount;

      let result;

      if (method === 'bank') {
        // Process bank transfer
        if (country === 'NG') {
          result = await paymentService.withdrawToNigerianBank({
            phoneNumber: session.phoneNumber,
            amount,
            accountNumber: data.accountNumber,
            bankCode: data.bankCode,
            pin: input,
            accountName: data.bankName
          });
        } else {
          result = await paymentService.withdrawToKenyanBank({
            phoneNumber: session.phoneNumber,
            amount,
            accountNumber: data.accountNumber,
            bankCode: data.bankCode,
            pin: input,
            accountName: data.bankName
          });
        }
      } else if (method === 'mobile_money') {
        // Process mobile money transfer
        result = await paymentService.withdrawToMobileMoneyFlutterwave({
          phoneNumber: session.phoneNumber,
          amount,
          recipientPhone: data.recipientPhone,
          provider: data.provider,
          pin: input,
          country
        });
      }

      await session.end();

      if (result && result.success) {
        const currency = country === 'KE' ? 'KES' : 'NGN';
        return `END Withdrawal initiated!\nAmount: ${currency}${amount}\nRef: ${result.txRef}\nStatus: ${result.status}`;
      } else {
        return 'END Withdrawal failed. Please try again.';
      }

    } catch (error) {
      logger.error('Flutterwave PIN verification error:', error);
      await session.end();
      return `END Withdrawal failed: ${error.message}`;
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
