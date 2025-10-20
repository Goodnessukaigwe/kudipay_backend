const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Initiate withdrawal to bank account
   */
  async withdrawToBank(req, res) {
    try {
      const { phoneNumber, amount, accountNumber, bankCode, pin } = req.body;
      
      if (!phoneNumber || !amount || !accountNumber || !bankCode || !pin) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: phoneNumber, amount, accountNumber, bankCode, pin'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const result = await paymentService.withdrawToBank({
        phoneNumber,
        amount,
        accountNumber,
        bankCode,
        pin
      });
      
      res.json({
        success: true,
        message: 'Bank withdrawal initiated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Withdraw to bank error:', error);
      
      if (error.message.includes('Invalid PIN') || 
          error.message.includes('Insufficient balance') ||
          error.message.includes('User not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process bank withdrawal'
      });
    }
  }

  /**
   * Initiate withdrawal to mobile money
   */
  async withdrawToMobileMoney(req, res) {
    try {
      const { phoneNumber, amount, mobileMoneyNumber, provider, pin } = req.body;
      
      if (!phoneNumber || !amount || !mobileMoneyNumber || !provider || !pin) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: phoneNumber, amount, mobileMoneyNumber, provider, pin'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const result = await paymentService.withdrawToMobileMoney({
        phoneNumber,
        amount,
        mobileMoneyNumber,
        provider,
        pin
      });
      
      res.json({
        success: true,
        message: 'Mobile money withdrawal initiated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Withdraw to mobile money error:', error);
      
      if (error.message.includes('Invalid PIN') || 
          error.message.includes('Insufficient balance') ||
          error.message.includes('User not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process mobile money withdrawal'
      });
    }
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks(req, res) {
    try {
      const banks = await paymentService.getSupportedBanks();
      
      res.json({
        success: true,
        data: banks
      });
    } catch (error) {
      logger.error('Get supported banks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve supported banks'
      });
    }
  }

  /**
   * Get supported mobile money providers
   */
  async getMobileMoneyProviders(req, res) {
    try {
      const providers = await paymentService.getMobileMoneyProviders();
      
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      logger.error('Get mobile money providers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mobile money providers'
      });
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(req, res) {
    try {
      const { accountNumber, bankCode } = req.body;
      
      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          success: false,
          message: 'Account number and bank code are required'
        });
      }

      const verification = await paymentService.verifyBankAccount(accountNumber, bankCode);
      
      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      logger.error('Verify bank account error:', error);
      
      if (error.message.includes('Invalid account') || error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to verify bank account'
      });
    }
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(req, res) {
    try {
      const { txRef } = req.params;
      
      if (!txRef) {
        return res.status(400).json({
          success: false,
          message: 'Transaction reference is required'
        });
      }

      const status = await paymentService.getWithdrawalStatus(txRef);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get withdrawal status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve withdrawal status'
      });
    }
  }

  /**
   * Withdraw to Nigerian bank via Flutterwave
   */
  async withdrawToNigerianBank(req, res) {
    try {
      const { phoneNumber, amount, accountNumber, bankCode, pin, accountName } = req.body;
      
      if (!phoneNumber || !amount || !accountNumber || !bankCode || !pin) {
        return res.status(400).json({
          success: false,
          message: 'All fields required: phoneNumber, amount, accountNumber, bankCode, pin'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const result = await paymentService.withdrawToNigerianBank({
        phoneNumber,
        amount,
        accountNumber,
        bankCode,
        pin,
        accountName
      });
      
      res.json({
        success: true,
        message: 'Nigerian bank withdrawal initiated via Flutterwave',
        data: result
      });
    } catch (error) {
      logger.error('Nigerian bank withdrawal error:', error);
      
      if (error.message.includes('Invalid PIN') || 
          error.message.includes('User not found') ||
          error.message.includes('not supported')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process Nigerian bank withdrawal'
      });
    }
  }

  /**
   * Withdraw to Kenyan bank via Flutterwave
   */
  async withdrawToKenyanBank(req, res) {
    try {
      const { phoneNumber, amount, accountNumber, bankCode, pin, accountName } = req.body;
      
      if (!phoneNumber || !amount || !accountNumber || !bankCode || !pin) {
        return res.status(400).json({
          success: false,
          message: 'All fields required: phoneNumber, amount, accountNumber, bankCode, pin'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const result = await paymentService.withdrawToKenyanBank({
        phoneNumber,
        amount,
        accountNumber,
        bankCode,
        pin,
        accountName
      });
      
      res.json({
        success: true,
        message: 'Kenyan bank withdrawal initiated via Flutterwave',
        data: result
      });
    } catch (error) {
      logger.error('Kenyan bank withdrawal error:', error);
      
      if (error.message.includes('Invalid PIN') || 
          error.message.includes('User not found') ||
          error.message.includes('not supported')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process Kenyan bank withdrawal'
      });
    }
  }

  /**
   * Withdraw to mobile money via Flutterwave
   */
  async withdrawToMobileMoneyFlutterwave(req, res) {
    try {
      const { phoneNumber, amount, recipientPhone, provider, pin, country } = req.body;
      
      if (!phoneNumber || !amount || !recipientPhone || !provider || !pin || !country) {
        return res.status(400).json({
          success: false,
          message: 'All fields required: phoneNumber, amount, recipientPhone, provider, pin, country'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const result = await paymentService.withdrawToMobileMoneyFlutterwave({
        phoneNumber,
        amount,
        recipientPhone,
        provider,
        pin,
        country
      });
      
      res.json({
        success: true,
        message: 'Mobile money withdrawal initiated via Flutterwave',
        data: result
      });
    } catch (error) {
      logger.error('Mobile money withdrawal error:', error);
      
      if (error.message.includes('Invalid PIN') || 
          error.message.includes('User not found') ||
          error.message.includes('not supported')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to process mobile money withdrawal'
      });
    }
  }

  /**
   * Get Nigerian banks via Flutterwave
   */
  async getNigerianBanks(req, res) {
    logger.info('[DEBUG] paymentController.getNigerianBanks called');
    try {
      logger.info('[DEBUG] About to call paymentService.getNigerianBanksFlutterwave');
      const banks = await paymentService.getNigerianBanksFlutterwave();
      res.json({
        success: true,
        message: 'Nigerian banks retrieved successfully',
        data: banks
      });
    } catch (error) {
      logger.error('Get Nigerian banks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve Nigerian banks'
      });
    }
  }

  /**
   * Get Kenyan banks via Flutterwave
   */
  async getKenyanBanks(req, res) {
    logger.info('[DEBUG] paymentController.getKenyanBanks called');
    try {
      logger.info('[DEBUG] About to call paymentService.getKenyanBanksFlutterwave');
      const banks = await paymentService.getKenyanBanksFlutterwave();
      res.json({
        success: true,
        message: 'Kenyan banks retrieved successfully',
        data: banks
      });
    } catch (error) {
      logger.error('Get Kenyan banks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve Kenyan banks'
      });
    }
  }

  /**
   * Get mobile money providers via Flutterwave
   */
  async getMobileMoneyProvidersFlutterwave(req, res) {
    logger.info('[DEBUG] paymentController.getMobileMoneyProvidersFlutterwave called');
    try {
      const { country } = req.query;
      logger.info(`[DEBUG] About to call paymentService.getMobileMoneyProvidersFlutterwave with country=${country || 'NG'}`);
      const providers = await paymentService.getMobileMoneyProvidersFlutterwave(country || 'NG');
      res.json({
        success: true,
        message: 'Mobile money providers retrieved successfully',
        data: providers
      });
    } catch (error) {
      logger.error('Get mobile money providers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve mobile money providers'
      });
    }
  }

  /**
   * Verify account via Flutterwave
   */
  async verifyAccountFlutterwave(req, res) {
    try {
      const { accountNumber, bankCode, country } = req.body;
      
      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          success: false,
          message: 'Account number and bank code are required'
        });
      }

      const verification = await paymentService.verifyAccountFlutterwave(
        accountNumber,
        bankCode,
        country || 'NG'
      );
      
      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      logger.error('Account verification error:', error);
      
      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to verify account'
      });
    }
  }

  /**
   * Get transfer status via Flutterwave
   */
  async getFlutterwaveTransferStatus(req, res) {
    try {
      const { transferId } = req.params;
      
      if (!transferId) {
        return res.status(400).json({
          success: false,
          message: 'Transfer ID is required'
        });
      }

      const status = await paymentService.getFlutterwaveTransferStatus(transferId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get transfer status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transfer status'
      });
    }
  }

  /**
   * Handle Flutterwave webhook
   */
  async handleFlutterwaveWebhook(req, res) {
    try {
      const flutterwaveService = require('../services/flutterwaveService');
      const result = await flutterwaveService.handleWebhookCallback(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Webhook handling error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }
}

module.exports = new PaymentController();
