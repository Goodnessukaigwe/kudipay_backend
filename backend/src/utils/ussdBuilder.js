const ussdConfig = require('../../config/ussd');

/**
 * Build USSD menu string
 * @param {string} title - Menu title
 * @param {Object} options - Menu options
 * @param {string} footer - Optional footer text
 * @returns {string} - Formatted USSD menu
 */
const buildMenu = (title, options, footer = '') => {
  let menu = title + '\n';
  
  Object.entries(options).forEach(([key, value]) => {
    menu += `${key}. ${value}\n`;
  });
  
  if (footer) {
    menu += '\n' + footer;
  }
  
  return menu.trim();
};

/**
 * Build main USSD menu
 * @returns {string} - Main menu string
 */
const buildMainMenu = () => {
  return buildMenu(
    ussdConfig.messages.welcome,
    ussdConfig.menu.mainMenu
  );
};

/**
 * Build withdrawal menu
 * @returns {string} - Withdrawal menu string
 */
const buildWithdrawMenu = () => {
  return buildMenu(
    ussdConfig.messages.withdrawal.selectMethod,
    ussdConfig.menu.withdrawMenu
  );
};

/**
 * Build bank selection menu
 * @returns {string} - Bank menu string
 */
const buildBankMenu = () => {
  const banks = {
    '1': 'Access Bank',
    '2': 'GTBank',
    '3': 'First Bank',
    '4': 'Zenith Bank',
    '5': 'UBA',
    '6': 'Union Bank',
    '7': 'Polaris Bank',
    '8': 'Wema Bank',
    '9': 'Ecobank',
    '10': 'Fidelity Bank'
  };
  
  return buildMenu('Select your bank:', banks);
};

/**
 * Build balance display message
 * @param {number} balance - Balance amount in NGN
 * @returns {string} - Formatted balance message
 */
const buildBalanceMessage = (balance) => {
  return ussdConfig.messages.balance.display.replace('{amount}', balance.toLocaleString());
};

/**
 * Build withdrawal success message
 * @param {number} amount - Withdrawal amount
 * @param {string} method - Withdrawal method
 * @returns {string} - Formatted success message
 */
const buildWithdrawalSuccess = (amount, method) => {
  return ussdConfig.messages.withdrawal.success
    .replace('{amount}', amount.toLocaleString())
    .replace('{method}', method);
};

/**
 * Parse USSD input for amount
 * @param {string} input - User input
 * @returns {number|null} - Parsed amount or null if invalid
 */
const parseAmount = (input) => {
  const amount = parseFloat(input.replace(/[^\d.]/g, ''));
  return isNaN(amount) || amount <= 0 ? null : amount;
};

/**
 * Build transaction history display
 * @param {Array} transactions - Array of transactions
 * @returns {string} - Formatted transaction history
 */
const buildTransactionHistory = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return 'No transactions found.';
  }
  
  let history = 'Recent Transactions:\n';
  
  transactions.slice(0, 5).forEach((tx, index) => {
    const date = new Date(tx.created_at).toLocaleDateString();
    const type = tx.type === 'received' ? '+' : '-';
    history += `${index + 1}. ${type}₦${tx.amount} ${date}\n`;
  });
  
  return history + '\n0. Back to Main Menu';
};

/**
 * Validate USSD session data
 * @param {Object} session - Session data
 * @param {Array} requiredFields - Required fields
 * @returns {boolean} - True if valid
 */
const validateSession = (session, requiredFields) => {
  return requiredFields.every(field => session && session[field] !== undefined);
};

module.exports = {
  buildMenu,
  buildMainMenu,
  buildWithdrawMenu,
  buildBankMenu,
  buildBalanceMessage,
  buildWithdrawalSuccess,
  parseAmount,
  buildTransactionHistory,
  validateSession
};
