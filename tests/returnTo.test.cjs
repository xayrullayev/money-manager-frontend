const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeReturnTo } = require(process.env.TEST_BUILD + '/returnTo.js');

test('keeps in-app paths with query and hash', () => {
  assert.equal(sanitizeReturnTo('/budgets?month=2026-08'), '/budgets?month=2026-08');
  assert.equal(sanitizeReturnTo('/transactions?type=EXPENSE&search=bozor#x'), '/transactions?type=EXPENSE&search=bozor#x');
  assert.equal(sanitizeReturnTo('/'), '/');
});

test('rejects open redirects and non-strings', () => {
  for (const bad of ['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', 'budgets', '', null, undefined, 42, '/a\nb']) {
    assert.equal(sanitizeReturnTo(bad), null, String(bad));
  }
  assert.equal(sanitizeReturnTo('/' + 'a'.repeat(3000)), null);
});

test('never returns to auth/onboarding screens (would loop)', () => {
  for (const p of ['/login', '/login/verify', '/register?x=1', '/onboarding']) {
    assert.equal(sanitizeReturnTo(p), null, p);
  }
  assert.equal(sanitizeReturnTo('/loginhistory'), '/loginhistory');
});
