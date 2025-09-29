const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Initiate withdrawal to bank account
router.post('/withdraw/bank', paymentController.withdrawToBank);

// Initiate withdrawal to mobile money
router.post('/withdraw/mobile-money', paymentController.withdrawToMobileMoney);

// Get supported banks
router.get('/banks', paymentController.getSupportedBanks);

// Get supported mobile money providers
router.get('/mobile-money/providers', paymentController.getMobileMoneyProviders);

// Verify bank account
router.post('/verify/bank-account', paymentController.verifyBankAccount);

// Get withdrawal status
router.get('/withdrawal/:txRef/status', paymentController.getWithdrawalStatus);

module.exports = router;
