const { Pool } = require('pg');
const logger = require('../src/utils/logger');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kudipay',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const connectDB = async () => {
  try {
    await pool.connect();
    logger.info('PostgreSQL database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = { pool, connectDB };
