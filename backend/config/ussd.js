const ussdConfig = {
  africasTalking: {
    username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    shortCode: process.env.USSD_SHORT_CODE || '*123#',
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  menu: {
    mainMenu: {
      '1': 'Register Phone Number',
      '2': 'Check Balance', 
      '3': 'Withdraw Money',
      '4': 'Transaction History',
      '5': 'Help & Support',
      '0': 'Exit'
    },
    
    withdrawMenu: {
      '1': 'Bank Account',
      '2': 'Mobile Money',
      '3': 'Cash Agent',
      '0': 'Back to Main Menu'
    }
  },
  
  messages: {
    welcome: 'Welcome to KudiPay! Choose an option:',
    invalidOption: 'Invalid option. Please try again.',
    registration: {
      success: 'Phone number registered successfully! Your wallet is ready.',
      duplicate: 'Phone number already registered.',
      failed: 'Registration failed. Please try again.'
    },
    balance: {
      display: 'Your balance is: ₦{amount}',
      error: 'Unable to fetch balance. Please try again.'
    },
    withdrawal: {
      enterAmount: 'Enter amount to withdraw (NGN):',
      selectMethod: 'Select withdrawal method:',
      success: 'Withdrawal request submitted. You will receive ₦{amount} in your {method}.',
      insufficient: 'Insufficient balance.',
      failed: 'Withdrawal failed. Please try again.'
    }
  }
};

module.exports = ussdConfig;
