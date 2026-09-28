const { test } = require('node:test');
const assert = require('node:assert/strict');
const f = require(process.env.TEST_BUILD + '/transactionFilters.js');

const ACC = '3f2c1a9e-4b7d-4c1e-9a2b-1c2d3e4f5a6b';
const CAT = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d';
const NOW = new Date(2026, 8, 18);

test('parses a full URL into filters', () => {
  const params = new URLSearchParams(`q=korzinka&type=expense&account=${ACC}&category=${CAT}&from=2026-09-01&to=2026-09-30`);
  assert.deepEqual(f.parseFilters(params), {
    search: 'korzinka', type: 'EXPENSE', accountId: ACC, categoryId: CAT, from: '2026-09-01', to: '2026-09-30',
  });
});

test('ignores invalid values instead of failing', () => {
  const params = new URLSearchParams('type=LOAN&account=123&category=abc&from=2026-02-30&to=yesterday');
  assert.deepEqual(f.parseFilters(params), f.EMPTY_FILTERS);
});

test('swaps from/to when reversed', () => {
  const parsed = f.parseFilters(new URLSearchParams('from=2026-09-30&to=2026-09-01'));
  assert.equal(parsed.from, '2026-09-01');
  assert.equal(parsed.to, '2026-09-30');
});

test('drops category filter for TRANSFER (transfers have no category)', () => {
  const parsed = f.parseFilters(new URLSearchParams(`type=TRANSFER&category=${CAT}`));
  assert.equal(parsed.categoryId, '');
  assert.equal(f.toQuery({ ...f.EMPTY_FILTERS, type: 'TRANSFER', categoryId: CAT }).categoryId, undefined);
});

test('serializes only non-empty values and round-trips', () => {
  const filters = { ...f.EMPTY_FILTERS, search: '  taksi ', type: 'EXPENSE', from: '2026-09-01', to: '2026-09-30' };
  const params = f.filtersToSearchParams(filters);
  assert.equal(params.toString(), 'q=taksi&type=EXPENSE&from=2026-09-01&to=2026-09-30');
  assert.deepEqual(f.parseFilters(params), { ...filters, search: 'taksi' });
});

test('toQuery omits empty keys', () => {
  assert.deepEqual(f.toQuery(f.EMPTY_FILTERS), {});
  assert.deepEqual(f.toQuery({ ...f.EMPTY_FILTERS, search: ' ', accountId: ACC }), { accountId: ACC });
});

test('detects period presets from dates', () => {
  assert.equal(f.detectPeriod({ from: '', to: '' }, NOW), 'all');
  assert.equal(f.detectPeriod({ from: '2026-09-01', to: '2026-09-30' }, NOW), 'this_month');
  assert.equal(f.detectPeriod({ from: '2026-08-01', to: '2026-08-31' }, NOW), 'last_month');
  assert.equal(f.detectPeriod({ from: '2026-08-20', to: '2026-09-18' }, NOW), 'last_30_days');
  assert.equal(f.detectPeriod({ from: '2026-01-01', to: '2026-09-18' }, NOW), 'custom');
});

test('applyPeriod sets and clears dates', () => {
  assert.deepEqual(f.applyPeriod(f.EMPTY_FILTERS, 'last_month', NOW), { ...f.EMPTY_FILTERS, from: '2026-08-01', to: '2026-08-31' });
  assert.deepEqual(f.applyPeriod({ ...f.EMPTY_FILTERS, from: '2026-08-01', to: '2026-08-31' }, 'all', NOW), f.EMPTY_FILTERS);
  const custom = { ...f.EMPTY_FILTERS, from: '2026-01-05', to: '2026-02-10' };
  assert.deepEqual(f.applyPeriod(custom, 'custom', NOW), custom);
});

test('counts and removes filters', () => {
  const filters = { search: 'x', type: 'INCOME', accountId: ACC, categoryId: CAT, from: '2026-09-01', to: '2026-09-30' };
  assert.equal(f.countActiveFilters(filters), 5);
  assert.equal(f.countActiveFilters(f.removeFilter(filters, 'period')), 4);
  assert.equal(f.removeFilter(filters, 'accountId').accountId, '');
});

test('builds a report summary query from the same bounded filters as the transaction list', () => {
  const filters = {
    search: '  bozor ', type: 'EXPENSE', accountId: ACC, categoryId: CAT,
    from: '2026-09-01', to: '2026-09-30',
  };
  assert.deepEqual(f.toSummaryQuery(filters), {
    state: 'ready',
    params: {
      search: 'bozor', type: 'EXPENSE', accountId: ACC, categoryId: CAT,
      from: '2026-09-01', to: '2026-09-30',
    },
  });
});

test('does not request misleading totals without a complete bounded period', () => {
  assert.deepEqual(f.toSummaryQuery(f.EMPTY_FILTERS), { state: 'period_required' });
  assert.deepEqual(
    f.toSummaryQuery({ ...f.EMPTY_FILTERS, from: '2026-09-01' }),
    { state: 'period_required' },
  );
});

test('does not call the income-expense summary endpoint for transfers', () => {
  assert.deepEqual(
    f.toSummaryQuery({ ...f.EMPTY_FILTERS, type: 'TRANSFER', from: '2026-09-01', to: '2026-09-30' }),
    { state: 'transfer_excluded' },
  );
});
