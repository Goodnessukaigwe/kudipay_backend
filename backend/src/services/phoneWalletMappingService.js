const { ethers } = require('ethers');
const { provider, getWallet, blockchainConfig } = require('../../config/blockchain');
const logger = require('../utils/logger');

/**
 * PhoneWalletMappingService
 * Interacts with the deployed PhoneWalletMapping contract on Sepolia
 * Contract: 0x6ccDf26970eD11585D089F9112318D9d13745722
 */
class PhoneWalletMappingService {
  constructor() {
    this.provider = provider;
    this.contractAddress = blockchainConfig.contracts.phoneWalletMapping.address;
    this.contractABI = blockchainConfig.contracts.phoneWalletMapping.abi;
    
    // Read-only contract instance
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      this.provider
    );
    
    // Write contract instance (requires wallet)
    try {
      this.wallet = getWallet();
      this.contractWithSigner = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.wallet
      );
    } catch (error) {
      logger.warn('No wallet configured for contract writes');
      this.contractWithSigner = null;
    }
  }

  /**
   * Map phone number to wallet address (on-chain)
   * @param {string} phoneNumber - Normalized phone number (e.g., +2348054969639)
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Promise<Object>} Transaction receipt
   */
  async mapPhoneToWallet(phoneNumber, walletAddress) {
    try {
      if (!this.contractWithSigner) {
        throw new Error('No wallet configured for contract writes');
      }

      logger.info(`Mapping ${phoneNumber} to ${walletAddress} on-chain...`);

      // Call contract method
      const tx = await this.contractWithSigner.mapPhoneToWallet(
        phoneNumber,
        walletAddress
      );

      logger.info(`Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      logger.info(`Mapping confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        phoneNumber,
        walletAddress,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Error mapping phone to wallet:', error);
      
      // Parse contract errors
      if (error.message.includes('PhoneNumberAlreadyRegistered')) {
        throw new Error('Phone number already registered');
      } else if (error.message.includes('WalletAlreadyRegistered')) {
        throw new Error('Wallet address already registered');
      } else if (error.message.includes('InvalidPhoneNumber')) {
        throw new Error('Invalid Nigerian phone number format');
      }
      
      throw error;
    }
  }

  /**
   * Get wallet address for phone number (read from chain)
   * @param {string} phoneNumber - Normalized phone number
   * @returns {Promise<string>} Wallet address or zero address
   */
  async getWalletForPhone(phoneNumber) {
    try {
      const walletAddress = await this.contract.getWalletForPhone(phoneNumber);
      
      // Check if it's the zero address (not registered)
      if (walletAddress === ethers.ZeroAddress) {
        return null;
      }
      
      return walletAddress;
    } catch (error) {
      logger.error('Error getting wallet for phone:', error);
      throw error;
    }
  }

  /**
   * Get phone number for wallet address (read from chain)
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Promise<string|null>} Phone number or null if not registered
   */
  async getPhoneForWallet(walletAddress) {
    try {
      const phoneNumber = await this.contract.getPhoneForWallet(walletAddress);
      
      // Check if empty string (not registered)
      if (!phoneNumber || phoneNumber === '') {
        return null;
      }
      
      return phoneNumber;
    } catch (error) {
      logger.error('Error getting phone for wallet:', error);
      throw error;
    }
  }

  /**
   * Check if phone number is registered
   * @param {string} phoneNumber - Normalized phone number
   * @returns {Promise<boolean>}
   */
  async isPhoneNumberRegistered(phoneNumber) {
    try {
      return await this.contract.isPhoneNumberRegistered(phoneNumber);
    } catch (error) {
      logger.error('Error checking phone registration:', error);
      return false;
    }
  }

  /**
   * Check if wallet address is registered
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Promise<boolean>}
   */
  async isWalletAddressRegistered(walletAddress) {
    try {
      return await this.contract.isWalletAddressRegistered(walletAddress);
    } catch (error) {
      logger.error('Error checking wallet registration:', error);
      return false;
    }
  }

  /**
   * Validate Nigerian phone number using contract logic
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Promise<boolean>}
   */
  async isValidNigerianPhoneNumber(phoneNumber) {
    try {
      return await this.contract.isValidNigerianPhoneNumber(phoneNumber);
    } catch (error) {
      logger.error('Error validating phone number:', error);
      return false;
    }
  }

  /**
   * Update wallet address for existing phone number
   * @param {string} phoneNumber - Existing phone number
   * @param {string} newWalletAddress - New wallet address
   * @returns {Promise<Object>} Transaction receipt
   */
  async updateWalletForPhone(phoneNumber, newWalletAddress) {
    try {
      if (!this.contractWithSigner) {
        throw new Error('No wallet configured for contract writes');
      }

      logger.info(`Updating wallet for ${phoneNumber} to ${newWalletAddress}...`);

      const tx = await this.contractWithSigner.updateWalletForPhone(
        phoneNumber,
        newWalletAddress
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Error updating wallet for phone:', error);
      throw error;
    }
  }

  /**
   * Update phone number for existing wallet
   * @param {string} oldPhoneNumber - Current phone number
   * @param {string} newPhoneNumber - New phone number
   * @returns {Promise<Object>} Transaction receipt
   */
  async updatePhoneForWallet(oldPhoneNumber, newPhoneNumber) {
    try {
      if (!this.contractWithSigner) {
        throw new Error('No wallet configured for contract writes');
      }

      logger.info(`Updating phone from ${oldPhoneNumber} to ${newPhoneNumber}...`);

      const tx = await this.contractWithSigner.updatePhoneForWallet(
        oldPhoneNumber,
        newPhoneNumber
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Error updating phone for wallet:', error);
      throw error;
    }
  }

  /**
   * Get total number of registered users
   * @returns {Promise<number>}
   */
  async getTotalRegisteredUsers() {
    try {
      const total = await this.contract.totalRegisteredUsers();
      return Number(total);
    } catch (error) {
      logger.error('Error getting total registered users:', error);
      return 0;
    }
  }

  /**
   * Admin function to update mapping (only contract owner)
   * @param {string} phoneNumber - Phone number
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Transaction receipt
   */
  async adminUpdateMapping(phoneNumber, walletAddress) {
    try {
      if (!this.contractWithSigner) {
        throw new Error('No wallet configured for contract writes');
      }

      logger.info(`Admin updating mapping: ${phoneNumber} -> ${walletAddress}...`);

      const tx = await this.contractWithSigner.adminUpdateMapping(
        phoneNumber,
        walletAddress
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      logger.error('Error in admin update mapping:', error);
      
      if (error.message.includes('OwnableUnauthorizedAccount')) {
        throw new Error('Only contract owner can perform this action');
      }
      
      throw error;
    }
  }

  /**
   * Check if contract is paused
   * @returns {Promise<boolean>}
   */
  async isPaused() {
    try {
      return await this.contract.paused();
    } catch (error) {
      logger.error('Error checking pause status:', error);
      return false;
    }
  }

  /**
   * Get contract owner address
   * @returns {Promise<string>}
   */
  async getOwner() {
    try {
      return await this.contract.owner();
    } catch (error) {
      logger.error('Error getting contract owner:', error);
      return null;
    }
  }
}

module.exports = new PhoneWalletMappingService();
