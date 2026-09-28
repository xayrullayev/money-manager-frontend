const { test } = require('node:test');
const assert = require('node:assert/strict');
const m = require(process.env.TEST_BUILD + '/money.js');
const NBSP = ' ';

test('UZS: space-grouped, no decimals, code after the number (Figma "12 450 000 UZS")', () => {
  assert.equal(m.formatMoney('12450000.00', 'UZS'), `12${NBSP}450${NBSP}000${NBSP}UZS`);
  assert.equal(m.formatMoney('500', 'UZS'), `500${NBSP}UZS`);
});

test('non-UZS keeps two decimals with a comma', () => {
  assert.equal(m.formatMoney('1234.5', 'USD'), `1${NBSP}234,50${NBSP}USD`);
});

test('signed money uses a real minus sign (U+2212) and plus', () => {
  assert.equal(m.formatSignedMoney('185000.00', 'UZS', 'EXPENSE'), `− 185${NBSP}000${NBSP}UZS`);
  assert.equal(m.formatSignedMoney('8000000', 'UZS', 'INCOME'), `+ 8${NBSP}000${NBSP}000${NBSP}UZS`);
});

test('invalid amount does not throw', () => {
  assert.equal(m.formatMoney('abc', 'UZS'), '— UZS');
});

test('amount input sanitizing keeps max 2 decimals', () => {
  assert.equal(m.sanitizeAmountInput('12a3.456'), '123.45');
  assert.equal(m.isValidPositiveAmount('0'), false);
  assert.equal(m.isValidPositiveAmount('0.01'), true);
});
