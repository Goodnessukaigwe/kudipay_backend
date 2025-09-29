const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Create wallet for phone number
router.post('/create', walletController.createWallet);

// Get wallet info by phone number
router.get('/phone/:phoneNumber', walletController.getWalletByPhone);

// Get wallet balance
router.get('/balance/:walletAddress', walletController.getBalance);

// Send transaction
router.post('/send', walletController.sendTransaction);

// Get transaction history
router.get('/transactions/:walletAddress', walletController.getTransactions);

// Generate receive address/QR
router.get('/receive/:phoneNumber', walletController.getReceiveInfo);

module.exports = router;
