/**
 * KudiPay FX Engine - Production Grade
 * Handles real-time exchange rates with multiple data sources
 * Implements circuit breaker pattern and rate caching
 * 
 * @author KudiPay Engineering Team
 * @date October 2025
 */

const logger = require('../../utils/logger');
const RateCache = require('./RateCache');
const BinanceProvider = require('./providers/BinanceProvider');
const ChainlinkProvider = require('./providers/ChainlinkProvider');
const FallbackProvider = require('./providers/FallbackProvider');
const ConversionLogger = require('./ConversionLogger');
const ProfitCalculator = require('./ProfitCalculator');

class FxEngine {
  constructor() {
    this.providers = {
      primary: new BinanceProvider(),
      secondary: new ChainlinkProvider(),
      fallback: new FallbackProvider()
    };
    
    this.cache = new RateCache();
    this.conversionLogger = new ConversionLogger();
    this.profitCalculator = new ProfitCalculator();
    
    // Configuration
    this.config = {
      // Markup/Spread configuration for profit (1-3%)
      markup: {
        USDC_NGN: parseFloat(process.env.FX_MARKUP_USDC_NGN || '0.02'), // 2% default
        USDT_NGN: parseFloat(process.env.FX_MARKUP_USDT_NGN || '0.02'),
        ETH_NGN: parseFloat(process.env.FX_MARKUP_ETH_NGN || '0.025'), // 2.5% for volatile assets
        BTC_NGN: parseFloat(process.env.FX_MARKUP_BTC_NGN || '0.025'),
        
        // Dynamic markup based on volatility
        volatilityAdjustment: true,
        
        // Minimum and maximum markup bounds
        minMarkup: 0.01, // 1%
        maxMarkup: 0.05  // 5%
      },
      
      // Rate freshness thresholds
      maxRateAge: {
        stablecoins: 5 * 60 * 1000,  // 5 minutes for USDC/USDT
        crypto: 2 * 60 * 1000,        // 2 minutes for ETH/BTC
        fiat: 10 * 60 * 1000          // 10 minutes for NGN/USD
      },
      
      // Circuit breaker settings
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeout: 60000, // 1 minute
        halfOpenRequests: 1
      },
      
      // Rate deviation tolerance (for anomaly detection)
      maxDeviationPercent: 5, // Alert if rate deviates > 5% from average
      
      // Supported pairs
      supportedPairs: [
        'USDC/NGN', 'USDT/NGN', 'ETH/NGN', 'BTC/NGN',
        'USDC/USD', 'ETH/USD', 'BTC/USD',
        'NGN/USD', 'USD/NGN'
      ]
    };
    
    // Provider health tracking
    this.providerHealth = {
      primary: { failures: 0, lastFailure: null, isOpen: false },
      secondary: { failures: 0, lastFailure: null, isOpen: false },
      fallback: { failures: 0, lastFailure: null, isOpen: false }
    };
    
    // Initialize rate fetching
    this.initializeRateFetching();
    
    logger.info('FxEngine initialized with production configuration', {
      markup: this.config.markup,
      supportedPairs: this.config.supportedPairs.length
    });
  }

  /**
   * Initialize automatic rate fetching
   */
  initializeRateFetching() {
    // Fetch stablecoin rates every 3 minutes
    this.stablecoinInterval = setInterval(async () => {
      await this.fetchAndCacheStablecoinRates();
    }, 3 * 60 * 1000);
    
    // Fetch crypto rates every 1 minute
    this.cryptoInterval = setInterval(async () => {
      await this.fetchAndCacheCryptoRates();
    }, 60 * 1000);
    
    // Fetch fiat rates every 5 minutes
    this.fiatInterval = setInterval(async () => {
      await this.fetchAndCacheFiatRates();
    }, 5 * 60 * 1000);
    
    // Initial fetch
    this.fetchAndCacheStablecoinRates();
    this.fetchAndCacheCryptoRates();
    this.fetchAndCacheFiatRates();
    
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkProviderHealth();
    }, 30 * 1000);
  }

  /**
   * Get conversion rate with markup applied
   * @param {string} fromCurrency - Source currency (e.g., 'USDC')
   * @param {string} toCurrency - Target currency (e.g., 'NGN')
   * @param {number} amount - Amount to convert (optional, for dynamic markup)
   * @returns {Promise<Object>} Rate information with markup
   */
  async getRate(fromCurrency, toCurrency, amount = null) {
    try {
      const pair = `${fromCurrency}/${toCurrency}`;
      
      // Validate pair
      if (!this.config.supportedPairs.includes(pair)) {
        throw new Error(`Currency pair ${pair} is not supported`);
      }
      
      // Check cache first
      const cachedRate = this.cache.get(pair);
      if (cachedRate && this.isRateFresh(cachedRate, fromCurrency)) {
        logger.debug(`Cache hit for ${pair}`);
        return this.applyMarkup(cachedRate, fromCurrency, toCurrency, amount);
      }
      
      // Fetch fresh rate with fallback chain
      const baseRate = await this.fetchRateWithFallback(fromCurrency, toCurrency);
      
      // Cache the base rate
      this.cache.set(pair, baseRate);
      
      // Apply markup and return
      return this.applyMarkup(baseRate, fromCurrency, toCurrency, amount);
      
    } catch (error) {
      logger.error('FxEngine.getRate error:', {
        error: error.message,
        pair: `${fromCurrency}/${toCurrency}`,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Convert amount with markup and logging
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {Object} metadata - Additional metadata for logging
   * @returns {Promise<Object>} Conversion result
   */
  async convertAmount(amount, fromCurrency, toCurrency, metadata = {}) {
    try {
      // Validation
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      // Get rate with markup
      const rateInfo = await this.getRate(fromCurrency, toCurrency, amount);
      
      // Calculate converted amount
      const convertedAmount = amount * rateInfo.rateWithMarkup;
      
      // Calculate profit
      const profit = this.profitCalculator.calculateProfit(
        amount,
        rateInfo.baseRate,
        rateInfo.rateWithMarkup,
        fromCurrency,
        toCurrency
      );
      
      // Build result
      const result = {
        originalAmount: amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fromCurrency,
        toCurrency,
        baseRate: rateInfo.baseRate,
        rateWithMarkup: rateInfo.rateWithMarkup,
        markupPercent: rateInfo.markupPercent,
        markupAmount: parseFloat((convertedAmount - (amount * rateInfo.baseRate)).toFixed(2)),
        profit: profit,
        provider: rateInfo.provider,
        timestamp: new Date().toISOString(),
        conversionId: this.generateConversionId()
      };
      
      // Log conversion for analytics
      await this.conversionLogger.logConversion(result, metadata);
      
      logger.info('Conversion completed', {
        conversionId: result.conversionId,
        pair: `${fromCurrency}/${toCurrency}`,
        amount,
        profit: profit.totalProfit
      });
      
      return result;
      
    } catch (error) {
      logger.error('FxEngine.convertAmount error:', {
        error: error.message,
        amount,
        pair: `${fromCurrency}/${toCurrency}`
      });
      throw error;
    }
  }

  /**
   * Fetch rate with provider fallback chain
   */
  async fetchRateWithFallback(fromCurrency, toCurrency) {
    const providers = ['primary', 'secondary', 'fallback'];
    
    for (const providerName of providers) {
      // Skip if circuit breaker is open
      if (this.isCircuitOpen(providerName)) {
        logger.warn(`Circuit breaker open for ${providerName}, skipping`);
        continue;
      }
      
      try {
        const provider = this.providers[providerName];
        const rate = await provider.getRate(fromCurrency, toCurrency);
        
        // Validate rate
        if (this.isValidRate(rate)) {
          // Reset failure count on success
          this.providerHealth[providerName].failures = 0;
          
          return {
            baseRate: rate,
            provider: providerName,
            timestamp: Date.now()
          };
        }
        
      } catch (error) {
        logger.error(`Provider ${providerName} failed:`, error.message);
        this.recordProviderFailure(providerName);
      }
    }
    
    throw new Error('All FX providers failed. Unable to fetch rate.');
  }

  /**
   * Apply markup/spread to base rate
   */
  applyMarkup(rateInfo, fromCurrency, toCurrency, amount = null) {
    const pair = `${fromCurrency}_${toCurrency}`;
    let markupPercent = this.config.markup[pair] || 0.02; // Default 2%
    
    // Dynamic markup based on transaction size (volume discount)
    if (amount && amount > 10000) {
      markupPercent *= 0.8; // 20% discount for large transactions
    } else if (amount && amount > 50000) {
      markupPercent *= 0.6; // 40% discount for very large transactions
    }
    
    // Apply volatility adjustment if enabled
    if (this.config.markup.volatilityAdjustment) {
      const volatilityFactor = this.calculateVolatilityFactor(fromCurrency);
      markupPercent += volatilityFactor;
    }
    
    // Enforce bounds
    markupPercent = Math.max(this.config.markup.minMarkup, 
                            Math.min(markupPercent, this.config.markup.maxMarkup));
    
    const rateWithMarkup = rateInfo.baseRate * (1 + markupPercent);
    
    return {
      ...rateInfo,
      rateWithMarkup,
      markupPercent: parseFloat((markupPercent * 100).toFixed(2)),
      markupApplied: true
    };
  }

  /**
   * Calculate volatility factor for dynamic markup
   */
  calculateVolatilityFactor(currency) {
    // Stablecoins have low volatility
    if (['USDC', 'USDT', 'DAI'].includes(currency)) {
      return 0;
    }
    
    // Get recent rate history and calculate standard deviation
    // Simplified: In production, use actual historical data
    const volatilityMap = {
      'ETH': 0.005,  // +0.5% for moderate volatility
      'BTC': 0.004,  // +0.4% for moderate volatility
      'default': 0.003
    };
    
    return volatilityMap[currency] || volatilityMap.default;
  }

  /**
   * Fetch and cache stablecoin rates
   */
  async fetchAndCacheStablecoinRates() {
    const stablecoins = ['USDC', 'USDT'];
    const targets = ['NGN', 'USD'];
    
    for (const base of stablecoins) {
      for (const quote of targets) {
        if (base === quote) continue;
        try {
          const rate = await this.fetchRateWithFallback(base, quote);
          this.cache.set(`${base}/${quote}`, rate);
        } catch (error) {
          logger.error(`Failed to fetch ${base}/${quote}:`, error.message);
        }
      }
    }
  }

  /**
   * Fetch and cache crypto rates
   */
  async fetchAndCacheCryptoRates() {
    const cryptos = ['ETH', 'BTC'];
    const targets = ['NGN', 'USD'];
    
    for (const base of cryptos) {
      for (const quote of targets) {
        try {
          const rate = await this.fetchRateWithFallback(base, quote);
          this.cache.set(`${base}/${quote}`, rate);
        } catch (error) {
          logger.error(`Failed to fetch ${base}/${quote}:`, error.message);
        }
      }
    }
  }

  /**
   * Fetch and cache fiat rates
   */
  async fetchAndCacheFiatRates() {
    try {
      const rate = await this.fetchRateWithFallback('USD', 'NGN');
      this.cache.set('USD/NGN', rate);
      
      // Calculate reverse rate
      const reverseRate = {
        baseRate: 1 / rate.baseRate,
        provider: rate.provider,
        timestamp: rate.timestamp
      };
      this.cache.set('NGN/USD', reverseRate);
    } catch (error) {
      logger.error('Failed to fetch fiat rates:', error.message);
    }
  }

  /**
   * Check if rate is still fresh
   */
  isRateFresh(rateInfo, currency) {
    const age = Date.now() - rateInfo.timestamp;
    
    if (['USDC', 'USDT', 'DAI'].includes(currency)) {
      return age < this.config.maxRateAge.stablecoins;
    } else if (['ETH', 'BTC'].includes(currency)) {
      return age < this.config.maxRateAge.crypto;
    } else {
      return age < this.config.maxRateAge.fiat;
    }
  }

  /**
   * Validate rate for anomalies
   */
  isValidRate(rate) {
    if (!rate || rate <= 0) {
      return false;
    }
    
    // Add more sophisticated validation
    // e.g., compare with historical average, check for outliers
    
    return true;
  }

  /**
   * Circuit breaker - check if circuit is open
   */
  isCircuitOpen(providerName) {
    const health = this.providerHealth[providerName];
    
    if (!health.isOpen) return false;
    
    // Check if we should try to close the circuit (half-open state)
    const timeSinceLastFailure = Date.now() - health.lastFailure;
    if (timeSinceLastFailure > this.config.circuitBreaker.resetTimeout) {
      health.isOpen = false;
      health.failures = 0;
      logger.info(`Circuit breaker closed for ${providerName}`);
      return false;
    }
    
    return true;
  }

  /**
   * Record provider failure for circuit breaker
   */
  recordProviderFailure(providerName) {
    const health = this.providerHealth[providerName];
    health.failures++;
    health.lastFailure = Date.now();
    
    if (health.failures >= this.config.circuitBreaker.failureThreshold) {
      health.isOpen = true;
      logger.error(`Circuit breaker opened for ${providerName} after ${health.failures} failures`);
    }
  }

  /**
   * Check health of all providers
   */
  checkProviderHealth() {
    const status = {
      timestamp: new Date().toISOString(),
      providers: {}
    };
    
    for (const [name, health] of Object.entries(this.providerHealth)) {
      status.providers[name] = {
        status: health.isOpen ? 'CIRCUIT_OPEN' : 'HEALTHY',
        failures: health.failures,
        lastFailure: health.lastFailure
      };
    }
    
    // Log only if there are issues
    const hasIssues = Object.values(status.providers).some(p => p.status !== 'HEALTHY');
    if (hasIssues) {
      logger.warn('Provider health check:', status);
    }
  }

  /**
   * Generate unique conversion ID
   */
  generateConversionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `CNV_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Get all supported pairs with current rates
   */
  async getAllRates() {
    const rates = {};
    
    for (const pair of this.config.supportedPairs) {
      const [from, to] = pair.split('/');
      try {
        const rateInfo = await this.getRate(from, to);
        rates[pair] = {
          baseRate: rateInfo.baseRate,
          rateWithMarkup: rateInfo.rateWithMarkup,
          markupPercent: rateInfo.markupPercent,
          provider: rateInfo.provider,
          lastUpdated: new Date(rateInfo.timestamp).toISOString()
        };
      } catch (error) {
        logger.error(`Failed to get rate for ${pair}:`, error.message);
        rates[pair] = { error: 'Rate unavailable' };
      }
    }
    
    return {
      rates,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get profit statistics
   */
  async getProfitStats(timeframe = '24h') {
    return await this.conversionLogger.getProfitStats(timeframe);
  }

  /**
   * Cleanup intervals on shutdown
   */
  shutdown() {
    clearInterval(this.stablecoinInterval);
    clearInterval(this.cryptoInterval);
    clearInterval(this.fiatInterval);
    clearInterval(this.healthCheckInterval);
    logger.info('FxEngine shutdown complete');
  }
}

module.exports = FxEngine;
