const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolvePeriod } = require(process.env.TEST_BUILD + '/period.js');
test('current month preserves local calendar dates in Asia/Tashkent', () => {
  assert.deepEqual(resolvePeriod('this_month', new Date(2026,8,18)), {from:'2026-09-01',to:'2026-09-30'});
});
test('last month crosses a year boundary correctly', () => {
  assert.deepEqual(resolvePeriod('last_month', new Date(2026,0,2)), {from:'2025-12-01',to:'2025-12-31'});
});
test('last 30 days includes today at local midnight', () => {
  assert.deepEqual(resolvePeriod('last_30_days', new Date(2026,8,18,0,5)), {from:'2026-08-20',to:'2026-09-18'});
});
