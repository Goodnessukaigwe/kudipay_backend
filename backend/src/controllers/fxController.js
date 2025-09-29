const fxService = require('../services/fxService');
const logger = require('../utils/logger');

class FxController {
  /**
   * Get current exchange rates
   */
  async getRates(req, res) {
    try {
      const rates = await fxService.getAllRates();
      
      res.json({
        success: true,
        data: rates
      });
    } catch (error) {
      logger.error('Get rates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve exchange rates'
      });
    }
  }

  /**
   * Get specific rate for currency pair
   */
  async getSpecificRate(req, res) {
    try {
      const { from, to } = req.params;
      
      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: 'From and to currencies are required'
        });
      }

      let rate;
      if (from.toUpperCase() === 'USDT' && to.toUpperCase() === 'NGN') {
        rate = await fxService.getUSDTToNGNRate();
      } else if (from.toUpperCase() === 'ETH' && to.toUpperCase() === 'NGN') {
        rate = await fxService.getETHToNGNRate();
      } else if (from.toUpperCase() === 'ETH' && to.toUpperCase() === 'USD') {
        rate = await fxService.getETHToUSDRate();
      } else {
        return res.status(400).json({
          success: false,
          message: `Rate for ${from}/${to} not available`
        });
      }
      
      res.json({
        success: true,
        data: {
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          rate,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Get specific rate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve exchange rate'
      });
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(req, res) {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({
          success: false,
          message: 'Amount, fromCurrency, and toCurrency are required'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      const conversion = await fxService.convertAmount(amount, fromCurrency, toCurrency);
      
      res.json({
        success: true,
        data: conversion
      });
    } catch (error) {
      logger.error('Convert amount error:', error);
      
      if (error.message.includes('not supported')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to convert amount'
      });
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(req, res) {
    try {
      const currencies = fxService.getSupportedCurrencies();
      
      res.json({
        success: true,
        data: currencies
      });
    } catch (error) {
      logger.error('Get supported currencies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve supported currencies'
      });
    }
  }
}

module.exports = new FxController();
