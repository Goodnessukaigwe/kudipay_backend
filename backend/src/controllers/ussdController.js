const ussdService = require('../services/ussdService');
const UssdSession = require('../models/UssdSession');
const logger = require('../utils/logger');

class UssdController {
  /**
   * Handle incoming USSD requests
   */
  async handleUssdRequest(req, res) {
    try {
      const { sessionId, serviceCode, phoneNumber, text } = req.body;
      
      logger.info(`USSD Request: ${phoneNumber} - ${text || 'Initial'}`);
      
      // Process the USSD request
      const response = await ussdService.processRequest({
        sessionId,
        serviceCode,
        phoneNumber,
        text: text || ''
      });
      
      // Send response back to USSD gateway
      res.set('Content-Type', 'text/plain');
      res.send(response);
      
    } catch (error) {
      logger.error('USSD request error:', error);
      res.set('Content-Type', 'text/plain');
      res.send('END Service temporarily unavailable. Please try again later.');
    }
  }

  /**
   * Get test menu for debugging
   */
  async getTestMenu(req, res) {
    try {
      const testResponse = await ussdService.getMainMenu();
      
      res.json({
        success: true,
        data: {
          menu: testResponse,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Test menu error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate test menu'
      });
    }
  }

  /**
   * Get active USSD sessions (for monitoring)
   */
  async getActiveSessions(req, res) {
    try {
      const sessions = await UssdSession.getActiveSessions();
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      logger.error('Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active sessions'
      });
    }
  }

  /**
   * Cleanup expired USSD sessions
   */
  async cleanupSessions(req, res) {
    try {
      const cleanedCount = await UssdSession.cleanupExpired();
      
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} expired sessions`
      });
    } catch (error) {
      logger.error('Session cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup sessions'
      });
    }
  }
}

module.exports = new UssdController();
