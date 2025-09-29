const User = require('../models/User');
const Transaction = require('../models/Transaction');
const blockchainService = require('./blockchainService');
const fxService = require('./fxService');
const logger = require('../utils/logger');
const { generateWalletFromPhone, generateTxRef, etherToWei, weiToEther } = require('../utils/helpers');

class WalletService {
  /**
   * Create a new wallet for a phone number
   */
  async createWallet(phoneNumber, pin) {
    try {
      // Generate wallet from phone number
      const walletData = generateWalletFromPhone(phoneNumber);
      
      // Create user record
      const user = await User.create({
        phoneNumber,
        walletAddress: walletData.address,
        privateKey: walletData.privateKey, // In production, this should be encrypted
        pin: pin // In production, this should be hashed
      });
      
      // Deploy Account Abstraction wallet on blockchain
      await blockchainService.deployWallet(walletData.address, phoneNumber);
      
      logger.info(`Wallet created for ${phoneNumber}: ${walletData.address}`);
      
      return {
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress,
        userId: user.id
      };
    } catch (error) {
      logger.error('Create wallet error:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletAddress) {
    try {
      const balances = await blockchainService.getBalance(walletAddress);
      
      return {
        eth: weiToEther(balances.eth),
        usdt: balances.usdt,
        walletAddress
      };
    } catch (error) {
      logger.error('Get balance error:', error);
      throw new Error('Failed to retrieve balance');
    }
  }

  /**
   * Send transaction between phone numbers
   */
  async sendTransaction({ fromPhone, toPhone, amount, pin }) {
    try {
      // Get sender and receiver
      const sender = await User.findByPhone(fromPhone);
      const receiver = await User.findByPhone(toPhone);
      
      if (!sender) {
        throw new Error('Sender not found. Please register first.');
      }
      
      if (!receiver) {
        throw new Error('Receiver not found. They need to register first.');
      }
      
      // Verify sender's PIN
      if (!sender.verifyPin(pin)) {
        throw new Error('Invalid PIN');
      }
      
      // Check sender's balance
      const balance = await this.getBalance(sender.walletAddress);
      const currentRate = await fxService.getUSDTToNGNRate();
      const requiredUSDT = amount / currentRate;
      
      if (parseFloat(balance.usdt) < requiredUSDT) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction record
      const txRef = generateTxRef();
      const transaction = await Transaction.create({
        txRef,
        fromPhone,
        toPhone,
        fromWallet: sender.walletAddress,
        toWallet: receiver.walletAddress,
        amount: requiredUSDT,
        currency: 'USDT',
        amountNgn: amount,
        exchangeRate: currentRate,
        fee: 0, // No fee for MVP
        type: 'transfer',
        status: 'pending'
      });
      
      // Execute blockchain transaction
      const blockchainResult = await blockchainService.transfer({
        from: sender.walletAddress,
        to: receiver.walletAddress,
        amount: requiredUSDT,
        privateKey: sender.privateKey
      });
      
      // Update transaction with blockchain hash
      await transaction.updateStatus('completed', blockchainResult.hash);
      
      logger.info(`Transaction completed: ${txRef} - ${amount} NGN from ${fromPhone} to ${toPhone}`);
      
      return {
        txRef,
        fromPhone,
        toPhone,
        amount,
        status: 'completed',
        blockchainHash: blockchainResult.hash
      };
      
    } catch (error) {
      logger.error('Send transaction error:', error);
      throw error;
    }
  }

  /**
   * Process incoming crypto transaction to phone number
   */
  async processIncomingTransaction({ toPhone, amount, currency, fromAddress, blockchainHash }) {
    try {
      // Find recipient
      const recipient = await User.findByPhone(toPhone);
      if (!recipient) {
        throw new Error('Recipient not found');
      }
      
      // Get current exchange rate
      const rate = currency === 'USDT' ? 
        await fxService.getUSDTToNGNRate() : 
        await fxService.getETHToNGNRate();
      
      const amountNgn = amount * rate;
      
      // Create transaction record
      const txRef = generateTxRef();
      const transaction = await Transaction.create({
        txRef,
        toPhone,
        toWallet: recipient.walletAddress,
        fromWallet: fromAddress,
        amount,
        currency,
        amountNgn,
        exchangeRate: rate,
        type: 'received',
        status: 'completed',
        blockchain_hash: blockchainHash
      });
      
      logger.info(`Incoming transaction processed: ${txRef} - ${amount} ${currency} to ${toPhone}`);
      
      // TODO: Send SMS notification to recipient
      
      return {
        txRef,
        toPhone,
        amount: amountNgn,
        currency: 'NGN',
        status: 'completed'
      };
      
    } catch (error) {
      logger.error('Process incoming transaction error:', error);
      throw error;
    }
  }

  /**
   * Get wallet by phone number
   */
  async getWalletByPhone(phoneNumber) {
    try {
      const user = await User.findByPhone(phoneNumber);
      if (!user) {
        return null;
      }
      
      const balance = await this.getBalance(user.walletAddress);
      
      return {
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress,
        balance,
        isActive: user.isActive
      };
    } catch (error) {
      logger.error('Get wallet by phone error:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a phone number
   */
  async getTransactionHistory(phoneNumber, limit = 10, offset = 0) {
    try {
      const transactions = await Transaction.findByPhone(phoneNumber, limit, offset);
      return transactions;
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(amount, currency = 'USDT') {
    try {
      // For MVP, return zero fees
      // In production, calculate based on network fees and service charges
      return {
        networkFee: 0,
        serviceFee: 0,
        totalFee: 0
      };
    } catch (error) {
      logger.error('Estimate fee error:', error);
      throw error;
    }
  }
}

module.exports = new WalletService();
