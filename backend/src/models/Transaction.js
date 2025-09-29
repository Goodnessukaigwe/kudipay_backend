const { pool } = require('../../config/db');

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.txRef = data.tx_ref;
    this.fromPhone = data.from_phone;
    this.toPhone = data.to_phone;
    this.fromWallet = data.from_wallet;
    this.toWallet = data.to_wallet;
    this.amount = data.amount;
    this.currency = data.currency;
    this.amountNgn = data.amount_ngn;
    this.exchangeRate = data.exchange_rate;
    this.fee = data.fee;
    this.status = data.status;
    this.type = data.type;
    this.blockchain_hash = data.blockchain_hash;
    this.metadata = data.metadata;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Create a new transaction
   */
  static async create(transactionData) {
    const query = `
      INSERT INTO transactions (
        tx_ref, from_phone, to_phone, from_wallet, to_wallet,
        amount, currency, amount_ngn, exchange_rate, fee,
        status, type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      transactionData.txRef,
      transactionData.fromPhone,
      transactionData.toPhone,
      transactionData.fromWallet,
      transactionData.toWallet,
      transactionData.amount,
      transactionData.currency || 'USDT',
      transactionData.amountNgn,
      transactionData.exchangeRate,
      transactionData.fee || 0,
      transactionData.status || 'pending',
      transactionData.type,
      JSON.stringify(transactionData.metadata || {})
    ];
    
    const result = await pool.query(query, values);
    return new Transaction(result.rows[0]);
  }

  /**
   * Find transaction by reference
   */
  static async findByRef(txRef) {
    const query = 'SELECT * FROM transactions WHERE tx_ref = $1';
    const result = await pool.query(query, [txRef]);
    
    return result.rows.length ? new Transaction(result.rows[0]) : null;
  }

  /**
   * Find transactions by phone number
   */
  static async findByPhone(phoneNumber, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM transactions 
      WHERE from_phone = $1 OR to_phone = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [phoneNumber, limit, offset]);
    return result.rows.map(row => new Transaction(row));
  }

  /**
   * Find transactions by wallet address
   */
  static async findByWallet(walletAddress, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM transactions 
      WHERE from_wallet = $1 OR to_wallet = $1
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [walletAddress, limit, offset]);
    return result.rows.map(row => new Transaction(row));
  }

  /**
   * Update transaction status
   */
  async updateStatus(status, blockchainHash = null, metadata = null) {
    const query = `
      UPDATE transactions 
      SET status = $1, blockchain_hash = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 
      RETURNING *
    `;
    
    const updatedMetadata = metadata ? 
      JSON.stringify({ ...this.metadata, ...metadata }) : 
      this.metadata;
    
    const result = await pool.query(query, [status, blockchainHash, updatedMetadata, this.id]);
    return new Transaction(result.rows[0]);
  }

  /**
   * Get transaction statistics for a phone number
   */
  static async getStats(phoneNumber) {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN to_phone = $1 THEN amount_ngn ELSE 0 END) as total_received,
        SUM(CASE WHEN from_phone = $1 THEN amount_ngn ELSE 0 END) as total_sent,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions
      FROM transactions 
      WHERE from_phone = $1 OR to_phone = $1
    `;
    
    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0];
  }

  /**
   * Get daily transaction volume
   */
  static async getDailyVolume(date = new Date()) {
    const query = `
      SELECT 
        COUNT(*) as transaction_count,
        SUM(amount_ngn) as total_volume,
        currency
      FROM transactions 
      WHERE DATE(created_at) = DATE($1) AND status = 'completed'
      GROUP BY currency
    `;
    
    const result = await pool.query(query, [date]);
    return result.rows;
  }

  /**
   * Find pending transactions (for processing)
   */
  static async findPending(limit = 100) {
    const query = `
      SELECT * FROM transactions 
      WHERE status = 'pending'
      ORDER BY created_at ASC 
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => new Transaction(row));
  }
}

module.exports = Transaction;
