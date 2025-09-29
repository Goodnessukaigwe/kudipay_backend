const User = require('../models/User');
const Transaction = require('../models/Transaction');
const walletService = require('../services/walletService');
const logger = require('../utils/logger');
const { formatPhoneNumber, isValidPhoneNumber } = require('../utils/helpers');

class UserController {
  /**
   * Register new user
   */
  async registerUser(req, res) {
    try {
      const { phoneNumber, pin } = req.body;
      
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

      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN must be exactly 4 digits'
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
        message: 'User registered successfully',
        data: {
          phoneNumber: walletData.phoneNumber,
          walletAddress: walletData.walletAddress,
          userId: walletData.userId
        }
      });
      
    } catch (error) {
      logger.error('Register user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user'
      });
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(req, res) {
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
          message: 'User not found'
        });
      }

      // Get wallet balance
      const balance = await walletService.getBalance(user.walletAddress);
      
      res.json({
        success: true,
        data: {
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
          balance,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
      
    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile'
      });
    }
  }

  /**
   * Update user PIN
   */
  async updatePin(req, res) {
    try {
      const { phoneNumber, currentPin, newPin } = req.body;
      
      if (!phoneNumber || !currentPin || !newPin) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, current PIN, and new PIN are required'
        });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }

      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({
          success: false,
          message: 'New PIN must be exactly 4 digits'
        });
      }

      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current PIN
      if (!user.verifyPin(currentPin)) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is incorrect'
        });
      }

      // Update PIN
      await user.updatePin(newPin);
      
      res.json({
        success: true,
        message: 'PIN updated successfully'
      });
      
    } catch (error) {
      logger.error('Update PIN error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update PIN'
      });
    }
  }

  /**
   * Verify user PIN
   */
  async verifyPin(req, res) {
    try {
      const { phoneNumber, pin } = req.body;
      
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

      const user = await User.findByPhone(formattedPhone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isValid = user.verifyPin(pin);
      
      res.json({
        success: true,
        data: {
          phoneNumber: user.phoneNumber,
          pinValid: isValid
        }
      });
      
    } catch (error) {
      logger.error('Verify PIN error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify PIN'
      });
    }
  }

  /**
   * Get user transaction statistics
   */
  async getUserStats(req, res) {
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
          message: 'User not found'
        });
      }

      // Get transaction statistics
      const stats = await Transaction.getStats(formattedPhone);
      
      // Get recent transactions
      const recentTransactions = await Transaction.findByPhone(formattedPhone, 5);
      
      // Get current balance
      const balance = await walletService.getBalance(user.walletAddress);
      
      res.json({
        success: true,
        data: {
          phoneNumber: user.phoneNumber,
          walletAddress: user.walletAddress,
          balance,
          statistics: {
            totalTransactions: parseInt(stats.total_transactions) || 0,
            totalReceived: parseFloat(stats.total_received) || 0,
            totalSent: parseFloat(stats.total_sent) || 0,
            completedTransactions: parseInt(stats.completed_transactions) || 0,
            pendingTransactions: parseInt(stats.pending_transactions) || 0,
            failedTransactions: parseInt(stats.failed_transactions) || 0
          },
          recentTransactions,
          memberSince: user.createdAt
        }
      });
      
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics'
      });
    }
  }
}

module.exports = new UserController();
