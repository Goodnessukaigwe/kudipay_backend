/**
 * Test Phone Number Normalization
 * Run: node backend/scripts/test_phone_normalization.js
 */

const { 
  isValidPhoneNumber, 
  normalizePhoneNumber 
} = require('../src/utils/helpers');

console.log('='.repeat(60));
console.log('Phone Number Normalization Test');
console.log('='.repeat(60));
console.log('');

// Test data
const testCases = [
  // Valid cases
  { input: '08054969639', expected: '+2348054969639', valid: true }, // Glo
  { input: '8054969639', expected: '+2348054969639', valid: true },  // Glo
  { input: '2348054969639', expected: '+2348054969639', valid: true }, // Glo
  { input: '+2348054969639', expected: '+2348054969639', valid: true }, // Glo
  { input: '08031111111', expected: '+2348031111111', valid: true }, // MTN
  { input: '09098765432', expected: '+2349098765432', valid: true }, // 9mobile
  { input: '08154969639', expected: '+2348154969639', valid: true }, // Glo (0815 is valid!)
  
  // Invalid cases
  { input: '1234567890', expected: null, valid: false },
  { input: '080549696', expected: null, valid: false }, // Too short
  { input: '07011111111', expected: null, valid: false }, // Invalid prefix (070x doesn't exist)
  { input: '06012345678', expected: null, valid: false }, // Invalid prefix (060x doesn't exist)
  { input: '12345', expected: null, valid: false },
  { input: 'abcdefghijk', expected: null, valid: false },
];

console.log('✅ VALIDATION TESTS\n');

let passedValidation = 0;
let failedValidation = 0;

testCases.forEach((test, index) => {
  const isValid = isValidPhoneNumber(test.input);
  const status = isValid === test.valid ? '✅ PASS' : '❌ FAIL';
  
  if (isValid === test.valid) {
    passedValidation++;
  } else {
    failedValidation++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Input:    ${test.input}`);
  console.log(`  Expected: ${test.valid ? 'Valid' : 'Invalid'}`);
  console.log(`  Got:      ${isValid ? 'Valid' : 'Invalid'}`);
  console.log('');
});

console.log('-'.repeat(60));
console.log(`Validation Tests: ${passedValidation} passed, ${failedValidation} failed`);
console.log('-'.repeat(60));
console.log('');

// Normalization tests
console.log('🔄 NORMALIZATION TESTS\n');

let passedNormalization = 0;
let failedNormalization = 0;

testCases.filter(t => t.valid).forEach((test, index) => {
  const normalized = normalizePhoneNumber(test.input);
  const status = normalized === test.expected ? '✅ PASS' : '❌ FAIL';
  
  if (normalized === test.expected) {
    passedNormalization++;
  } else {
    failedNormalization++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Input:    ${test.input}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Got:      ${normalized}`);
  console.log('');
});

console.log('-'.repeat(60));
console.log(`Normalization Tests: ${passedNormalization} passed, ${failedNormalization} failed`);
console.log('-'.repeat(60));
console.log('');

// Deterministic wallet test
console.log('🔐 DETERMINISTIC WALLET TEST\n');

const { generateWalletFromPhone } = require('../src/utils/helpers');

// Same phone in different formats should generate SAME wallet
const phoneFormats = [
  '08054969639',
  '8054969639',
  '2348054969639',
  '+2348054969639'
];

const wallets = phoneFormats.map(phone => {
  const normalized = normalizePhoneNumber(phone);
  const wallet = generateWalletFromPhone(normalized);
  return {
    input: phone,
    normalized,
    address: wallet.address
  };
});

console.log('Testing wallet generation for same phone in different formats:\n');

wallets.forEach((w, i) => {
  console.log(`Format ${i + 1}: ${w.input}`);
  console.log(`  Normalized: ${w.normalized}`);
  console.log(`  Wallet:     ${w.address}`);
  console.log('');
});

// Check if all wallets are the same
const allSame = wallets.every(w => w.address === wallets[0].address);
const walletStatus = allSame ? '✅ PASS' : '❌ FAIL';

console.log('-'.repeat(60));
console.log(`Deterministic Wallet Test: ${walletStatus}`);
if (allSame) {
  console.log('All formats generated the SAME wallet address ✅');
} else {
  console.log('ERROR: Different formats generated DIFFERENT wallets ❌');
}
console.log('-'.repeat(60));
console.log('');

// Summary
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

const totalPassed = passedValidation + passedNormalization + (allSame ? 1 : 0);
const totalTests = testCases.length + testCases.filter(t => t.valid).length + 1;

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalTests - totalPassed}`);
console.log('');

if (totalPassed === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Phone normalization is working correctly.');
} else {
  console.log('⚠️  SOME TESTS FAILED. Please review the implementation.');
}

console.log('='.repeat(60));
