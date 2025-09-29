const { pool } = require('../../config/db');

class UssdSession {
  constructor(data) {
    this.id = data.id;
    this.sessionId = data.session_id;
    this.phoneNumber = data.phone_number;
    this.currentStep = data.current_step;
    this.sessionData = data.session_data;
    this.isActive = data.is_active;
    this.lastActivity = data.last_activity;
    this.createdAt = data.created_at;
  }

  /**
   * Create or update USSD session
   */
  static async createOrUpdate(sessionId, phoneNumber, step = 'main_menu', data = {}) {
    // First try to update existing session
    const updateQuery = `
      UPDATE ussd_sessions 
      SET current_step = $1, session_data = $2, last_activity = CURRENT_TIMESTAMP, is_active = true
      WHERE session_id = $3 AND phone_number = $4
      RETURNING *
    `;
    
    let result = await pool.query(updateQuery, [step, JSON.stringify(data), sessionId, phoneNumber]);
    
    if (result.rows.length === 0) {
      // Create new session if update didn't find existing one
      const createQuery = `
        INSERT INTO ussd_sessions (session_id, phone_number, current_step, session_data, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `;
      
      result = await pool.query(createQuery, [sessionId, phoneNumber, step, JSON.stringify(data)]);
    }
    
    return new UssdSession(result.rows[0]);
  }

  /**
   * Find active session by session ID and phone number
   */
  static async findActive(sessionId, phoneNumber) {
    const query = `
      SELECT * FROM ussd_sessions 
      WHERE session_id = $1 AND phone_number = $2 AND is_active = true
    `;
    
    const result = await pool.query(query, [sessionId, phoneNumber]);
    return result.rows.length ? new UssdSession(result.rows[0]) : null;
  }

  /**
   * Update session step and data
   */
  async updateStep(step, data = null) {
    const sessionData = data ? { ...this.sessionData, ...data } : this.sessionData;
    
    const query = `
      UPDATE ussd_sessions 
      SET current_step = $1, session_data = $2, last_activity = CURRENT_TIMESTAMP
      WHERE id = $3 
      RETURNING *
    `;
    
    const result = await pool.query(query, [step, JSON.stringify(sessionData), this.id]);
    return new UssdSession(result.rows[0]);
  }

  /**
   * Add data to session without changing step
   */
  async addData(data) {
    const sessionData = { ...this.sessionData, ...data };
    
    const query = `
      UPDATE ussd_sessions 
      SET session_data = $1, last_activity = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [JSON.stringify(sessionData), this.id]);
    return new UssdSession(result.rows[0]);
  }

  /**
   * End/close session
   */
  async end() {
    const query = `
      UPDATE ussd_sessions 
      SET is_active = false, last_activity = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [this.id]);
    return new UssdSession(result.rows[0]);
  }

  /**
   * Clean up expired sessions (older than 10 minutes)
   */
  static async cleanupExpired() {
    const query = `
      UPDATE ussd_sessions 
      SET is_active = false
      WHERE is_active = true 
      AND last_activity < NOW() - INTERVAL '10 minutes'
      RETURNING COUNT(*) as cleaned_count
    `;
    
    const result = await pool.query(query);
    return result.rows[0].cleaned_count;
  }

  /**
   * Get session data property
   */
  getData(key) {
    return this.sessionData && this.sessionData[key];
  }

  /**
   * Check if session is expired (older than 10 minutes)
   */
  isExpired() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return this.lastActivity < tenMinutesAgo;
  }

  /**
   * Get all active sessions for monitoring
   */
  static async getActiveSessions() {
    const query = `
      SELECT phone_number, current_step, COUNT(*) as count
      FROM ussd_sessions 
      WHERE is_active = true
      GROUP BY phone_number, current_step
      ORDER BY COUNT(*) DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = UssdSession;
