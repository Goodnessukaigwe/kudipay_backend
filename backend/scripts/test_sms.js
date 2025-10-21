/**
 * Test SMS Service
 * Tests sending SMS notifications using Africa's Talking
 * 
 * Usage: node scripts/test_sms.js
 */

require('dotenv').config();
const smsService = require('../src/services/smsService');
const logger = require('../src/utils/logger');

async function testSMS() {
  console.log('\n🧪 Testing SMS Service...\n');
  
  // Test phone number - USE YOUR ACTUAL PHONE NUMBER
  const testPhone = '+2347083247105'; // Replace with your number
  const testWallet = '0x810d9Db7E1298D274df6eBC2Ba84eE81029b517D';
  
  try {
    // Test 1: Registration SMS
    console.log('📱 Test 1: Registration Confirmation SMS');
    const result1 = await smsService.sendRegistrationConfirmation(testPhone, testWallet);
    console.log('  Result:', result1);
    console.log('  Status:', result1.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log();
    
    // Wait 2 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Balance Check SMS
    console.log('📱 Test 2: Balance Notification SMS');
    const result2 = await smsService.sendBalanceNotification(testPhone, testWallet, {
      ngn: 50000,
      usd: 50,
      eth: 0.025
    });
    console.log('  Result:', result2);
    console.log('  Status:', result2.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log();
    
    // Wait 2 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Money Received SMS
    console.log('📱 Test 3: Money Received Notification');
    const result3 = await smsService.sendMoneyReceivedNotification(
      testPhone,
      '+2348012345678',
      10000,
      'NGN',
      '0x4aef1dd12984aa0f4ce006300b1a1fd4ea1f269e45202cb41b686b7b29128855'
    );
    console.log('  Result:', result3);
    console.log('  Status:', result3.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log();
    
    console.log('\n📊 SMS Test Summary:');
    console.log('  Registration SMS:', result1.success ? '✅' : '❌');
    console.log('  Balance SMS:', result2.success ? '✅' : '❌');
    console.log('  Money Received SMS:', result3.success ? '✅' : '❌');
    
    console.log('\n💡 IMPORTANT NOTES:');
    console.log('  - In SANDBOX mode, SMS only works with test numbers');
    console.log('  - Add your phone number as a test number in AT dashboard');
    console.log('  - Go to: https://account.africastalking.com/apps/sandbox/test/numbers');
    console.log('  - Production mode works with all numbers (paid)');
    console.log();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

testSMS();
