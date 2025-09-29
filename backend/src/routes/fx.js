const express = require('express');
const router = express.Router();
const fxController = require('../controllers/fxController');

// Get current exchange rates
router.get('/rates', fxController.getRates);

// Get specific rate for currency pair
router.get('/rates/:from/:to', fxController.getSpecificRate);

// Convert amount from one currency to another
router.post('/convert', fxController.convertAmount);

// Get supported currencies
router.get('/currencies', fxController.getSupportedCurrencies);

module.exports = router;
