const walletService = require('../services/walletService');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { isValidPhoneNumber, formatPhoneNumber, isValidAddress } = require('../utils/helpers');

class WalletController {
  /**
   * Create wallet for phone number
   */
  async createWallet(req, res) {
    try {
      const { phoneNumber, pin } = req.body;
      
      // Validate input
      if (!phoneNumber || !pin) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and PIN are required'
        });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByPhone(formattedPhone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already registered'
        });
      }

      // Create wallet
      const walletData = await walletService.createWallet(formattedPhone, pin);
      
      res.status(201).json({
        success: true,
        message: 'Wallet created successfully',
        data: {
          phoneNumber: formattedPhone,
          walletAddress: walletData.walletAddress
        }
      });
      
    } catch (error) {
      logger.error('Create wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create wallet'
      });
    }
  }

  /**
   * Get wallet info by phone number
   */
  async getWalletByPhone(req, res) {
    try {
      const { phoneNumber } = req.params;
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found for this phone number'
        });
      }

      // Get balance
      const balance = await walletService.getBalance(user.walletAddress);
      
      res.json({
        success: true,
        data: {
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
          balance: balance,
          isActive: user.isActive
        }
      });
      
    } catch (error) {
      logger.error('Get wallet by phone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve wallet information'
      });
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(req, res) {
    try {
      const { walletAddress } = req.params;
      
      if (!isValidAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address'
        });
      }

      const balance = await walletService.getBalance(walletAddress);
      
      res.json({
        success: true,
        data: {
          walletAddress,
          balance
        }
      });
      
    } catch (error) {
      logger.error('Get balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve balance'
      });
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(req, res) {
    try {
      const { fromPhone, toPhone, amount, pin } = req.body;
      
      // Validate input
      if (!fromPhone || !toPhone || !amount || !pin) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: fromPhone, toPhone, amount, pin'
        });
      }

      const formattedFromPhone = formatPhoneNumber(fromPhone);
      const formattedToPhone = formatPhoneNumber(toPhone);
      
      if (!isValidPhoneNumber(formattedFromPhone) || !isValidPhoneNumber(formattedToPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Process the transaction
      const result = await walletService.sendTransaction({
        fromPhone: formattedFromPhone,
        toPhone: formattedToPhone,
        amount,
        pin
      });
      
      res.json({
        success: true,
        message: 'Transaction sent successfully',
        data: result
      });
      
    } catch (error) {
      logger.error('Send transaction error:', error);
      
      if (error.message.includes('Invalid PIN') || error.message.includes('User not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to send transaction'
      });
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(req, res) {
    try {
      const { walletAddress } = req.params;
      const { limit = 10, offset = 0 } = req.query;
      
      if (!isValidAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address'
        });
      }

      const transactions = await Transaction.findByWallet(
        walletAddress,
        parseInt(limit),
        parseInt(offset)
      );
      
      res.json({
        success: true,
        data: transactions
      });
      
    } catch (error) {
      logger.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions'
      });
    }
  }

  /**
   * Get receive information (address and QR code)
   */
  async getReceiveInfo(req, res) {
    try {
      const { phoneNumber } = req.params;
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found for this phone number'
        });
      }

      // Generate QR code data (could be expanded to actual QR image)
      const qrData = {
        address: user.walletAddress,
        phoneNumber: user.phoneNumber,
        network: 'base'
      };
      
      res.json({
        success: true,
        data: {
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
          qrData: qrData,
          qrString: JSON.stringify(qrData)
        }
      });
      
    } catch (error) {
      logger.error('Get receive info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve receive information'
      });
    }
  }
}

module.exports = new WalletController();
