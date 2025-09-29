const { pool } = require('../../config/db');

class User {
  constructor(data) {
    this.id = data.id;
    this.phoneNumber = data.phone_number;
    this.walletAddress = data.wallet_address;
    this.privateKey = data.private_key;
    this.pin = data.pin;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const query = `
      INSERT INTO users (phone_number, wallet_address, private_key, pin, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      userData.phoneNumber,
      userData.walletAddress,
      userData.privateKey,
      userData.pin,
      userData.isActive || true
    ];
    
    const result = await pool.query(query, values);
    return new User(result.rows[0]);
  }

  /**
   * Find user by phone number
   */
  static async findByPhone(phoneNumber) {
    const query = 'SELECT * FROM users WHERE phone_number = $1';
    const result = await pool.query(query, [phoneNumber]);
    
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by wallet address
   */
  static async findByWallet(walletAddress) {
    const query = 'SELECT * FROM users WHERE wallet_address = $1';
    const result = await pool.query(query, [walletAddress]);
    
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  /**
   * Update user PIN
   */
  async updatePin(newPin) {
    const query = `
      UPDATE users 
      SET pin = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [newPin, this.id]);
    return new User(result.rows[0]);
  }

  /**
   * Verify user PIN
   */
  verifyPin(inputPin) {
    return this.pin === inputPin;
  }

  /**
   * Activate/Deactivate user
   */
  async setActive(isActive) {
    const query = `
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [isActive, this.id]);
    return new User(result.rows[0]);
  }

  /**
   * Get all users (for admin)
   */
  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows.map(row => new User(row));
  }

  /**
   * Delete user (soft delete - deactivate)
   */
  async delete() {
    return this.setActive(false);
  }
}

module.exports = User;
