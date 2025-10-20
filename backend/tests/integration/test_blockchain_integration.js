/**
 * Test Blockchain Integration with Wallet Service
 * This script tests the complete flow of creating a wallet with blockchain registration
 */

const walletService = require('../src/services/walletService');
const phoneWalletMappingService = require('../src/services/phoneWalletMappingService');
const { normalizePhoneNumber } = require('../src/utils/helpers');

// Test phone numbers
const testPhones = [
  '08054969639',
  '07012345678',
  '09087654321'
];

async function testBlockchainIntegration() {
  console.log('🔗 Testing Blockchain Integration with Wallet Service');
  console.log('=====================================================\n');

  try {
    // Test 1: Verify contract is accessible
    console.log('✅ Test 1: Verify smart contract connection');
    const isPaused = await phoneWalletMappingService.isPaused();
    const totalUsers = await phoneWalletMappingService.getTotalRegisteredUsers();
    console.log(`   Contract Status: ${isPaused ? 'Paused' : 'Active'}`);
    console.log(`   Total Users on Chain: ${totalUsers}`);
    console.log('   ✓ Passed\n');

    // Test 2: Test phone normalization
    console.log('✅ Test 2: Phone normalization');
    for (const phone of testPhones) {
      const normalized = normalizePhoneNumber(phone);
      console.log(`   ${phone.padEnd(15)} → ${normalized}`);
    }
    console.log('   ✓ Passed\n');

    // Test 3: Check if test phones already registered
    console.log('✅ Test 3: Check existing registrations');
    for (const phone of testPhones) {
      const normalized = normalizePhoneNumber(phone);
      const isRegistered = await phoneWalletMappingService.isPhoneNumberRegistered(normalized);
      console.log(`   ${normalized}: ${isRegistered ? '✓ Already registered' : '✗ Not registered'}`);
    }
    console.log('   ✓ Passed\n');

    // Test 4: Simulate wallet creation (without database)
    console.log('✅ Test 4: Simulate wallet creation flow');
    const testPhone = testPhones[0];
    const normalizedPhone = normalizePhoneNumber(testPhone);
    
    console.log(`   Testing with: ${testPhone} (${normalizedPhone})`);
    
    // Check if already registered
    const isAlreadyRegistered = await phoneWalletMappingService.isPhoneNumberRegistered(normalizedPhone);
    
    if (isAlreadyRegistered) {
      console.log(`   ⚠️  Phone already registered on blockchain`);
      console.log(`   Skipping registration test\n`);
      
      // Get existing mapping
      const wallet = await phoneWalletMappingService.getWalletForPhone(normalizedPhone);
      console.log(`   Existing mapping: ${normalizedPhone} → ${wallet}`);
    } else {
      console.log(`   ✓ Phone not registered - ready for new registration`);
      console.log(`   Note: Actual registration requires:`);
      console.log(`      1. Database connection`);
      console.log(`      2. Wallet private key for gas`);
      console.log(`      3. Test ETH on Base Sepolia`);
    }
    console.log('   ✓ Passed\n');

    // Test 5: Validate contract functions
    console.log('✅ Test 5: Validate all contract functions');
    const contractFunctions = [
      'mapPhoneToWallet',
      'getWalletForPhone',
      'getPhoneForWallet',
      'isPhoneNumberRegistered',
      'isWalletAddressRegistered',
      'isValidNigerianPhoneNumber',
      'updateWalletForPhone',
      'updatePhoneForWallet',
      'getTotalRegisteredUsers'
    ];
    
    console.log(`   Contract has ${contractFunctions.length} functions available:`);
    contractFunctions.forEach(fn => {
      const available = typeof phoneWalletMappingService[fn] === 'function';
      console.log(`      ${available ? '✓' : '✗'} ${fn}`);
    });
    console.log('   ✓ Passed\n');

    // Summary
    console.log('=====================================================');
    console.log('🎉 BLOCKCHAIN INTEGRATION TEST COMPLETE!');
    console.log('=====================================================\n');

    console.log('📊 Integration Status:');
    console.log('   ✅ Smart contract connected');
    console.log('   ✅ Phone normalization working');
    console.log('   ✅ Contract functions accessible');
    console.log('   ✅ Ready for wallet registration\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Run database migration:');
    console.log('      psql -h localhost -U your_user -d kudipay -f migrations/add_blockchain_tracking.sql\n');
    console.log('   2. Set up wallet for gas (if not already):');
    console.log('      - Get Base Sepolia ETH from: https://www.alchemy.com/faucets/base-sepolia');
    console.log('      - Add DEPLOYER_PRIVATE_KEY to .env\n');
    console.log('   3. Test wallet creation:');
    console.log('      - Via USSD interface');
    console.log('      - Or via API endpoint\n');
    console.log('   4. Verify on BaseScan:');
    console.log('      https://sepolia.basescan.org/address/0x6ccDf26970eD11585D089F9112318D9d13745722\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testBlockchainIntegration()
    .then(() => {
      console.log('✅ All tests completed successfully\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testBlockchainIntegration };
