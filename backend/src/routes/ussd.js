const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

// Main USSD endpoint - handles all USSD requests
router.post('/callback', ussdController.handleUssdRequest);

// Test endpoint for USSD menu
router.get('/test-menu', ussdController.getTestMenu);

// Session management endpoints
router.get('/sessions/active', ussdController.getActiveSessions);
router.post('/sessions/cleanup', ussdController.cleanupSessions);

module.exports = router;
