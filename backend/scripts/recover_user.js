/**
 * Recovery Script: Sync blockchain registration to database
 * Use this when a user is registered on-chain but not in the database
 */
const { pool } = require('../config/db');
const phoneWalletMappingService = require('../src/services/phoneWalletMappingService');
const { generateWalletFromPhone, normalizePhoneNumber } = require('../src/utils/helpers');

async function recoverUser(phoneNumber, pin) {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log(`🔍 Checking blockchain for ${normalizedPhone}...`);
    
    // Check if registered on blockchain
    const isRegistered = await phoneWalletMappingService.isPhoneNumberRegistered(normalizedPhone);
    if (!isRegistered) {
      console.log('❌ Phone number not registered on blockchain');
      process.exit(1);
    }
    
    // Get wallet address from blockchain
    const walletAddress = await phoneWalletMappingService.getWalletForPhone(normalizedPhone);
    console.log(`✅ Found on-chain wallet: ${walletAddress}`);
    
    // Generate wallet data (to get private key)
    const walletData = generateWalletFromPhone(normalizedPhone);
    
    // Verify the wallet address matches
    if (walletData.address.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log('⚠️  WARNING: Generated wallet does not match on-chain wallet!');
      console.log('  Generated:', walletData.address);
      console.log('  On-chain:', walletAddress);
      process.exit(1);
    }
    
    // Check if user exists in database
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [normalizedPhone]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists in database');
      console.log(existingUser.rows[0]);
      process.exit(0);
    }
    
    // Insert user into database
    console.log('📝 Creating database record...');
    const result = await pool.query(`
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      normalizedPhone,
      walletData.address,
      walletData.privateKey,
      pin, // Should be hashed in production
      true,
      null, // We don't have the original tx hash
      null, // We don't have the original block number
      'base-sepolia',
      new Date()
    ]);
    
    console.log('✅ User recovered successfully!');
    console.log({
      phone: result.rows[0].phone_number,
      wallet: result.rows[0].wallet_address,
      created: result.rows[0].created_at
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get phone and PIN from command line
const phone = process.argv[2] || '+2347083247105';
const pin = process.argv[3] || '1234';

recoverUser(phone, pin);
