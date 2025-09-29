const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register new user
router.post('/register', userController.registerUser);

// Get user profile
router.get('/profile/:phoneNumber', userController.getUserProfile);

// Update user PIN
router.put('/pin', userController.updatePin);

// Verify user PIN
router.post('/verify-pin', userController.verifyPin);

// Get user transaction stats
router.get('/stats/:phoneNumber', userController.getUserStats);

module.exports = router;
