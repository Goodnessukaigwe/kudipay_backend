const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Generate a deterministic wallet address from phone number
 * @param {string} phoneNumber - The phone number in international format
 * @returns {string} - Generated wallet address
 */
const generateWalletFromPhone = (phoneNumber) => {
  // Normalize phone number (remove spaces, dashes, etc.)
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  
  // Create a seed from phone number with salt
  const salt = process.env.PHONE_SALT || 'kudipay-salt-2024';
  const seed = crypto.pbkdf2Sync(normalizedPhone, salt, 10000, 32, 'sha256');
  
  // Generate wallet from seed
  const wallet = new ethers.Wallet(ethers.hexlify(seed));
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Basic validation for international format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * Format phone number to international format
 * @param {string} phoneNumber - Phone number to format
 * @param {string} countryCode - Default country code (e.g., '+234' for Nigeria)
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber, countryCode = '+234') => {
  let formatted = phoneNumber.replace(/\D/g, '');
  
  // If doesn't start with country code, add it
  if (!formatted.startsWith(countryCode.replace('+', ''))) {
    // Remove leading zero if present
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }
    formatted = countryCode.replace('+', '') + formatted;
  }
  
  return '+' + formatted;
};

/**
 * Generate transaction reference
 * @returns {string} - Unique transaction reference
 */
const generateTxRef = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `KP_${timestamp}_${random}`.toUpperCase();
};

/**
 * Convert Wei to Ether
 * @param {string|number} wei - Amount in Wei
 * @returns {string} - Amount in Ether
 */
const weiToEther = (wei) => {
  return ethers.formatEther(wei);
};

/**
 * Convert Ether to Wei
 * @param {string|number} ether - Amount in Ether
 * @returns {string} - Amount in Wei
 */
const etherToWei = (ether) => {
  return ethers.parseEther(ether.toString());
};

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} - True if valid
 */
const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  generateWalletFromPhone,
  isValidPhoneNumber,
  formatPhoneNumber,
  generateTxRef,
  weiToEther,
  etherToWei,
  isValidAddress,
  sleep
};
