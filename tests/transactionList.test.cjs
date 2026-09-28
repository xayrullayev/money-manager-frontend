const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mergePage } = require(process.env.TEST_BUILD + '/transactionList.js');
const { groupByDate } = require(process.env.TEST_BUILD + '/date.js');
test('pagination never repeats an overlapping transaction or mutates existing rows', () => {
  const first = [{ id: 'a', transactionDate: '2026-09-23' }];
  const next = [{ id: 'a', transactionDate: '2026-09-23' }, { id: 'b', transactionDate: '2026-09-22' }];
  assert.deepEqual(mergePage(first, next).map(x => x.id), ['a', 'b']);
  assert.equal(first.length, 1);
});
test('mobile date groups span page boundaries and preserve server ordering', () => {
  const rows = [{id:'a',transactionDate:'2026-09-23'}, {id:'b',transactionDate:'2026-09-23'}, {id:'c',transactionDate:'2026-09-22'}];
  assert.deepEqual(groupByDate(rows).map(g => [g.date, g.items.map(x => x.id)]), [['2026-09-23',['a','b']],['2026-09-22',['c']]]);
  assert.deepEqual(groupByDate([]), []);
});
