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
 * Validate phone number format (accepts local or international format)
 * Valid Nigerian mobile prefixes:
 * MTN: 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906
 * Airtel: 0802, 0808, 0812, 0901, 0902, 0907, 0912
 * Glo: 0805, 0807, 0811, 0815, 0905
 * 9mobile: 0809, 0817, 0818, 0908, 0909
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Valid Nigerian mobile prefixes (after 0 or 234)
  const validPrefixes = [
    // MTN
    '0703', '0706', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906',
    // Airtel
    '0701', '0708', '0802', '0808', '0812', '0901', '0902', '0907', '0912',
    // Glo
    '0705', '0805', '0807', '0811', '0815', '0905',
    // 9mobile
    '0809', '0817', '0818', '0908', '0909'
  ];
  
  let prefix = '';
  
  // Check if it's a valid Nigerian number based on format
  if (cleaned.startsWith('234')) {
    // International format: 2348012345678 (13 digits)
    if (cleaned.length !== 13) return false;
    // Extract prefix (e.g., 234801 → 0801)
    prefix = '0' + cleaned.substring(3, 6);
  } else if (cleaned.startsWith('0')) {
    // Local format with 0: 08012345678 (11 digits)
    if (cleaned.length !== 11) return false;
    // Extract prefix (e.g., 0801)
    prefix = cleaned.substring(0, 4);
  } else if (/^[789]/.test(cleaned)) {
    // Local format without 0: 8012345678 (10 digits)
    if (cleaned.length !== 10) return false;
    // Add 0 and extract prefix (e.g., 801 → 0801)
    prefix = '0' + cleaned.substring(0, 3);
  } else {
    return false;
  }
  
  // Check if prefix is valid
  return validPrefixes.includes(prefix);
};

/**
 * Format phone number to international format (+234...)
 * Accepts: 08012345678, 8012345678, 2348012345678, +2348012345678
 * Returns: +2348012345678
 * 
 * @param {string} phoneNumber - Phone number in any format
 * @param {string} countryCode - Default country code (default: '234' for Nigeria)
 * @returns {string} - Formatted phone number with + prefix
 */
const formatPhoneNumber = (phoneNumber, countryCode = '234') => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If already has country code (234...), ensure it's 13 digits
  if (cleaned.startsWith(countryCode)) {
    return '+' + cleaned;
  }
  
  // If starts with 0 (local format: 08012345678), remove the 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Now we should have 10 digits (8012345678)
  // Add country code
  return '+' + countryCode + cleaned;
};

/**
 * Normalize phone number for database storage (always +234...)
 * This is an alias for formatPhoneNumber for clarity
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} - Normalized phone number (+234...)
 */
const normalizePhoneNumber = (phoneNumber) => {
  return formatPhoneNumber(phoneNumber);
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
  normalizePhoneNumber,
  generateTxRef,
  weiToEther,
  etherToWei,
  isValidAddress,
  sleep
};
