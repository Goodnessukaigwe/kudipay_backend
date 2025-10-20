/**
 * Test CoinGecko provider specifically
 */

const FallbackProvider = require('./src/services/fx/providers/FallbackProvider');

async function testCoinGecko() {
  console.log('🧪 Testing CoinGecko Provider\n');
  console.log('='.repeat(70));
  
  const fallback = new FallbackProvider();
  
  const testCases = [
    { from: 'ETH', to: 'USD' },
    { from: 'ETH', to: 'NGN' },
    { from: 'BTC', to: 'USD' },
    { from: 'BTC', to: 'NGN' },
    { from: 'USDC', to: 'USD' },
    { from: 'USDC', to: 'NGN' },
  ];
  
  for (const test of testCases) {
    try {
      console.log(`\nTesting ${test.from}/${test.to}...`);
      const rate = await fallback.getRateFromCoinGecko(test.from, test.to);
      console.log(`✅ CoinGecko ${test.from}/${test.to}: ${rate.toLocaleString()}`);
    } catch (error) {
      console.log(`❌ CoinGecko ${test.from}/${test.to}: ${error.message}`);
      console.log('   Full error:', error);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✨ Test complete!');
}

testCoinGecko()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
