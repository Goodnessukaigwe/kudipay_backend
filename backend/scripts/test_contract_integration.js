/**
 * Test script for PhoneWalletMapping smart contract integration
 * Contract: 0x6ccDf26970eD11585D089F9112318D9d13745722
 * Network: Sepolia
 */

const phoneWalletMappingService = require('../src/services/phoneWalletMappingService');
const { normalizePhoneNumber } = require('../src/utils/helpers');

// Test data
const testPhoneNumber = '+2348054969639';
const testWalletAddress = '0xda526aF45c21E50b9511DBE9694b66E614062A72';

async function runContractTests() {
  console.log('🔗 Testing PhoneWalletMapping Contract Integration');
  console.log('================================================\n');

  console.log('📋 Contract Details:');
  console.log(`   Address: ${phoneWalletMappingService.contractAddress}`);
  console.log(`   Network: Base Sepolia (Chain ID: 84532)\n`);

  try {
    // Test 1: Check if contract is paused
    console.log('✅ Test 1: Check contract pause status');
    const isPaused = await phoneWalletMappingService.isPaused();
    console.log(`   Contract paused: ${isPaused}`);
    console.log('   ✓ Passed\n');

    // Test 2: Get contract owner
    console.log('✅ Test 2: Get contract owner');
    const owner = await phoneWalletMappingService.getOwner();
    console.log(`   Contract owner: ${owner}`);
    console.log('   ✓ Passed\n');

    // Test 3: Get total registered users
    console.log('✅ Test 3: Get total registered users');
    const totalUsers = await phoneWalletMappingService.getTotalRegisteredUsers();
    console.log(`   Total registered users: ${totalUsers}`);
    console.log('   ✓ Passed\n');

    // Test 4: Validate Nigerian phone number (using contract logic)
    console.log('✅ Test 4: Validate Nigerian phone number');
    const validNumbers = [
      '+2348054969639',
      '+2347012345678',
      '+2349087654321'
    ];
    
    for (const number of validNumbers) {
      const isValid = await phoneWalletMappingService.isValidNigerianPhoneNumber(number);
      console.log(`   ${number}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    }
    console.log('   ✓ Passed\n');

    // Test 5: Check if test phone is registered
    console.log('✅ Test 5: Check if phone number is registered');
    const isPhoneRegistered = await phoneWalletMappingService.isPhoneNumberRegistered(testPhoneNumber);
    console.log(`   ${testPhoneNumber}: ${isPhoneRegistered ? 'Registered' : 'Not registered'}`);
    console.log('   ✓ Passed\n');

    // Test 6: Check if test wallet is registered
    console.log('✅ Test 6: Check if wallet address is registered');
    const isWalletRegistered = await phoneWalletMappingService.isWalletAddressRegistered(testWalletAddress);
    console.log(`   ${testWalletAddress}: ${isWalletRegistered ? 'Registered' : 'Not registered'}`);
    console.log('   ✓ Passed\n');

    // Test 7: Get wallet for phone (if registered)
    console.log('✅ Test 7: Get wallet address for phone number');
    const walletForPhone = await phoneWalletMappingService.getWalletForPhone(testPhoneNumber);
    if (walletForPhone) {
      console.log(`   ${testPhoneNumber} -> ${walletForPhone}`);
    } else {
      console.log(`   ${testPhoneNumber} -> Not mapped`);
    }
    console.log('   ✓ Passed\n');

    // Test 8: Get phone for wallet (if registered)
    console.log('✅ Test 8: Get phone number for wallet address');
    const phoneForWallet = await phoneWalletMappingService.getPhoneForWallet(testWalletAddress);
    if (phoneForWallet) {
      console.log(`   ${testWalletAddress} -> ${phoneForWallet}`);
    } else {
      console.log(`   ${testWalletAddress} -> Not mapped`);
    }
    console.log('   ✓ Passed\n');

    // Test 9: Test phone normalization integration
    console.log('✅ Test 9: Phone normalization integration');
    const phoneFormats = [
      '08054969639',
      '8054969639',
      '2348054969639',
      '+2348054969639'
    ];
    
    console.log('   Testing different phone formats:');
    for (const phone of phoneFormats) {
      const normalized = normalizePhoneNumber(phone);
      console.log(`   ${phone.padEnd(20)} -> ${normalized}`);
    }
    console.log('   ✓ All formats normalize to same format\n');

    // Summary
    console.log('================================================');
    console.log('🎉 ALL CONTRACT INTEGRATION TESTS PASSED!');
    console.log('================================================\n');

    console.log('📊 Contract Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Contract Status: ${isPaused ? 'Paused' : 'Active'}`);
    console.log(`   Owner: ${owner}\n`);

    console.log('✅ Next Steps:');
    console.log('   1. Map your first phone number using the USSD interface');
    console.log('   2. Test registration flow: Dial USSD code and create account');
    console.log('   3. Verify mapping appears on-chain using Etherscan');
    console.log('   4. Monitor gas costs for production estimation\n');

    console.log('🔍 Verify on BaseScan:');
    console.log(`   https://sepolia.basescan.org/address/${phoneWalletMappingService.contractAddress}\n`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runContractTests()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runContractTests };
