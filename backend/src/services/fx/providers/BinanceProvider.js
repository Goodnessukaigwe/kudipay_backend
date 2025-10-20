/**
 * Binance API Provider for real-time exchange rates
 * Uses Binance Spot API for cryptocurrency prices
 * 
 * API Documentation: https://binance-docs.github.io/apidocs/spot/en/
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

class BinanceProvider {
  constructor() {
    this.baseUrl = process.env.BINANCE_API_URL || 'https://api.binance.com';
    this.apiKey = process.env.BINANCE_API_KEY; // Optional for public endpoints
    this.timeout = 10000; // 10 seconds
    
    // Rate limit tracker (Binance has weight-based limits)
    this.requestWeight = 0;
    this.weightResetTime = Date.now() + 60000;
    
    // Supported symbols on Binance
    this.symbolMap = {
      'USDC': 'USDCUSDT',
      'USDT': 'USDTUSDT',
      'ETH': 'ETHUSDT',
      'BTC': 'BTCUSDT'
    };
  }

  /**
   * Get exchange rate from Binance
   * @param {string} fromCurrency - Base currency
   * @param {string} toCurrency - Quote currency
   * @returns {Promise<number>} Exchange rate
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      // Handle USD/NGN fiat-to-fiat conversion FIRST (before crypto checks)
      if (fromCurrency === 'USD' && toCurrency === 'NGN') {
        return await this.getUsdToNgnRate();
      }
      
      // Handle NGN/USD reverse conversion
      if (fromCurrency === 'NGN' && toCurrency === 'USD') {
        const usdToNgnRate = await this.getUsdToNgnRate();
        return 1 / usdToNgnRate;
      }
      
      // Handle stablecoin to USD (always 1:1)
      if (this.isStablecoin(fromCurrency) && toCurrency === 'USD') {
        return 1.0;
      }
      
      // Get crypto to USD rate
      const cryptoToUsdRate = await this.getCryptoToUsdRate(fromCurrency);
      
      // If target is USD, return directly
      if (toCurrency === 'USD') {
        return cryptoToUsdRate;
      }
      
      // If target is NGN, convert via USD
      if (toCurrency === 'NGN') {
        const usdToNgnRate = await this.getUsdToNgnRate();
        return cryptoToUsdRate * usdToNgnRate;
      }
      
      // If converting between cryptos
      if (this.isCrypto(toCurrency)) {
        const targetToUsdRate = await this.getCryptoToUsdRate(toCurrency);
        return cryptoToUsdRate / targetToUsdRate;
      }
      
      throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
      
    } catch (error) {
      logger.error('BinanceProvider.getRate error:', {
        error: error.message,
        pair: `${fromCurrency}/${toCurrency}`
      });
      throw error;
    }
  }

  /**
   * Get crypto to USD rate from Binance
   */
  async getCryptoToUsdRate(currency) {
    // Stablecoins are always 1:1 with USD
    if (this.isStablecoin(currency)) {
      return 1.0;
    }
    
    const symbol = this.symbolMap[currency];
    if (!symbol) {
      throw new Error(`Currency ${currency} not supported by Binance provider`);
    }
    
    try {
      // Use ticker/price endpoint (weight: 2)
      const response = await axios.get(`${this.baseUrl}/api/v3/ticker/price`, {
        params: { symbol },
        timeout: this.timeout,
        headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {}
      });
      
      this.updateRequestWeight(2);
      
      const price = parseFloat(response.data.price);
      
      if (!price || price <= 0) {
        throw new Error('Invalid price received from Binance');
      }
      
      logger.debug(`Binance rate fetched: ${currency}/USD = ${price}`);
      
      return price;
      
    } catch (error) {
      if (error.response) {
        logger.error('Binance API error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw new Error(`Binance API request failed: ${error.message}`);
    }
  }

  /**
   * Get USD to NGN rate
   * Binance doesn't directly support NGN, so we use a composite rate
   * or fallback to external API
   */
  async getUsdToNgnRate() {
    try {
      // Use open.er-api.com which provides free NGN rates without API key
      const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
        timeout: this.timeout
      });
      
      // Extract NGN rate from response
      const ngnRate = response.data.rates.NGN || 1550; // Fallback to ~1550 NGN/USD
      
      logger.debug(`USD/NGN rate: ${ngnRate}`);
      
      return ngnRate;
      
    } catch (error) {
      logger.warn('Failed to fetch USD/NGN rate, using fallback:', error.message);
      // Fallback to reasonable estimate (update this regularly)
      return parseFloat(process.env.FALLBACK_USD_NGN_RATE || '1550');
    }
  }

  /**
   * Get 24h average price for more stable rates
   */
  async get24hAvgPrice(currency) {
    const symbol = this.symbolMap[currency];
    if (!symbol) {
      throw new Error(`Currency ${currency} not supported`);
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/avgPrice`, {
        params: { symbol },
        timeout: this.timeout,
        headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {}
      });
      
      this.updateRequestWeight(2);
      
      return parseFloat(response.data.price);
      
    } catch (error) {
      throw new Error(`Failed to fetch 24h avg price: ${error.message}`);
    }
  }

  /**
   * Check if currency is a stablecoin
   */
  isStablecoin(currency) {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];
    return stablecoins.includes(currency.toUpperCase());
  }

  /**
   * Check if currency is a cryptocurrency
   */
  isCrypto(currency) {
    const cryptos = ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'BUSD'];
    return cryptos.includes(currency.toUpperCase());
  }

  /**
   * Update request weight for rate limiting
   */
  updateRequestWeight(weight) {
    // Reset weight if minute has passed
    if (Date.now() > this.weightResetTime) {
      this.requestWeight = 0;
      this.weightResetTime = Date.now() + 60000;
    }
    
    this.requestWeight += weight;
    
    // Binance weight limit is 1200 per minute for most endpoints
    if (this.requestWeight > 1000) {
      logger.warn('Approaching Binance rate limit', {
        currentWeight: this.requestWeight,
        limit: 1200
      });
    }
  }

  /**
   * Get provider health status
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v3/ping`, {
        timeout: 5000
      });
      return { status: 'healthy', latency: response.headers['x-mbx-used-weight'] };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = BinanceProvider;
