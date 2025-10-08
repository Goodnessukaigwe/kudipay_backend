/**
 * Fallback Provider for exchange rates
 * Uses multiple public APIs as last resort when primary providers fail
 */

const axios = require('axios');
const logger = require('../../../utils/logger');

class FallbackProvider {
  constructor() {
    this.timeout = 8000;
    
    // Multiple fallback APIs
    this.fallbackApis = [
      {
        name: 'CoinGecko',
        cryptoUrl: 'https://api.coingecko.com/api/v3/simple/price',
        fiatUrl: 'https://api.coingecko.com/api/v3/exchange_rates'
      },
      {
        name: 'CryptoCompare',
        baseUrl: 'https://min-api.cryptocompare.com/data/price',
        apiKey: process.env.CRYPTOCOMPARE_API_KEY
      },
      {
        name: 'ExchangeRate-API',
        baseUrl: 'https://api.exchangerate-api.com/v4/latest'
      }
    ];
  }

  /**
   * Get exchange rate using fallback providers
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      // Try CoinGecko first
      try {
        return await this.getRateFromCoinGecko(fromCurrency, toCurrency);
      } catch (error) {
        logger.warn('CoinGecko failed:', error.message);
      }
      
      // Try CryptoCompare second
      try {
        return await this.getRateFromCryptoCompare(fromCurrency, toCurrency);
      } catch (error) {
        logger.warn('CryptoCompare failed:', error.message);
      }
      
      // Try ExchangeRate-API for fiat
      if (toCurrency === 'NGN' || fromCurrency === 'NGN') {
        try {
          return await this.getRateFromExchangeRateApi(fromCurrency, toCurrency);
        } catch (error) {
          logger.warn('ExchangeRate-API failed:', error.message);
        }
      }
      
      // All fallbacks failed
      throw new Error('All fallback providers failed');
      
    } catch (error) {
      logger.error('FallbackProvider.getRate error:', {
        error: error.message,
        pair: `${fromCurrency}/${toCurrency}`
      });
      throw error;
    }
  }

  /**
   * Get rate from CoinGecko API
   * Free tier: 10-50 calls/minute
   */
  async getRateFromCoinGecko(fromCurrency, toCurrency) {
    const coinMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai'
    };
    
    const currencyMap = {
      'USD': 'usd',
      'NGN': 'ngn',
      'EUR': 'eur',
      'GBP': 'gbp'
    };
    
    const coinId = coinMap[fromCurrency.toUpperCase()];
    const vsCurrency = currencyMap[toCurrency.toUpperCase()];
    
    if (!coinId) {
      throw new Error(`Currency ${fromCurrency} not supported by CoinGecko`);
    }
    
    if (!vsCurrency) {
      throw new Error(`Target currency ${toCurrency} not supported by CoinGecko`);
    }
    
    try {
      const response = await axios.get(this.fallbackApis[0].cryptoUrl, {
        params: {
          ids: coinId,
          vs_currencies: vsCurrency
        },
        timeout: this.timeout
      });
      
      const rate = response.data[coinId]?.[vsCurrency];
      
      if (!rate || rate <= 0) {
        throw new Error('Invalid rate from CoinGecko');
      }
      
      logger.debug(`CoinGecko rate: ${fromCurrency}/${toCurrency} = ${rate}`);
      
      return rate;
      
    } catch (error) {
      throw new Error(`CoinGecko API error: ${error.message}`);
    }
  }

  /**
   * Get rate from CryptoCompare API
   * Free tier: 100,000 calls/month
   */
  async getRateFromCryptoCompare(fromCurrency, toCurrency) {
    const api = this.fallbackApis[1];
    
    try {
      const params = {
        fsym: fromCurrency.toUpperCase(),
        tsyms: toCurrency.toUpperCase()
      };
      
      if (api.apiKey) {
        params.api_key = api.apiKey;
      }
      
      const response = await axios.get(api.baseUrl, {
        params,
        timeout: this.timeout
      });
      
      const rate = response.data[toCurrency.toUpperCase()];
      
      if (!rate || rate <= 0) {
        throw new Error('Invalid rate from CryptoCompare');
      }
      
      logger.debug(`CryptoCompare rate: ${fromCurrency}/${toCurrency} = ${rate}`);
      
      return rate;
      
    } catch (error) {
      throw new Error(`CryptoCompare API error: ${error.message}`);
    }
  }

  /**
   * Get fiat exchange rate from ExchangeRate-API
   * Supports NGN and many other currencies
   */
  async getRateFromExchangeRateApi(fromCurrency, toCurrency) {
    const api = this.fallbackApis[2];
    
    try {
      // ExchangeRate-API uses base currency in URL
      const baseCurrency = this.isCrypto(fromCurrency) ? 'USD' : fromCurrency;
      
      const response = await axios.get(`${api.baseUrl}/${baseCurrency}`, {
        timeout: this.timeout
      });
      
      const rates = response.data.rates;
      
      // If from is crypto, we need a two-step conversion
      if (this.isCrypto(fromCurrency)) {
        // Get crypto/USD from another source
        const cryptoToUsd = await this.getRateFromCoinGecko(fromCurrency, 'USD');
        const usdToTarget = rates[toCurrency.toUpperCase()];
        
        if (!usdToTarget) {
          throw new Error(`Currency ${toCurrency} not found in rates`);
        }
        
        return cryptoToUsd * usdToTarget;
      }
      
      const rate = rates[toCurrency.toUpperCase()];
      
      if (!rate || rate <= 0) {
        throw new Error('Invalid rate from ExchangeRate-API');
      }
      
      logger.debug(`ExchangeRate-API rate: ${fromCurrency}/${toCurrency} = ${rate}`);
      
      return rate;
      
    } catch (error) {
      throw new Error(`ExchangeRate-API error: ${error.message}`);
    }
  }

  /**
   * Get Nigerian Naira (NGN) rates from local sources
   * Uses Nigerian financial institutions' public APIs
   */
  async getNgnRatesFromLocalSources() {
    // Option 1: CBN (Central Bank of Nigeria)
    // https://www.cbn.gov.ng/rates/
    
    // Option 2: Flutterwave
    // https://api.flutterwave.com/v3/transfers/rates
    
    // Option 3: Paystack
    // Custom endpoint for NGN rates
    
    // For now, return estimated rate
    return {
      USD_NGN: parseFloat(process.env.FALLBACK_USD_NGN_RATE || '1550'),
      source: 'fallback_config'
    };
  }

  /**
   * Check if currency is cryptocurrency
   */
  isCrypto(currency) {
    const cryptos = ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'BUSD'];
    return cryptos.includes(currency.toUpperCase());
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Try to fetch a simple rate
      const rate = await this.getRateFromCoinGecko('ETH', 'USD');
      return {
        status: 'healthy',
        rate,
        provider: 'CoinGecko'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = FallbackProvider;
