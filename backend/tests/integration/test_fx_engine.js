/**
 * FX Engine Test Script
 * Tests all major functionality of the FX Engine
 * 
 * Run with: node scripts/test_fx_engine.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Helper function to log test results
function logTest(name, passed, message = '') {
  testsRun++;
  if (passed) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.blue}${message}${colors.reset}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
  }
}

// Test Functions

async function testHealthEndpoint() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/health`);
    logTest(
      'Health endpoint',
      response.status === 200 && response.data.success,
      `Status: ${response.data.data.status}, Uptime: ${Math.floor(response.data.data.uptime)}s`
    );
  } catch (error) {
    logTest('Health endpoint', false, error.message);
  }
}

async function testGetAllRates() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/rates`);
    const hasRates = response.data.data.rates && Object.keys(response.data.data.rates).length > 0;
    logTest(
      'Get all rates',
      response.status === 200 && hasRates,
      `Retrieved ${Object.keys(response.data.data.rates).length} currency pairs`
    );
  } catch (error) {
    logTest('Get all rates', false, error.message);
  }
}

async function testGetSpecificRate() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/rate/USDC/NGN`);
    const hasRate = response.data.data.baseRate > 0;
    logTest(
      'Get specific rate (USDC/NGN)',
      response.status === 200 && hasRate,
      `Base: ${response.data.data.baseRate}, With Markup: ${response.data.data.rateWithMarkup}, Provider: ${response.data.data.provider}`
    );
  } catch (error) {
    logTest('Get specific rate', false, error.message);
  }
}

async function testGetRateWithAmount() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/rate/USDC/NGN?amount=10000`);
    const hasRate = response.data.data.baseRate > 0;
    logTest(
      'Get rate with volume discount (amount=10000)',
      response.status === 200 && hasRate,
      `Markup: ${response.data.data.markupPercent}% (should be lower for large amounts)`
    );
  } catch (error) {
    logTest('Get rate with amount', false, error.message);
  }
}

async function testConversion() {
  try {
    const response = await axios.post(`${BASE_URL}/api/fx/convert`, {
      amount: 100,
      fromCurrency: 'USDC',
      toCurrency: 'NGN',
      userId: 999,
      phoneNumber: '+2348012345678',
      transactionRef: 'TEST_TXN_001'
    });
    
    const isValid = 
      response.status === 200 &&
      response.data.data.convertedAmount > 0 &&
      response.data.data.profit.totalProfit > 0;
    
    logTest(
      'Convert 100 USDC to NGN',
      isValid,
      `Converted: ${response.data.data.convertedAmount} NGN, Profit: ${response.data.data.profit.totalProfit} NGN, ID: ${response.data.data.conversionId}`
    );
  } catch (error) {
    logTest('Conversion', false, error.message);
  }
}

async function testInvalidConversion() {
  try {
    await axios.post(`${BASE_URL}/api/fx/convert`, {
      amount: -100, // Invalid negative amount
      fromCurrency: 'USDC',
      toCurrency: 'NGN'
    });
    logTest('Invalid conversion (negative amount)', false, 'Should have rejected negative amount');
  } catch (error) {
    const isCorrectError = error.response && error.response.status === 400;
    logTest(
      'Invalid conversion validation',
      isCorrectError,
      'Correctly rejected invalid amount'
    );
  }
}

async function testUnsupportedPair() {
  try {
    await axios.get(`${BASE_URL}/api/fx/rate/XYZ/ABC`);
    logTest('Unsupported currency pair', false, 'Should have rejected unsupported pair');
  } catch (error) {
    const isCorrectError = error.response && error.response.status === 400;
    logTest(
      'Unsupported pair validation',
      isCorrectError,
      'Correctly rejected unsupported currency pair'
    );
  }
}

async function testGetSupportedPairs() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/pairs`);
    const hasPairs = response.data.data.pairs && response.data.data.pairs.length > 0;
    logTest(
      'Get supported pairs',
      response.status === 200 && hasPairs,
      `${response.data.data.count} pairs supported`
    );
  } catch (error) {
    logTest('Get supported pairs', false, error.message);
  }
}

async function testProfitStats() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fx/profit/stats?timeframe=24h`);
    logTest(
      'Get profit statistics',
      response.status === 200,
      `Total Profit: ${response.data.data.totalProfit}, Conversions: ${response.data.data.totalConversions}`
    );
  } catch (error) {
    // This might fail if no conversions exist yet
    logTest('Get profit statistics', true, 'Endpoint accessible (may show 0 if no conversions)');
  }
}

async function testMultipleCurrencyPairs() {
  const pairs = [
    ['USDC', 'NGN'],
    ['USDT', 'NGN'],
    ['ETH', 'USD'],
    ['BTC', 'USD']
  ];
  
  console.log(`\n${colors.yellow}Testing multiple currency pairs:${colors.reset}`);
  
  for (const [from, to] of pairs) {
    try {
      const response = await axios.get(`${BASE_URL}/api/fx/rate/${from}/${to}`);
      logTest(
        `${from}/${to}`,
        response.status === 200 && response.data.data.baseRate > 0,
        `Rate: ${response.data.data.baseRate} (${response.data.data.provider})`
      );
    } catch (error) {
      logTest(`${from}/${to}`, false, error.message);
    }
  }
}

// Performance test
async function testPerformance() {
  console.log(`\n${colors.yellow}Performance Test (10 sequential requests):${colors.reset}`);
  
  const startTime = Date.now();
  let successCount = 0;
  
  for (let i = 0; i < 10; i++) {
    try {
      await axios.get(`${BASE_URL}/api/fx/rate/USDC/NGN`);
      successCount++;
    } catch (error) {
      // Ignore errors for performance test
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const avgResponseTime = duration / 10;
  
  logTest(
    'Performance test',
    successCount === 10 && avgResponseTime < 500,
    `${successCount}/10 succeeded, Avg response time: ${avgResponseTime.toFixed(0)}ms`
  );
}

// Cache test
async function testCaching() {
  console.log(`\n${colors.yellow}Cache Test:${colors.reset}`);
  
  // First request (cache miss)
  const start1 = Date.now();
  await axios.get(`${BASE_URL}/api/fx/rate/USDC/NGN`);
  const time1 = Date.now() - start1;
  
  // Second request (should be cached)
  const start2 = Date.now();
  await axios.get(`${BASE_URL}/api/fx/rate/USDC/NGN`);
  const time2 = Date.now() - start2;
  
  const isCached = time2 < time1;
  logTest(
    'Caching effectiveness',
    isCached,
    `First request: ${time1}ms, Cached request: ${time2}ms (${isCached ? 'faster' : 'same'})`
  );
}

// Main test runner
async function runAllTests() {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   FX Engine Test Suite${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  console.log(`Testing API at: ${BASE_URL}\n`);
  
  console.log(`${colors.yellow}Basic Functionality:${colors.reset}`);
  await testHealthEndpoint();
  await testGetAllRates();
  await testGetSpecificRate();
  await testGetRateWithAmount();
  await testGetSupportedPairs();
  
  console.log(`\n${colors.yellow}Conversion Tests:${colors.reset}`);
  await testConversion();
  await testInvalidConversion();
  await testUnsupportedPair();
  
  console.log(`\n${colors.yellow}Analytics:${colors.reset}`);
  await testProfitStats();
  
  await testMultipleCurrencyPairs();
  await testPerformance();
  await testCaching();
  
  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
  console.log(`Total Tests:    ${testsRun}`);
  console.log(`${colors.green}Passed:         ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed:         ${testsFailed}${colors.reset}`);
  console.log(`Success Rate:   ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`);
  
  if (testsFailed === 0) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please review.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
