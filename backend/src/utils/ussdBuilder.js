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

/**
 * Build payment method selection menu for Flutterwave
 * @returns {string} - Payment methods menu
 */
const buildFlutterwavePaymentMethodMenu = () => {
  const methods = {
    '1': 'Bank Transfer',
    '2': 'Mobile Money',
    '3': 'Back to Main Menu'
  };
  
  return buildMenu('Select Payment Method:', methods);
};

/**
 * Build country selection menu
 * @returns {string} - Country selection menu
 */
const buildCountrySelectionMenu = () => {
  const countries = {
    '1': 'Nigeria (NGN)',
    '2': 'Kenya (KES)',
    '0': 'Back'
  };
  
  return buildMenu('Select Your Country:', countries);
};

/**
 * Build bank selection prompt for Nigeria
 * @param {Array} banks - Array of bank objects
 * @returns {string} - Formatted bank selection menu
 */
const buildNigerianBankSelectionMenu = (banks) => {
  if (!banks || banks.length === 0) {
    return 'No banks available';
  }
  
  let menu = 'Select Bank:\n';
  banks.slice(0, 5).forEach((bank, index) => {
    menu += `${index + 1}. ${bank.name}\n`;
  });
  menu += '0. Back';
  
  return menu;
};

/**
 * Build bank selection prompt for Kenya
 * @param {Array} banks - Array of bank objects
 * @returns {string} - Formatted bank selection menu
 */
const buildKenyanBankSelectionMenu = (banks) => {
  if (!banks || banks.length === 0) {
    return 'No banks available';
  }
  
  let menu = 'Select Bank:\n';
  banks.forEach((bank, index) => {
    menu += `${index + 1}. ${bank.name}\n`;
  });
  menu += '0. Back';
  
  return menu;
};

/**
 * Build mobile money provider selection menu
 * @param {Array} providers - Array of provider objects
 * @returns {string} - Formatted provider selection menu
 */
const buildMobileMoneyProviderMenu = (providers) => {
  if (!providers || providers.length === 0) {
    return 'No mobile money providers available';
  }
  
  let menu = 'Select Provider:\n';
  providers.forEach((provider, index) => {
    menu += `${index + 1}. ${provider.name}\n`;
  });
  menu += '0. Back';
  
  return menu;
};

/**
 * Build account number input prompt
 * @returns {string} - Input prompt
 */
const buildAccountNumberPrompt = () => {
  return 'Enter your account number:';
};

/**
 * Build mobile money number input prompt
 * @returns {string} - Input prompt
 */
const buildMobileMoneyNumberPrompt = () => {
  return 'Enter your mobile money number:';
};

/**
 * Build amount input prompt for Flutterwave
 * @returns {string} - Input prompt
 */
const buildFlutterwaveAmountPrompt = () => {
  return 'Enter amount to withdraw:';
};

/**
 * Build withdrawal confirmation message
 * @param {number} amount - Amount
 * @param {string} currency - Currency
 * @param {string} method - Withdrawal method
 * @returns {string} - Confirmation message
 */
const buildWithdrawalConfirmation = (amount, currency, method) => {
  return `Confirm Withdrawal:\nAmount: ${currency}${amount}\nMethod: ${method}\n\n1. Confirm\n0. Cancel`;
};

/**
 * Build successful Flutterwave withdrawal message
 * @param {string} transferId - Transfer ID
 * @param {number} amount - Amount
 * @param {string} currency - Currency
 * @returns {string} - Success message
 */
const buildFlutterwaveWithdrawalSuccess = (transferId, amount, currency) => {
  return `Withdrawal Successful!\nAmount: ${currency}${amount}\nRef: ${transferId}\nCheck status with *123*4#`;
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
  validateSession,
  buildFlutterwavePaymentMethodMenu,
  buildCountrySelectionMenu,
  buildNigerianBankSelectionMenu,
  buildKenyanBankSelectionMenu,
  buildMobileMoneyProviderMenu,
  buildAccountNumberPrompt,
  buildMobileMoneyNumberPrompt,
  buildFlutterwaveAmountPrompt,
  buildWithdrawalConfirmation,
  buildFlutterwaveWithdrawalSuccess
};
