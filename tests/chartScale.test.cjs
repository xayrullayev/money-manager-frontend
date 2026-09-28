const { test } = require('node:test');
const assert = require('node:assert/strict');
const s = require(process.env.TEST_BUILD + '/chartScale.js');

test('niceCeil rounds up to a readable axis maximum', () => {
  assert.equal(s.niceCeil(7_300_000), 8_000_000);
  assert.equal(s.niceCeil(8_000_000), 8_000_000);
  assert.equal(s.niceCeil(2_100), 2_500);
  assert.equal(s.niceCeil(0.3), 0.4);
  assert.equal(s.niceCeil(9_100), 10_000);
});

test('niceCeil never returns 0 (all-zero series still gets an axis)', () => {
  assert.equal(s.niceCeil(0), 1);
  assert.equal(s.niceCeil(NaN), 1);
});

test('compactAmount uses Uzbek units and keeps the sign', () => {
  assert.equal(s.compactAmount(8_000_000), '8 mln');
  assert.equal(s.compactAmount(-4_000_000), '−4 mln');
  assert.equal(s.compactAmount(2_500), '2,5 ming');
  assert.equal(s.compactAmount(1_500_000_000), '1,5 mlrd');
  assert.equal(s.compactAmount(0), '0');
});
