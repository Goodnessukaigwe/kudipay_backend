/**
 * FX Engine Routes
 * Comprehensive API endpoints for FX operations with validation
 */

const express = require('express');
const router = express.Router();
const { controller, validations } = require('../controllers/fxController');

// Public Endpoints

/**
 * @route   GET /api/fx/rates
 * @desc    Get all supported currency pair rates with markup
 * @access  Public
 */
router.get('/rates', controller.getAllRates.bind(controller));

/**
 * @route   GET /api/fx/rate/:from/:to
 * @desc    Get specific rate for a currency pair
 * @query   amount - Optional amount for dynamic markup calculation
 * @access  Public
 */
router.get('/rate/:from/:to', validations.getRate, controller.getRate.bind(controller));

/**
 * @route   GET /api/fx/pairs
 * @desc    Get list of supported currency pairs
 * @access  Public
 */
router.get('/pairs', controller.getSupportedPairs.bind(controller));

/**
 * @route   GET /api/fx/health
 * @desc    Get FX Engine health status
 * @access  Public
 */
router.get('/health', controller.getHealthStatus.bind(controller));

/**
 * @route   POST /api/fx/convert
 * @desc    Convert amount from one currency to another with profit tracking
 * @body    { amount, fromCurrency, toCurrency, userId?, phoneNumber?, transactionRef? }
 * @access  Public (should be protected with rate limiting)
 */
router.post('/convert', validations.convertAmount, controller.convertAmount.bind(controller));

/**
 * @route   GET /api/fx/usd-to-ngn
 * @desc    Get real-time USD to NGN conversion
 * @access  Public
 */
router.get('/usd-to-ngn', controller.getUsdToNgn.bind(controller));

// Protected Endpoints (require authentication in production)

/**
 * @route   GET /api/fx/profit/stats
 * @desc    Get profit statistics for specified timeframe
 * @query   timeframe - 1h, 24h, 7d, 30d (default: 24h)
 * @access  Protected (Admin/Finance)
 */
router.get('/profit/stats', controller.getProfitStats.bind(controller));

/**
 * @route   GET /api/fx/history
 * @desc    Get conversion history for a user
 * @query   userId - User ID (required), limit - Number of records (default: 20)
 * @access  Protected (User/Admin)
 */
router.get('/history', controller.getConversionHistory.bind(controller));

// Admin Endpoints (require admin authentication in production)

/**
 * @route   GET /api/fx/admin/markup
 * @desc    Get current markup configuration
 * @access  Protected (Admin only)
 */
router.get('/admin/markup', controller.getMarkupConfig.bind(controller));

/**
 * @route   PUT /api/fx/admin/markup
 * @desc    Update markup configuration for a currency pair
 * @body    { pair, markup }
 * @access  Protected (Admin only)
 */
router.put('/admin/markup', controller.updateMarkupConfig.bind(controller));

module.exports = router;
