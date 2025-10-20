/**
 * Comprehensive test for all currency conversions
 */

const BinanceProvider = require('../../src/services/fx/providers/BinanceProvider');
const ChainlinkProvider = require('../../src/services/fx/providers/ChainlinkProvider');
const FallbackProvider = require('../../src/services/fx/providers/FallbackProvider');

async function testAllConversions() {
  const binance = new BinanceProvider();
  const chainlink = new ChainlinkProvider();
  const fallback = new FallbackProvider();
  
  const testCases = [
    // Crypto to USD
    { from: 'ETH', to: 'USD', provider: 'Binance' },
    { from: 'BTC', to: 'USD', provider: 'Binance' },
    { from: 'USDC', to: 'USD', provider: 'Binance' },
    { from: 'USDT', to: 'USD', provider: 'Binance' },
    
    // Crypto to NGN
    { from: 'ETH', to: 'NGN', provider: 'Binance' },
    { from: 'BTC', to: 'NGN', provider: 'Binance' },
    { from: 'USDC', to: 'NGN', provider: 'Binance' },
    { from: 'USDT', to: 'NGN', provider: 'Binance' },
    
    // Fiat conversions
    { from: 'USD', to: 'NGN', provider: 'Binance' },
    { from: 'NGN', to: 'USD', provider: 'Binance' },
    
    // Chainlink tests
    { from: 'ETH', to: 'USD', provider: 'Chainlink' },
    { from: 'ETH', to: 'NGN', provider: 'Chainlink' },
    { from: 'USD', to: 'NGN', provider: 'Chainlink' },
    
    // Fallback tests
    { from: 'ETH', to: 'NGN', provider: 'Fallback' },
    { from: 'BTC', to: 'NGN', provider: 'Fallback' },
    { from: 'USD', to: 'NGN', provider: 'Fallback' },
  ];
  
  console.log('🧪 Testing All Currency Conversions\n');
  console.log('='.repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const provider = test.provider === 'Binance' ? binance : 
                     test.provider === 'Chainlink' ? chainlink : fallback;
    
    try {
      const rate = await provider.getRate(test.from, test.to);
      
      if (rate && rate > 0) {
        console.log(`✅ ${test.provider.padEnd(10)} ${test.from}/${test.to}: ${rate.toLocaleString()}`);
        passed++;
      } else {
        console.log(`❌ ${test.provider.padEnd(10)} ${test.from}/${test.to}: Invalid rate (${rate})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.provider.padEnd(10)} ${test.from}/${test.to}: ${error.message}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('='.repeat(70));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your FX engine is working perfectly!\n');
  } else {
    console.log('\n⚠️  Some tests failed, but this might be expected for certain providers.\n');
  }
  
  // Test a real-world conversion example
  console.log('\n💰 Real-world example:');
  console.log('='.repeat(70));
  
  try {
    const ethToNgn = await binance.getRate('ETH', 'NGN');
    const usdcToNgn = await binance.getRate('USDC', 'NGN');
    const usdToNgn = await binance.getRate('USD', 'NGN');
    
    const amountEth = 0.5;
    const amountUsdc = 1000;
    const amountUsd = 100;
    
    console.log(`\n${amountEth} ETH  = ₦${(amountEth * ethToNgn).toLocaleString('en-NG', {maximumFractionDigits: 2})}`);
    console.log(`${amountUsdc} USDC = ₦${(amountUsdc * usdcToNgn).toLocaleString('en-NG', {maximumFractionDigits: 2})}`);
    console.log(`$${amountUsd} USD  = ₦${(amountUsd * usdToNgn).toLocaleString('en-NG', {maximumFractionDigits: 2})}`);
    
  } catch (error) {
    console.log('Error in real-world example:', error.message);
  }
}

testAllConversions()
  .then(() => {
    console.log('\n✨ All tests complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
