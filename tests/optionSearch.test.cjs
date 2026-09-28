const { test } = require('node:test');
const assert = require('node:assert/strict');
const s = require(process.env.TEST_BUILD + '/optionSearch.js');

const opts = [
  { value: '1', label: 'Oziq-ovqat' },
  { value: '2', label: 'Sog‘liq' },
  { value: '3', label: 'Uy-joy va kommunal' },
  { value: '4', label: 'Kommunal to‘lovlar' },
  { value: '5', label: 'Transport', disabled: true },
];

test('apostrophe variants and case do not matter', () => {
  for (const q of ['sogliq', "Sog'liq", 'SOG‘LIQ', 'sogʻ']) assert.deepEqual(s.filterOptions(opts, q).map(o => o.value), ['2'], q);
});

test('prefix matches come first, then original order; all words must match', () => {
  assert.deepEqual(s.filterOptions(opts, 'kommunal').map(o => o.value), ['4', '3']);
  assert.deepEqual(s.filterOptions(opts, 'uy kommunal').map(o => o.value), ['3']);
  assert.deepEqual(s.filterOptions(opts, '  ').length, 5);
  assert.deepEqual(s.filterOptions(opts, 'xyz'), []);
});

test('combobox threshold is 10 unless forced', () => {
  assert.equal(s.shouldUseCombobox(9), false);
  assert.equal(s.shouldUseCombobox(10), true);
  assert.equal(s.shouldUseCombobox(50, false), false);
  assert.equal(s.shouldUseCombobox(3, true), true);
});

test('keyboard navigation skips disabled options and wraps', () => {
  assert.equal(s.nextEnabledIndex(opts, 3, 1), 0); // 4 is disabled → wraps to 0
  assert.equal(s.nextEnabledIndex(opts, 0, -1), 3);
  assert.equal(s.nextEnabledIndex([{ disabled: true }], 0, 1), -1);
  assert.equal(s.nextEnabledIndex([], -1, 1), -1);
});
