const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Legacy endpoints
router.post('/withdraw/bank', paymentController.withdrawToBank);
router.post('/withdraw/mobile-money', paymentController.withdrawToMobileMoney);
router.get('/banks', paymentController.getSupportedBanks);
router.get('/mobile-money/providers', paymentController.getMobileMoneyProviders);
router.post('/verify/bank-account', paymentController.verifyBankAccount);
router.get('/withdrawal/:txRef/status', paymentController.getWithdrawalStatus);

// Flutterwave endpoints
router.post('/flutterwave/withdraw/ng-bank', paymentController.withdrawToNigerianBank);
router.post('/flutterwave/withdraw/ke-bank', paymentController.withdrawToKenyanBank);
router.post('/flutterwave/withdraw/mobile-money', paymentController.withdrawToMobileMoneyFlutterwave);
router.get('/flutterwave/banks/ng', paymentController.getNigerianBanks);
router.get('/flutterwave/banks/ke', paymentController.getKenyanBanks);
router.get('/flutterwave/mobile-money/providers', paymentController.getMobileMoneyProvidersFlutterwave);
router.post('/flutterwave/verify/account', paymentController.verifyAccountFlutterwave);
router.get('/flutterwave/transfer/:transferId/status', paymentController.getFlutterwaveTransferStatus);
router.post('/flutterwave/webhook', paymentController.handleFlutterwaveWebhook);

module.exports = router;
