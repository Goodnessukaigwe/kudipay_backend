#!/usr/bin/env node

/**
 * Database Helper Script
 * Easy commands to interact with your database without SQL knowledge
 * 
 * Usage:
 *   node scripts/db-helper.js list-users
 *   node scripts/db-helper.js check-user +2347083247105
 *   node scripts/db-helper.js clear-sessions
 *   node scripts/db-helper.js stats
 */

const { pool } = require('../config/db');

const commands = {
  // List all users
  'list-users': async () => {
    console.log('\n📋 All Registered Users:\n');
    const result = await pool.query(`
      SELECT 
        id,
        phone_number,
        wallet_address,
        blockchain_network,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('  No users registered yet.\n');
    } else {
      console.table(result.rows);
    }
  },

  // Check specific user
  'check-user': async (phone) => {
    if (!phone) {
      console.error('❌ Please provide phone number: node scripts/db-helper.js check-user +2347083247105');
      process.exit(1);
    }
    
    console.log(`\n🔍 Searching for user: ${phone}\n`);
    const result = await pool.query(`
      SELECT * FROM users WHERE phone_number = $1
    `, [phone]);
    
    if (result.rows.length === 0) {
      console.log('  ❌ User not found\n');
    } else {
      console.log('  ✅ User found:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log();
    }
  },

  // Clear all USSD sessions
  'clear-sessions': async () => {
    console.log('\n🧹 Clearing all active USSD sessions...\n');
    const result = await pool.query(`
      UPDATE ussd_sessions 
      SET is_active = false 
      WHERE is_active = true
      RETURNING phone_number
    `);
    
    console.log(`  ✅ Cleared ${result.rows.length} active sessions`);
    if (result.rows.length > 0) {
      result.rows.forEach(row => console.log(`     - ${row.phone_number}`));
    }
    console.log();
  },

  // Clear specific user's session
  'clear-session': async (phone) => {
    if (!phone) {
      console.error('❌ Please provide phone number: node scripts/db-helper.js clear-session +2347083247105');
      process.exit(1);
    }
    
    console.log(`\n🧹 Clearing session for ${phone}...\n`);
    await pool.query(`
      UPDATE ussd_sessions 
      SET is_active = false 
      WHERE phone_number = $1
    `, [phone]);
    
    console.log('  ✅ Session cleared\n');
  },

  // Database statistics
  'stats': async () => {
    console.log('\n📊 Database Statistics:\n');
    
    const users = await pool.query('SELECT COUNT(*) as count FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const sessions = await pool.query('SELECT COUNT(*) as count FROM ussd_sessions WHERE is_active = true');
    const transactions = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const totalVolume = await pool.query('SELECT SUM(amount_ngn) as total FROM transactions WHERE status = \'completed\'');
    
    console.log(`  Total Users:        ${users.rows[0].count}`);
    console.log(`  Active Users:       ${activeUsers.rows[0].count}`);
    console.log(`  Active Sessions:    ${sessions.rows[0].count}`);
    console.log(`  Total Transactions: ${transactions.rows[0].count}`);
    console.log(`  Total Volume (NGN): ${totalVolume.rows[0].total || 0}`);
    console.log();
  },

  // List transactions
  'list-transactions': async (phone) => {
    console.log('\n💸 Transactions:\n');
    
    let query = 'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20';
    let params = [];
    
    if (phone) {
      query = 'SELECT * FROM transactions WHERE sender_phone = $1 OR recipient_phone = $1 ORDER BY created_at DESC';
      params = [phone];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('  No transactions found.\n');
    } else {
      console.table(result.rows.map(t => ({
        id: t.id,
        from: t.sender_phone,
        to: t.recipient_phone,
        amount: t.amount_ngn,
        status: t.status,
        date: t.created_at
      })));
    }
  },

  // Delete user (DANGER!)
  'delete-user': async (phone) => {
    if (!phone) {
      console.error('❌ Please provide phone number: node scripts/db-helper.js delete-user +2347083247105');
      process.exit(1);
    }
    
    console.log(`\n⚠️  WARNING: Deleting user ${phone}...\n`);
    console.log('This will NOT remove the on-chain registration!');
    console.log('You can recover the user later with: node scripts/recover_user.js\n');
    
    const result = await pool.query('DELETE FROM users WHERE phone_number = $1 RETURNING *', [phone]);
    
    if (result.rows.length > 0) {
      console.log('  ✅ User deleted from database');
      console.log('  📝 Deleted:', result.rows[0].wallet_address);
    } else {
      console.log('  ❌ User not found');
    }
    console.log();
  },

  // Check table structure
  'show-tables': async () => {
    console.log('\n📁 Database Tables:\n');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    console.log();
  },

  // Describe table columns
  'describe': async (tableName) => {
    if (!tableName) {
      console.error('❌ Please provide table name: node scripts/db-helper.js describe users');
      process.exit(1);
    }
    
    console.log(`\n📋 Table: ${tableName}\n`);
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (result.rows.length === 0) {
      console.log('  ❌ Table not found\n');
    } else {
      console.table(result.rows);
    }
  },

  // Help menu
  'help': () => {
    console.log(`
📚 Database Helper - Available Commands:

  User Management:
    list-users              - Show all registered users
    check-user <phone>      - Check if specific user exists
    delete-user <phone>     - Delete user from database (DANGER!)

  Sessions:
    clear-sessions          - Clear all active USSD sessions
    clear-session <phone>   - Clear session for specific user

  Transactions:
    list-transactions       - Show recent transactions
    list-transactions <ph>  - Show transactions for specific user

  Statistics:
    stats                   - Show database statistics

  Schema:
    show-tables             - List all database tables
    describe <table>        - Show table structure

  Help:
    help                    - Show this help menu

Examples:
  node scripts/db-helper.js list-users
  node scripts/db-helper.js check-user +2347083247105
  node scripts/db-helper.js clear-sessions
  node scripts/db-helper.js stats
  node scripts/db-helper.js describe users
    `);
  }
};

// Main execution
async function main() {
  const command = process.argv[2] || 'help';
  const arg = process.argv[3];

  if (!commands[command]) {
    console.error(`\n❌ Unknown command: ${command}\n`);
    commands.help();
    process.exit(1);
  }

  try {
    await commands[command](arg);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
