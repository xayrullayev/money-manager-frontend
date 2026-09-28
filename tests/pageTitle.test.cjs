const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pageTitle } = require(process.env.TEST_BUILD + '/pageTitle.js');

test('known routes get "Page · Money Manager"', () => {
  assert.equal(pageTitle('/'), 'Bosh sahifa · Money Manager');
  assert.equal(pageTitle('/budgets'), 'Budjetlar · Money Manager');
  assert.equal(pageTitle('/budgets/'), 'Budjetlar · Money Manager');
  assert.equal(pageTitle('/login/verify'), 'SMS kod · Money Manager');
});

test('unknown routes fall back to the app name', () => {
  assert.equal(pageTitle('/nope'), 'Money Manager');
});
