require('dotenv').config();
const africastalking = require('africastalking');
const logger = require('../utils/logger');

/**
 * SMS Service using Africa's Talking
 * Handles sending SMS notifications for:
 * - Registration confirmation
 * - Balance checks
 * - Money received
 * - Money sent
 * - Transaction confirmations
 */
class SmsService {
  constructor() {
    this.client = africastalking({
      apiKey: process.env.AFRICAS_TALKING_API_KEY,
      username: process.env.AFRICAS_TALKING_USERNAME
    });
    
    this.sms = this.client.SMS;
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // In sandbox mode, SMS only works with test numbers
    // In production, it works with all numbers
    logger.info(`SMS Service initialized (${this.isProduction ? 'PRODUCTION' : 'SANDBOX'} mode)`);
  }

  /**
   * Send SMS with error handling
   * @private
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Africa's Talking SMS accepts phone numbers WITH + prefix for international format
      // Make sure phone number starts with +
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      logger.info(`Sending SMS to ${formattedPhone}...`);
      
      // Build SMS options
      const smsOptions = {
        to: [formattedPhone],
        message: message
      };
      
      // Only add sender ID in production mode (sandbox doesn't support custom sender IDs)
      if (this.isProduction && process.env.SMS_SENDER_ID) {
        smsOptions.from = process.env.SMS_SENDER_ID;
      }
      
      const result = await this.sms.send(smsOptions);

      // Check if recipients array exists and has data
      const recipient = result?.SMSMessageData?.Recipients?.[0];
      
      if (recipient) {
        logger.info(`SMS sent successfully:`, {
          phone: formattedPhone,
          status: recipient.status,
          statusCode: recipient.statusCode,
          messageId: recipient.messageId
        });

        return {
          success: true,
          messageId: recipient.messageId,
          status: recipient.status,
          statusCode: recipient.statusCode
        };
      } else {
        // SMS was sent but response format unexpected
        logger.warn('SMS response format unexpected:', result);
        return {
          success: true,
          message: 'SMS sent but response format unexpected',
          rawResponse: result
        };
      }
    } catch (error) {
      logger.error(`SMS sending failed for ${phoneNumber}:`, error.message);
      
      // Don't throw error - SMS failure shouldn't break the main flow
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send registration confirmation SMS
   * @param {string} phoneNumber - User's phone number
   * @param {string} walletAddress - Generated wallet address
   */
  async sendRegistrationConfirmation(phoneNumber, walletAddress) {
    const message = `Welcome to KudiPay! 🎉\n\n` +
      `Your wallet has been created successfully.\n\n` +
      `Wallet Address:\n${walletAddress}\n\n` +
      `You can now:\n` +
      `- Send & receive money\n` +
      `- Convert currencies\n` +
      `- Check balance\n\n` +
      `Dial *384*73588# to get started!`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send balance check SMS
   * @param {string} phoneNumber - User's phone number
   * @param {string} walletAddress - User's wallet address
   * @param {Object} balances - Balance information
   */
  async sendBalanceNotification(phoneNumber, walletAddress, balances) {
    const ngnBalance = balances.ngn || 0;
    const usdBalance = balances.usd || 0;
    const ethBalance = balances.eth || 0;

    const message = `KudiPay Balance 💰\n\n` +
      `Wallet: ${walletAddress.substring(0, 10)}...${walletAddress.substring(38)}\n\n` +
      `NGN: ₦${parseFloat(ngnBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n` +
      `USD: $${parseFloat(usdBalance).toFixed(2)}\n` +
      `ETH: ${parseFloat(ethBalance).toFixed(6)}\n\n` +
      `Last checked: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send money received notification
   * @param {string} recipientPhone - Recipient's phone number
   * @param {string} senderPhone - Sender's phone number (optional)
   * @param {number} amount - Amount received
   * @param {string} currency - Currency code (NGN, USD, etc.)
   * @param {string} txHash - Transaction hash
   */
  async sendMoneyReceivedNotification(recipientPhone, senderPhone, amount, currency, txHash) {
    const sender = senderPhone || 'Someone';
    const formattedAmount = currency === 'NGN' 
      ? `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      : `${parseFloat(amount).toFixed(2)} ${currency}`;

    const message = `Money Received! 💸\n\n` +
      `You received ${formattedAmount}\n` +
      `From: ${sender}\n\n` +
      `Transaction: ${txHash ? txHash.substring(0, 10) + '...' : 'Pending'}\n\n` +
      `Check your balance:\n` +
      `Dial *384*73588# → Option 2`;

    return await this.sendSMS(recipientPhone, message);
  }

  /**
   * Send money sent confirmation
   * @param {string} senderPhone - Sender's phone number
   * @param {string} recipientPhone - Recipient's phone number
   * @param {number} amount - Amount sent
   * @param {string} currency - Currency code
   * @param {string} txHash - Transaction hash
   */
  async sendMoneySentConfirmation(senderPhone, recipientPhone, amount, currency, txHash) {
    const formattedAmount = currency === 'NGN' 
      ? `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      : `${parseFloat(amount).toFixed(2)} ${currency}`;

    const message = `Transfer Successful ✅\n\n` +
      `Amount: ${formattedAmount}\n` +
      `To: ${recipientPhone}\n\n` +
      `Transaction: ${txHash ? txHash.substring(0, 10) + '...' : 'Processing'}\n\n` +
      `Your new balance will be updated shortly.\n` +
      `Dial *384*73588# to check.`;

    return await this.sendSMS(senderPhone, message);
  }

  /**
   * Send currency conversion notification
   * @param {string} phoneNumber - User's phone number
   * @param {number} fromAmount - Original amount
   * @param {string} fromCurrency - Original currency
   * @param {number} toAmount - Converted amount
   * @param {string} toCurrency - Target currency
   * @param {number} rate - Exchange rate used
   */
  async sendConversionNotification(phoneNumber, fromAmount, fromCurrency, toAmount, toCurrency, rate) {
    const message = `Currency Converted 🔄\n\n` +
      `From: ${fromAmount} ${fromCurrency}\n` +
      `To: ${toAmount} ${toCurrency}\n\n` +
      `Rate: 1 ${fromCurrency} = ${rate} ${toCurrency}\n\n` +
      `Conversion completed successfully!`;

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send withdrawal notification
   * @param {string} phoneNumber - User's phone number
   * @param {number} amount - Withdrawal amount
   * @param {string} currency - Currency code
   * @param {string} status - Withdrawal status (processing, completed, failed)
   */
  async sendWithdrawalNotification(phoneNumber, amount, currency, status) {
    const formattedAmount = currency === 'NGN' 
      ? `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
      : `${parseFloat(amount).toFixed(2)} ${currency}`;

    let message = '';
    
    if (status === 'processing') {
      message = `Withdrawal Processing ⏳\n\n` +
        `Amount: ${formattedAmount}\n\n` +
        `Your withdrawal is being processed.\n` +
        `You'll receive confirmation shortly.`;
    } else if (status === 'completed') {
      message = `Withdrawal Completed ✅\n\n` +
        `Amount: ${formattedAmount}\n\n` +
        `Funds have been sent to your bank account.\n` +
        `Check your bank for confirmation.`;
    } else if (status === 'failed') {
      message = `Withdrawal Failed ❌\n\n` +
        `Amount: ${formattedAmount}\n\n` +
        `Your withdrawal could not be processed.\n` +
        `Funds have been returned to your wallet.`;
    }

    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send generic notification
   * @param {string} phoneNumber - User's phone number
   * @param {string} message - Message to send
   */
  async sendNotification(phoneNumber, message) {
    return await this.sendSMS(phoneNumber, message);
  }
}

module.exports = new SmsService();
