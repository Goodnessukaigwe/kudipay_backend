/**
 * Profit Calculator - Calculates profit from FX markup
 * Handles multi-currency profit calculation and aggregation
 */

const logger = require('../../utils/logger');

class ProfitCalculator {
  constructor() {
    // Default profit sharing (if needed for multi-stakeholder model)
    this.profitSharing = {
      platform: 0.70,    // 70% to platform
      partner: 0.20,     // 20% to partner/agent
      reserve: 0.10      // 10% to reserve fund
    };
  }

  /**
   * Calculate profit from a single conversion
   * @param {number} amount - Original amount
   * @param {number} baseRate - Market rate without markup
   * @param {number} rateWithMarkup - Rate with markup applied
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @returns {Object} Profit breakdown
   */
  calculateProfit(amount, baseRate, rateWithMarkup, fromCurrency, toCurrency) {
    try {
      // Calculate total markup amount
      const markupRate = rateWithMarkup - baseRate;
      const grossProfit = amount * markupRate;
      
      // Determine profit currency (usually the target/local currency)
      const profitCurrency = toCurrency;
      
      // Calculate profit distribution
      const platformProfit = grossProfit * this.profitSharing.platform;
      const partnerProfit = grossProfit * this.profitSharing.partner;
      const reserveProfit = grossProfit * this.profitSharing.reserve;
      
      return {
        grossProfit: parseFloat(grossProfit.toFixed(6)),
        platformProfit: parseFloat(platformProfit.toFixed(6)),
        partnerProfit: parseFloat(partnerProfit.toFixed(6)),
        reserveProfit: parseFloat(reserveProfit.toFixed(6)),
        totalProfit: parseFloat(grossProfit.toFixed(6)),
        currency: profitCurrency,
        markupPercent: parseFloat(((markupRate / baseRate) * 100).toFixed(4)),
        breakdown: {
          originalAmount: amount,
          fromCurrency,
          toCurrency,
          baseRate,
          rateWithMarkup,
          markupRate: parseFloat(markupRate.toFixed(6))
        }
      };
      
    } catch (error) {
      logger.error('ProfitCalculator.calculateProfit error:', error);
      throw error;
    }
  }

  /**
   * Calculate total profit for multiple conversions
   */
  calculateBatchProfit(conversions) {
    try {
      const totalsByCurrency = {};
      
      for (const conversion of conversions) {
        const profit = this.calculateProfit(
          conversion.amount,
          conversion.baseRate,
          conversion.rateWithMarkup,
          conversion.fromCurrency,
          conversion.toCurrency
        );
        
        const currency = profit.currency;
        
        if (!totalsByurrency[currency]) {
          totalsByCurrency[currency] = {
            grossProfit: 0,
            platformProfit: 0,
            partnerProfit: 0,
            reserveProfit: 0,
            conversions: 0
          };
        }
        
        totalsByCurrency[currency].grossProfit += profit.grossProfit;
        totalsByCurrency[currency].platformProfit += profit.platformProfit;
        totalsByCurrency[currency].partnerProfit += profit.partnerProfit;
        totalsByCurrency[currency].reserveProfit += profit.reserveProfit;
        totalsByCurrency[currency].conversions += 1;
      }
      
      return {
        totalsByurrency,
        totalConversions: conversions.length,
        calculatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('ProfitCalculator.calculateBatchProfit error:', error);
      throw error;
    }
  }

  /**
   * Calculate profit margin percentage
   */
  calculateMargin(cost, revenue) {
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }

  /**
   * Calculate ROI for a specific timeframe
   */
  calculateROI(totalProfit, operatingCosts, timeframeDays = 30) {
    const netProfit = totalProfit - operatingCosts;
    const roi = (netProfit / operatingCosts) * 100;
    const dailyROI = roi / timeframeDays;
    const annualizedROI = dailyROI * 365;
    
    return {
      netProfit: parseFloat(netProfit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      dailyROI: parseFloat(dailyROI.toFixed(4)),
      annualizedROI: parseFloat(annualizedROI.toFixed(2)),
      timeframeDays
    };
  }

  /**
   * Update profit sharing configuration
   */
  updateProfitSharing(platform, partner, reserve) {
    if (platform + partner + reserve !== 1.0) {
      throw new Error('Profit sharing percentages must sum to 1.0 (100%)');
    }
    
    this.profitSharing = {
      platform,
      partner,
      reserve
    };
    
    logger.info('Profit sharing updated:', this.profitSharing);
  }

  /**
   * Get current profit sharing configuration
   */
  getProfitSharing() {
    return { ...this.profitSharing };
  }
}

module.exports = ProfitCalculator;
