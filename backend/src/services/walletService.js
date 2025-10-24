const User = require('../models/User');
const Transaction = require('../models/Transaction');
const blockchainService = require('./blockchainService');
const phoneWalletMappingService = require('./phoneWalletMappingService');
const fxService = require('./fxService');
const smsService = require('./smsService');
const logger = require('../utils/logger');
const { generateWalletFromPhone, generateTxRef, etherToWei, weiToEther, normalizePhoneNumber, isValidPhoneNumber } = require('../utils/helpers');

class WalletService {
  /**
   * Create a new wallet for a phone number
   * Accepts local format (08012345678) and converts to international (+2348012345678)
   * Registers phone-wallet mapping on blockchain smart contract
   */
  async createWallet(phoneNumber, pin) {
    try {
      // Validate phone number format
      if (!isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use: 08012345678 or 8012345678');
      }

      // Normalize to international format (+234...)
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // Check if phone number already registered in database
      const existingUser = await User.findByPhone(normalizedPhone);
      if (existingUser) {
        throw new Error('Phone number already registered');
      }

      // Check if phone number already registered on blockchain
      const existingOnChain = await phoneWalletMappingService.isPhoneNumberRegistered(normalizedPhone);
      if (existingOnChain) {
        throw new Error('Phone number already registered on blockchain');
      }
      
      // Generate wallet from normalized phone number
      const walletData = generateWalletFromPhone(normalizedPhone);

      // Check if wallet already registered on blockchain
      const walletRegistered = await phoneWalletMappingService.isWalletAddressRegistered(walletData.address);
      if (walletRegistered) {
        throw new Error('Wallet address already registered on blockchain');
      }
      
      logger.info(`Creating wallet for ${normalizedPhone}...`);
      
      // Register phone-wallet mapping on blockchain smart contract
      let blockchainResult = null;
      try {
        blockchainResult = await phoneWalletMappingService.mapPhoneToWallet(
          normalizedPhone,
          walletData.address
        );
        
        logger.info(`Blockchain registration successful:`, {
          phone: normalizedPhone,
          wallet: walletData.address,
          txHash: blockchainResult.transactionHash,
          block: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed
        });
      } catch (blockchainError) {
        logger.error('Blockchain registration failed:', blockchainError);
        throw new Error(`Failed to register on blockchain: ${blockchainError.message}`);
      }
      
      // Create user record in database with blockchain reference
      const user = await User.create({
        phoneNumber: normalizedPhone, // Always stored as +234...
        walletAddress: walletData.address,
        privateKey: walletData.privateKey, // In production, this should be encrypted
        pin: pin, // In production, this should be hashed
        blockchainTxHash: blockchainResult.transactionHash,
        blockchainBlock: blockchainResult.blockNumber,
        blockchainNetwork: 'base-sepolia', // Will be 'base-mainnet' in production
        blockchainRegisteredAt: new Date()
      });
      
      logger.info(`Wallet created successfully for ${normalizedPhone}:`, {
        userId: user.id,
        walletAddress: user.walletAddress,
        blockchainTxHash: user.blockchainTxHash
      });
      
      // Send SMS notification (don't wait for it)
      smsService.sendRegistrationConfirmation(normalizedPhone, user.walletAddress)
        .catch(err => logger.warn('SMS notification failed:', err.message));
      
      return {
        phoneNumber: user.phoneNumber,
        walletAddress: user.walletAddress,
        userId: user.id,
        blockchain: {
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          network: 'base-sepolia',
          explorerUrl: `https://sepolia.basescan.org/tx/${blockchainResult.transactionHash}`
        }
      };
    } catch (error) {
      logger.error('Create wallet error:', error);
      throw error;
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
   * Only the phone number that owns the wallet can send transactions
   */
  async sendTransaction({ fromPhone, toPhone, amount, pin }) {
    try {
      // Normalize both phone numbers
      const normalizedFromPhone = normalizePhoneNumber(fromPhone);
      const normalizedToPhone = normalizePhoneNumber(toPhone);

      // Validate phone numbers
      if (!isValidPhoneNumber(fromPhone)) {
        throw new Error('Invalid sender phone number format');
      }
      if (!isValidPhoneNumber(toPhone)) {
        throw new Error('Invalid recipient phone number format');
      }
      
      // Get sender and receiver
      const sender = await User.findByPhone(normalizedFromPhone);
      const receiver = await User.findByPhone(normalizedToPhone);
      
      if (!sender) {
        throw new Error('Sender not found. Please register first.');
      }
      
      if (!receiver) {
        throw new Error('Receiver not found. They need to register first.');
      }

      // CRITICAL: Enforce phone number ownership
      // Only the phone number that registered the wallet can send from it
      if (sender.phoneNumber !== normalizedFromPhone) {
        logger.warn(`Unauthorized transaction attempt from ${normalizedFromPhone} using wallet ${sender.walletAddress}`);
        throw new Error('Unauthorized: You can only send from your own wallet');
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
      
      // Send SMS notifications to both sender and receiver (don't wait)
      smsService.sendMoneySentConfirmation(
        normalizedFromPhone,
        normalizedToPhone,
        amount,
        'NGN',
        blockchainResult.hash
      ).catch(err => logger.warn('SMS to sender failed:', err.message));
      
      smsService.sendMoneyReceivedNotification(
        normalizedToPhone,
        normalizedFromPhone,
        amount,
        'NGN',
        blockchainResult.hash
      ).catch(err => logger.warn('SMS to receiver failed:', err.message));
      
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
