/**
 * Chainlink Price Feed Provider
 * Uses Chainlink decentralized oracle network for on-chain price data
 * 
 * Documentation: https://docs.chain.link/data-feeds/price-feeds
 * Base Network Feeds: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */

const { ethers } = require('ethers');
const logger = require('../../../utils/logger');

// Chainlink Price Feed ABI (minimal interface)
const PRICE_FEED_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
  'function description() external view returns (string memory)'
];

class ChainlinkProvider {
  constructor() {
    // Connect to Base network
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    
    // Chainlink Price Feed addresses on Base Mainnet
    // Source: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
    this.priceFeeds = {
      // Crypto pairs
      'ETH/USD': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // Base Mainnet
      'BTC/USD': '0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F',
      'USDC/USD': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
      
      // Note: For NGN pairs, we'll need to use USD as intermediary
      // Chainlink doesn't have direct crypto/NGN feeds yet
    };
    
    // Cache for contract instances
    this.contracts = {};
    
    // Stale price threshold (2 hours)
    this.stalePriceThreshold = 2 * 60 * 60 * 1000;
  }

  /**
   * Get exchange rate from Chainlink
   * @param {string} fromCurrency - Base currency
   * @param {string} toCurrency - Quote currency
   * @returns {Promise<number>} Exchange rate
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      // Handle stablecoin to USD
      if (this.isStablecoin(fromCurrency) && toCurrency === 'USD') {
        return 1.0;
      }
      
      // Get crypto to USD rate from Chainlink
      const cryptoToUsdRate = await this.getPriceFromFeed(fromCurrency, 'USD');
      
      // If target is USD, return directly
      if (toCurrency === 'USD') {
        return cryptoToUsdRate;
      }
      
      // If target is NGN, we need USD/NGN rate
      // Chainlink doesn't have this, so we'll use a fallback
      if (toCurrency === 'NGN') {
        const usdToNgnRate = await this.getUsdToNgnRate();
        return cryptoToUsdRate * usdToNgnRate;
      }
      
      // For crypto-to-crypto conversions
      if (this.isCrypto(toCurrency)) {
        const targetToUsdRate = await this.getPriceFromFeed(toCurrency, 'USD');
        return cryptoToUsdRate / targetToUsdRate;
      }
      
      throw new Error(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`);
      
    } catch (error) {
      logger.error('ChainlinkProvider.getRate error:', {
        error: error.message,
        pair: `${fromCurrency}/${toCurrency}`
      });
      throw error;
    }
  }

  /**
   * Get price from Chainlink price feed
   */
  async getPriceFromFeed(baseCurrency, quoteCurrency) {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const feedAddress = this.priceFeeds[pair];
    
    if (!feedAddress) {
      throw new Error(`No Chainlink feed available for ${pair}`);
    }
    
    try {
      // Get or create contract instance
      const contract = this.getContract(feedAddress);
      
      // Get latest price data
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = 
        await contract.latestRoundData();
      
      // Get decimals
      const decimals = await contract.decimals();
      
      // Validate the data
      this.validatePriceData(roundId, answer, updatedAt, answeredInRound);
      
      // Convert to human-readable price
      const price = Number(answer) / Math.pow(10, decimals);
      
      logger.debug(`Chainlink price fetched: ${pair} = ${price}`, {
        roundId: roundId.toString(),
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString()
      });
      
      return price;
      
    } catch (error) {
      logger.error('Chainlink feed read error:', {
        pair,
        feedAddress,
        error: error.message
      });
      throw new Error(`Failed to read Chainlink feed for ${pair}: ${error.message}`);
    }
  }

  /**
   * Validate Chainlink price data for freshness and completeness
   */
  validatePriceData(roundId, answer, updatedAt, answeredInRound) {
    // Check if answer is valid
    if (answer <= 0) {
      throw new Error('Invalid price: answer is zero or negative');
    }
    
    // Check if round is complete
    if (answeredInRound < roundId) {
      throw new Error('Stale price: round not complete');
    }
    
    // Check price freshness (not older than threshold)
    const priceAge = Date.now() - (Number(updatedAt) * 1000);
    if (priceAge > this.stalePriceThreshold) {
      logger.warn('Chainlink price is stale', {
        ageMinutes: Math.floor(priceAge / 60000),
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString()
      });
      // Don't throw, just warn - some feeds update less frequently
    }
  }

  /**
   * Get or create contract instance
   */
  getContract(address) {
    if (!this.contracts[address]) {
      this.contracts[address] = new ethers.Contract(
        address,
        PRICE_FEED_ABI,
        this.provider
      );
    }
    return this.contracts[address];
  }

  /**
   * Get USD to NGN rate
   * Chainlink doesn't have USD/NGN feed, so use external source
   */
  async getUsdToNgnRate() {
    // This should ideally come from a Nigerian financial data provider
    // Options:
    // 1. CBN (Central Bank of Nigeria) official rate API
    // 2. Flutterwave/Paystack rate APIs
    // 3. Local exchange aggregators
    
    // For now, return a reasonable fallback
    // In production, implement proper API integration
    const fallbackRate = parseFloat(process.env.FALLBACK_USD_NGN_RATE || '1550');
    
    logger.debug('Using fallback USD/NGN rate:', fallbackRate);
    
    return fallbackRate;
  }

  /**
   * Get historical price (if needed for TWAP calculations)
   */
  async getHistoricalPrice(baseCurrency, quoteCurrency, roundId) {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const feedAddress = this.priceFeeds[pair];
    
    if (!feedAddress) {
      throw new Error(`No Chainlink feed available for ${pair}`);
    }
    
    try {
      const contract = this.getContract(feedAddress);
      
      // Chainlink provides getRoundData for historical prices
      const historicalData = await contract.getRoundData(roundId);
      const decimals = await contract.decimals();
      
      const price = Number(historicalData.answer) / Math.pow(10, decimals);
      
      return {
        price,
        timestamp: Number(historicalData.updatedAt),
        roundId: historicalData.roundId.toString()
      };
      
    } catch (error) {
      logger.error('Failed to fetch historical price:', error.message);
      throw error;
    }
  }

  /**
   * Calculate TWAP (Time-Weighted Average Price) for last N rounds
   */
  async getTWAP(baseCurrency, quoteCurrency, numRounds = 10) {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const feedAddress = this.priceFeeds[pair];
    
    if (!feedAddress) {
      throw new Error(`No Chainlink feed available for ${pair}`);
    }
    
    try {
      const contract = this.getContract(feedAddress);
      const latestRound = await contract.latestRoundData();
      const decimals = await contract.decimals();
      
      let totalPrice = 0;
      let validRounds = 0;
      
      // Get last N rounds
      for (let i = 0; i < numRounds; i++) {
        try {
          const roundId = latestRound.roundId - BigInt(i);
          const roundData = await contract.getRoundData(roundId);
          
          if (roundData.answer > 0) {
            const price = Number(roundData.answer) / Math.pow(10, decimals);
            totalPrice += price;
            validRounds++;
          }
        } catch (error) {
          // Skip invalid rounds
          logger.debug(`Skipping round ${i}:`, error.message);
        }
      }
      
      if (validRounds === 0) {
        throw new Error('No valid rounds found for TWAP calculation');
      }
      
      const twap = totalPrice / validRounds;
      
      logger.debug(`TWAP calculated for ${pair}:`, {
        twap,
        rounds: validRounds
      });
      
      return twap;
      
    } catch (error) {
      logger.error('TWAP calculation error:', error.message);
      throw error;
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
    const cryptos = ['BTC', 'ETH', 'USDC', 'USDT', 'DAI'];
    return cryptos.includes(currency.toUpperCase());
  }

  /**
   * Health check for Chainlink provider
   */
  async healthCheck() {
    try {
      // Try to fetch ETH/USD price as health check
      const ethPrice = await this.getPriceFromFeed('ETH', 'USD');
      
      if (ethPrice > 0) {
        return {
          status: 'healthy',
          ethPrice,
          network: await this.provider.getNetwork()
        };
      }
      
      return { status: 'unhealthy', reason: 'Invalid price received' };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get feed description
   */
  async getFeedDescription(baseCurrency, quoteCurrency) {
    const pair = `${baseCurrency}/${quoteCurrency}`;
    const feedAddress = this.priceFeeds[pair];
    
    if (!feedAddress) {
      return null;
    }
    
    try {
      const contract = this.getContract(feedAddress);
      const description = await contract.description();
      return description;
    } catch (error) {
      logger.error('Failed to get feed description:', error.message);
      return null;
    }
  }
}

module.exports = ChainlinkProvider;
