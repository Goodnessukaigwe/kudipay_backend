const { pool } = require('../../config/db');

class User {
  constructor(data) {
    this.id = data.id;
    this.phoneNumber = data.phone_number;
    this.walletAddress = data.wallet_address;
    this.privateKey = data.private_key;
    this.pin = data.pin;
    this.isActive = data.is_active;
    this.pinFailedAttempts = data.pin_failed_attempts || 0;
    this.pinLockedUntil = data.pin_locked_until;
    this.blockchainTxHash = data.blockchain_tx_hash;
    this.blockchainBlock = data.blockchain_block;
    this.blockchainNetwork = data.blockchain_network;
    this.blockchainRegisteredAt = data.blockchain_registered_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const query = `
      INSERT INTO users (
        phone_number, 
        wallet_address, 
        private_key, 
        pin, 
        is_active,
        blockchain_tx_hash,
        blockchain_block,
        blockchain_network,
        blockchain_registered_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      userData.phoneNumber,
      userData.walletAddress,
      userData.privateKey,
      userData.pin,
      userData.isActive || true,
      userData.blockchainTxHash || null,
      userData.blockchainBlock || null,
      userData.blockchainNetwork || 'base-sepolia',
      userData.blockchainRegisteredAt || null
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
   * Check if account is locked due to failed PIN attempts
   */
  isLocked() {
    if (!this.pinLockedUntil) return false;
    return new Date() < new Date(this.pinLockedUntil);
  }

  /**
   * Get remaining lock time in minutes
   */
  getRemainingLockTime() {
    if (!this.isLocked()) return 0;
    const now = new Date();
    const lockedUntil = new Date(this.pinLockedUntil);
    return Math.ceil((lockedUntil - now) / 60000); // Convert to minutes
  }

  /**
   * Increment failed PIN attempts
   */
  async incrementFailedAttempts() {
    const newAttempts = this.pinFailedAttempts + 1;
    let lockedUntil = null;

    // Lock account for 30 minutes after 3 failed attempts
    if (newAttempts >= 3) {
      lockedUntil = new Date(Date.now() + 30 * 60000); // 30 minutes from now
    }

    const query = `
      UPDATE users 
      SET pin_failed_attempts = $1, 
          pin_locked_until = $2,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `;

    const result = await pool.query(query, [newAttempts, lockedUntil, this.id]);
    return new User(result.rows[0]);
  }

  /**
   * Reset failed PIN attempts (on successful verification)
   */
  async resetFailedAttempts() {
    const query = `
      UPDATE users 
      SET pin_failed_attempts = 0, 
          pin_locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;

    const result = await pool.query(query, [this.id]);
    return new User(result.rows[0]);
  }

  /**
   * Verify PIN with attempt limiting
   * Returns { success: boolean, user: User|null, message: string, attemptsRemaining: number }
   */
  async verifyPinWithLimiting(inputPin) {
    // Check if account is locked
    if (this.isLocked()) {
      const minutesRemaining = this.getRemainingLockTime();
      return {
        success: false,
        user: null,
        message: `Account locked. Try again in ${minutesRemaining} minute(s).`,
        attemptsRemaining: 0
      };
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(inputPin)) {
      return {
        success: false,
        user: null,
        message: 'PIN must be exactly 4 digits.',
        attemptsRemaining: 3 - this.pinFailedAttempts
      };
    }

    // Verify PIN
    const isValid = this.verifyPin(inputPin);

    if (!isValid) {
      const updatedUser = await this.incrementFailedAttempts();
      const attemptsRemaining = 3 - updatedUser.pinFailedAttempts;

      if (updatedUser.isLocked()) {
        return {
          success: false,
          user: updatedUser,
          message: 'Too many failed attempts. Account locked for 30 minutes.',
          attemptsRemaining: 0
        };
      }

      return {
        success: false,
        user: updatedUser,
        message: `Invalid PIN. ${attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining
      };
    }

    // PIN is valid - reset failed attempts
    const updatedUser = await this.resetFailedAttempts();
    return {
      success: true,
      user: updatedUser,
      message: 'PIN verified successfully.',
      attemptsRemaining: 3
    };
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
