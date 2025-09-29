const axios = require('axios');
const logger = require('../utils/logger');

class FxService {
  constructor() {
    this.rates = {
      USDT_NGN: 1500, // Mock rate: 1 USDT = 1500 NGN
      ETH_NGN: 2500000, // Mock rate: 1 ETH = 2,500,000 NGN
      ETH_USD: 1667, // Mock rate: 1 ETH = 1667 USD
    };
    
    // Update rates every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateRates();
    }, 5 * 60 * 1000);
  }

  /**
   * Get current USDT to NGN rate
   */
  async getUSDTToNGNRate() {
    try {
      // In production, fetch from real API
      // const response = await axios.get('https://api.coinmarketcap.com/v1/ticker/tether/');
      return this.rates.USDT_NGN;
    } catch (error) {
      logger.error('Get USDT rate error:', error);
      return this.rates.USDT_NGN; // Fallback to cached rate
    }
  }

  /**
   * Get current ETH to NGN rate
   */
  async getETHToNGNRate() {
    try {
      // In production, fetch from real API
      return this.rates.ETH_NGN;
    } catch (error) {
      logger.error('Get ETH rate error:', error);
      return this.rates.ETH_NGN; // Fallback to cached rate
    }
  }

  /**
   * Get ETH to USD rate
   */
  async getETHToUSDRate() {
    try {
      return this.rates.ETH_USD;
    } catch (error) {
      logger.error('Get ETH/USD rate error:', error);
      return this.rates.ETH_USD;
    }
  }

  /**
   * Convert USDT amount to NGN
   */
  async convertToNGN(usdtAmount) {
    const rate = await this.getUSDTToNGNRate();
    return parseFloat(usdtAmount) * rate;
  }

  /**
   * Convert NGN amount to USDT
   */
  async convertToUSDT(ngnAmount) {
    const rate = await this.getUSDTToNGNRate();
    return ngnAmount / rate;
  }

  /**
   * Convert ETH amount to NGN
   */
  async convertETHToNGN(ethAmount) {
    const rate = await this.getETHToNGNRate();
    return parseFloat(ethAmount) * rate;
  }

  /**
   * Get all supported currency rates
   */
  async getAllRates() {
    return {
      USDT_NGN: await this.getUSDTToNGNRate(),
      ETH_NGN: await this.getETHToNGNRate(),
      ETH_USD: await this.getETHToUSDRate(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(amount, fromCurrency, toCurrency) {
    try {
      let result;
      
      if (fromCurrency === 'USDT' && toCurrency === 'NGN') {
        result = await this.convertToNGN(amount);
      } else if (fromCurrency === 'NGN' && toCurrency === 'USDT') {
        result = await this.convertToUSDT(amount);
      } else if (fromCurrency === 'ETH' && toCurrency === 'NGN') {
        result = await this.convertETHToNGN(amount);
      } else if (fromCurrency === 'ETH' && toCurrency === 'USD') {
        const rate = await this.getETHToUSDRate();
        result = parseFloat(amount) * rate;
      } else {
        throw new Error(`Conversion from ${fromCurrency} to ${toCurrency} not supported`);
      }
      
      return {
        originalAmount: amount,
        convertedAmount: result,
        fromCurrency,
        toCurrency,
        rate: result / amount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Convert amount error:', error);
      throw error;
    }
  }

  /**
   * Update exchange rates (called periodically)
   */
  async updateRates() {
    try {
      // In production, fetch from multiple APIs for redundancy
      // For now, simulate small fluctuations
      this.rates.USDT_NGN += (Math.random() - 0.5) * 20; // ±10 NGN fluctuation
      this.rates.ETH_NGN += (Math.random() - 0.5) * 100000; // ±50k NGN fluctuation
      this.rates.ETH_USD += (Math.random() - 0.5) * 100; // ±50 USD fluctuation
      
      logger.info('Exchange rates updated', this.rates);
    } catch (error) {
      logger.error('Update rates error:', error);
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return {
      crypto: ['USDT', 'ETH'],
      fiat: ['NGN', 'USD'],
      pairs: [
        'USDT/NGN',
        'ETH/NGN', 
        'ETH/USD',
        'NGN/USDT'
      ]
    };
  }

  /**
   * Calculate transaction fees
   */
  calculateFees(amount, fromCurrency, toCurrency) {
    const baseServiceFee = 0.02; // 2% service fee
    const networkFee = fromCurrency === 'ETH' ? 0.001 : 0; // ETH gas fee
    
    return {
      serviceFee: amount * baseServiceFee,
      networkFee: networkFee,
      totalFee: (amount * baseServiceFee) + networkFee
    };
  }
}

module.exports = new FxService();
