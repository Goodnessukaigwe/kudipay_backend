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
}

module.exports = new PaymentController();
