/**
 * Conversion Logger - Records all FX conversions for analytics and auditing
 * Stores conversion history in database for profit tracking and reporting
 */

const { pool } = require('../../../config/db');
const logger = require('../../utils/logger');

class ConversionLogger {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 50;
    this.flushInterval = 30000; // 30 seconds
    
    // Start periodic flush
    this.startBatchFlushing();
  }

  /**
   * Log a conversion
   */
  async logConversion(conversionData, metadata = {}) {
    try {
      const logEntry = {
        conversion_id: conversionData.conversionId,
        from_currency: conversionData.fromCurrency,
        to_currency: conversionData.toCurrency,
        original_amount: conversionData.originalAmount,
        converted_amount: conversionData.convertedAmount,
        base_rate: conversionData.baseRate,
        rate_with_markup: conversionData.rateWithMarkup,
        markup_percent: conversionData.markupPercent,
        markup_amount: conversionData.markupAmount,
        profit_amount: conversionData.profit.totalProfit,
        profit_currency: conversionData.profit.currency,
        provider: conversionData.provider,
        user_id: metadata.userId || null,
        phone_number: metadata.phoneNumber || null,
        transaction_ref: metadata.transactionRef || null,
        metadata: JSON.stringify(metadata),
        created_at: new Date()
      };
      
      // Add to batch queue
      this.batchQueue.push(logEntry);
      
      // Flush if batch is full
      if (this.batchQueue.length >= this.batchSize) {
        await this.flushBatch();
      }
      
    } catch (error) {
      logger.error('ConversionLogger.logConversion error:', error);
      // Don't throw - logging should not break conversion flow
    }
  }

  /**
   * Flush batch to database
   */
  async flushBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    try {
      // Build multi-row insert query
      const columns = Object.keys(batch[0]).join(', ');
      const valuePlaceholders = batch.map((_, idx) => {
        const start = idx * Object.keys(batch[0]).length + 1;
        const end = start + Object.keys(batch[0]).length;
        return `(${Array.from({ length: Object.keys(batch[0]).length }, (_, i) => `$${start + i}`).join(', ')})`;
      }).join(', ');
      
      const values = batch.flatMap(entry => Object.values(entry));
      
      const query = `
        INSERT INTO fx_conversions (${columns})
        VALUES ${valuePlaceholders}
        ON CONFLICT (conversion_id) DO NOTHING
      `;
      
      await pool.query(query, values);
      
      logger.debug(`Flushed ${batch.length} conversion logs to database`);
      
    } catch (error) {
      logger.error('Failed to flush conversion batch:', error);
      // Re-queue failed items
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Start periodic batch flushing
   */
  startBatchFlushing() {
    this.flushTimer = setInterval(async () => {
      await this.flushBatch();
    }, this.flushInterval);
  }

  /**
   * Get profit statistics for a timeframe
   */
  async getProfitStats(timeframe = '24h') {
    try {
      let timeCondition = '';
      
      switch (timeframe) {
        case '1h':
          timeCondition = "created_at > NOW() - INTERVAL '1 hour'";
          break;
        case '24h':
          timeCondition = "created_at > NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          timeCondition = "created_at > NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          timeCondition = "created_at > NOW() - INTERVAL '30 days'";
          break;
        default:
          timeCondition = "created_at > NOW() - INTERVAL '24 hours'";
      }
      
      const query = `
        SELECT 
          COUNT(*) as total_conversions,
          SUM(original_amount) as total_volume_from,
          SUM(converted_amount) as total_volume_to,
          SUM(profit_amount) as total_profit,
          SUM(markup_amount) as total_markup,
          AVG(markup_percent) as avg_markup_percent,
          from_currency,
          to_currency,
          profit_currency
        FROM fx_conversions
        WHERE ${timeCondition}
        GROUP BY from_currency, to_currency, profit_currency
        ORDER BY total_profit DESC
      `;
      
      const result = await pool.query(query);
      
      // Calculate totals across all pairs
      const totalProfit = result.rows.reduce((sum, row) => sum + parseFloat(row.total_profit || 0), 0);
      const totalConversions = result.rows.reduce((sum, row) => sum + parseInt(row.total_conversions || 0), 0);
      
      return {
        timeframe,
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        totalConversions,
        byPair: result.rows.map(row => ({
          pair: `${row.from_currency}/${row.to_currency}`,
          conversions: parseInt(row.total_conversions),
          volumeFrom: parseFloat(row.total_volume_from),
          volumeTo: parseFloat(row.total_volume_to),
          profit: parseFloat(row.total_profit),
          avgMarkup: parseFloat(row.avg_markup_percent),
          profitCurrency: row.profit_currency
        })),
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('getProfitStats error:', error);
      throw error;
    }
  }

  /**
   * Get conversion history for a user
   */
  async getUserConversionHistory(userId, limit = 20) {
    try {
      const query = `
        SELECT 
          conversion_id,
          from_currency,
          to_currency,
          original_amount,
          converted_amount,
          rate_with_markup,
          markup_percent,
          created_at
        FROM fx_conversions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
      
    } catch (error) {
      logger.error('getUserConversionHistory error:', error);
      throw error;
    }
  }

  /**
   * Cleanup old logs (retention policy)
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const query = `
        DELETE FROM fx_conversions
        WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
      `;
      
      const result = await pool.query(query);
      
      logger.info(`Cleaned up ${result.rowCount} old conversion logs`);
      
      return result.rowCount;
      
    } catch (error) {
      logger.error('cleanupOldLogs error:', error);
      throw error;
    }
  }

  /**
   * Shutdown - flush remaining logs
   */
  async shutdown() {
    clearInterval(this.flushTimer);
    await this.flushBatch();
    logger.info('ConversionLogger shutdown complete');
  }
}

module.exports = ConversionLogger;
