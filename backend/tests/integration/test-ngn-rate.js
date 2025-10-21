/**
 * Test script to verify USD/NGN rate fetching
 */

const axios = require('axios');

async function testNGNRate() {
  console.log('Testing USD/NGN rate fetch from open.er-api.com...\n');
  
  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
      timeout: 8000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    
    if (response.data && response.data.rates) {
      console.log('\nFound rates object with', Object.keys(response.data.rates).length, 'currencies');
      
      if (response.data.rates.NGN) {
        console.log('\n✅ SUCCESS! NGN rate found:', response.data.rates.NGN);
        console.log('   1 USD =', response.data.rates.NGN, 'NGN');
        console.log('   1 NGN =', (1 / response.data.rates.NGN).toFixed(6), 'USD');
      } else {
        console.log('\n❌ ERROR: NGN not found in rates');
        console.log('Available currencies sample:', Object.keys(response.data.rates).slice(0, 20));
      }
    } else {
      console.log('\n❌ ERROR: No rates object in response');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR fetching rate:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
}

// Also test the providers directly
async function testProviders() {
  console.log('\n\n=== Testing BinanceProvider ===\n');
  const BinanceProvider = require('../../src/services/fx/providers/BinanceProvider');
  const binance = new BinanceProvider();
  
  try {
    const rate = await binance.getRate('USD', 'NGN');
    console.log('✅ BinanceProvider USD/NGN:', rate);
  } catch (error) {
    console.error('❌ BinanceProvider error:', error.message);
  }
  
  console.log('\n=== Testing ChainlinkProvider ===\n');
  const ChainlinkProvider = require('../../src/services/fx/providers/ChainlinkProvider');
  const chainlink = new ChainlinkProvider();
  
  try {
    const rate = await chainlink.getRate('USD', 'NGN');
    console.log('✅ ChainlinkProvider USD/NGN:', rate);
  } catch (error) {
    console.error('❌ ChainlinkProvider error:', error.message);
  }
  
  console.log('\n=== Testing FallbackProvider ===\n');
  const FallbackProvider = require('../../src/services/fx/providers/FallbackProvider');
  const fallback = new FallbackProvider();
  
  try {
    const rate = await fallback.getRate('USD', 'NGN');
    console.log('✅ FallbackProvider USD/NGN:', rate);
  } catch (error) {
    console.error('❌ FallbackProvider error:', error.message);
  }
}

// Run tests
testNGNRate()
  .then(() => testProviders())
  .then(() => {
    console.log('\n\nAll tests complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
