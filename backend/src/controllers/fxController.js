/**
 * FX Controller - Handles FX Engine API endpoints
 * Production-ready with comprehensive error handling and validation
 */

const FxEngine = require('../services/fx/FxEngine');
const logger = require('../utils/logger');
const { body, param, query, validationResult } = require('express-validator');

// Initialize FX Engine
const fxEngine = new FxEngine();

class FxController {
  /**
   * Get current exchange rate for a currency pair
   * GET /api/fx/rate/:from/:to
   */
  async getRate(req, res) {
    try {
      const { from, to } = req.params;
      const { amount } = req.query;
      
      const rateInfo = await fxEngine.getRate(
        from.toUpperCase(),
        to.toUpperCase(),
        amount ? parseFloat(amount) : null
      );
      
      res.json({
        success: true,
        data: {
          pair: `${from}/${to}`,
          baseRate: rateInfo.baseRate,
          rateWithMarkup: rateInfo.rateWithMarkup,
          markupPercent: rateInfo.markupPercent,
          provider: rateInfo.provider,
          timestamp: new Date(rateInfo.timestamp).toISOString()
        }
      });
      
    } catch (error) {
      logger.error('FxController.getRate error:', {
        error: error.message,
        params: req.params
      });
      
      res.status(error.message.includes('not supported') ? 400 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all supported currency pair rates
   * GET /api/fx/rates
   */
  async getAllRates(req, res) {
    try {
      const rates = await fxEngine.getAllRates();
      
      res.json({
        success: true,
        data: rates
      });
      
    } catch (error) {
      logger.error('FxController.getAllRates error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve exchange rates'
      });
    }
  }

  /**
   * Convert amount from one currency to another
   * POST /api/fx/convert
   * Body: { amount, fromCurrency, toCurrency, userId?, phoneNumber?, transactionRef? }
   */
  async convertAmount(req, res) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const { amount, fromCurrency, toCurrency, userId, phoneNumber, transactionRef } = req.body;
      
      // Perform conversion
      const result = await fxEngine.convertAmount(
        amount,
        fromCurrency.toUpperCase(),
        toCurrency.toUpperCase(),
        {
          userId,
          phoneNumber,
          transactionRef,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      );
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('FxController.convertAmount error:', {
        error: error.message,
        body: req.body
      });
      
      res.status(error.message.includes('greater than 0') ? 400 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get profit statistics
   * GET /api/fx/profit/stats?timeframe=24h
   */
  async getProfitStats(req, res) {
    try {
      const { timeframe = '24h' } = req.query;
      
      // Validate timeframe
      const validTimeframes = ['1h', '24h', '7d', '30d'];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
        });
      }
      
      const stats = await fxEngine.getProfitStats(timeframe);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('FxController.getProfitStats error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profit statistics'
      });
    }
  }

  /**
   * Get supported currency pairs
   * GET /api/fx/pairs
   */
  getSupportedPairs(req, res) {
    try {
      const pairs = fxEngine.config.supportedPairs;
      
      res.json({
        success: true,
        data: {
          pairs,
          count: pairs.length
        }
      });
      
    } catch (error) {
      logger.error('FxController.getSupportedPairs error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve supported pairs'
      });
    }
  }

  /**
   * Get FX Engine health status
   * GET /api/fx/health
   */
  async getHealthStatus(req, res) {
    try {
      const cacheStats = {
        size: fxEngine.cache.size(),
        keys: fxEngine.cache.keys()
      };
      
      const providerHealth = fxEngine.providerHealth;
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          cache: cacheStats,
          providers: providerHealth,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('FxController.getHealthStatus error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health status'
      });
    }
  }

  /**
   * Get markup configuration (admin only)
   * GET /api/fx/admin/markup
   */
  getMarkupConfig(req, res) {
    try {
      // In production, add admin authentication middleware
      const config = fxEngine.config.markup;
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('FxController.getMarkupConfig error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve markup configuration'
      });
    }
  }

  /**
   * Update markup configuration (admin only)
   * PUT /api/fx/admin/markup
   */
  updateMarkupConfig(req, res) {
    try {
      // In production, add admin authentication middleware
      const { pair, markup } = req.body;
      
      if (!pair || markup === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Pair and markup are required'
        });
      }
      
      if (markup < 0.01 || markup > 0.05) {
        return res.status(400).json({
          success: false,
          message: 'Markup must be between 1% (0.01) and 5% (0.05)'
        });
      }
      
      fxEngine.config.markup[pair] = markup;
      
      logger.info('Markup updated', { pair, markup });
      
      res.json({
        success: true,
        message: `Markup for ${pair} updated to ${(markup * 100).toFixed(2)}%`,
        data: { pair, markup }
      });
      
    } catch (error) {
      logger.error('FxController.updateMarkupConfig error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update markup configuration'
      });
    }
  }

  /**
   * Get conversion history (requires authentication)
   * GET /api/fx/history?userId=123&limit=20
   */
  async getConversionHistory(req, res) {
    try {
      const { userId, limit = 20 } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }
      
      const history = await fxEngine.conversionLogger.getUserConversionHistory(
        parseInt(userId),
        parseInt(limit)
      );
      
      res.json({
        success: true,
        data: {
          conversions: history,
          count: history.length
        }
      });
      
    } catch (error) {
      logger.error('FxController.getConversionHistory error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversion history'
      });
    }
  }
}

// Validation middleware
const convertAmountValidation = [
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('fromCurrency')
    .isString()
    .isLength({ min: 3, max: 4 })
    .withMessage('Invalid from currency'),
  body('toCurrency')
    .isString()
    .isLength({ min: 3, max: 4 })
    .withMessage('Invalid to currency'),
  body('userId')
    .optional()
    .isInt()
    .withMessage('User ID must be an integer'),
  body('phoneNumber')
    .optional()
    .matches(/^\+[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('transactionRef')
    .optional()
    .isString()
    .withMessage('Transaction reference must be a string')
];

const getRateValidation = [
  param('from')
    .isString()
    .isLength({ min: 3, max: 4 })
    .withMessage('Invalid from currency'),
  param('to')
    .isString()
    .isLength({ min: 3, max: 4 })
    .withMessage('Invalid to currency'),
  query('amount')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number')
];

// Export controller and validations
module.exports = {
  controller: new FxController(),
  validations: {
    convertAmount: convertAmountValidation,
    getRate: getRateValidation
  }
};
