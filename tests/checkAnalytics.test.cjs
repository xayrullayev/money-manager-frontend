const { test } = require('node:test');
const assert = require('node:assert/strict');
const a = require(process.env.TEST_BUILD + '/analytics/checkAnalytics.js');

function check(id, date, status, items) {
  return { id, merchantName: 'X', purchasedAt: date, currency: 'UZS', status, items };
}

// Fixture: joriy hafta (dushanba 2026-09-28) — a(29), b(28) posted; c(27) imported; e(18) shu oy; d(avgust) tashqarida.
const data = [
  check('a', '2026-09-29', 'POSTED', [
    { code: 'UZUM', name: 'Uzum Shohona', category: 'Mevalar', net: 12403 },
    { code: 'UZUM', name: 'Uzum Husayni', category: 'Mevalar', net: 12078 },
    { code: 'SABZ', name: 'Kartoshka', category: 'Sabzavotlar', net: 12100 },
  ]),
  check('b', '2026-09-28', 'POSTED', [
    { code: 'MOL', name: "Go'sht", category: '   ', net: 50000 }, // bo'sh kategoriya → noma'lum
  ]),
  check('c', '2026-09-27', 'IMPORTED', [
    { code: 'ZZZ', name: 'Import', category: 'Ichimliklar', net: 99999 }, // posted emas → reytingga kirmaydi
  ]),
  check('e', '2026-09-18', 'POSTED', [
    { code: 'BANAN', name: 'Banan', category: 'Mevalar', net: 14237 },
  ]),
  check('d', '2026-08-15', 'POSTED', [
    { code: 'SABZ', name: 'Sabzi', category: 'Sabzavotlar', net: 14670 },
  ]),
];

test('bir chekdagi ikki uzum qatori: summa 24481, frequency 1', () => {
  const r = a.aggregateChecks(data, 'week', { refDate: '2026-09-29' });
  const uzum = r.products.find((p) => p.code === 'UZUM');
  assert.equal(uzum.amount, 24481);
  assert.equal(uzum.frequency, 1);
});

test('haftalik davr: faqat posted va shu hafta cheklari', () => {
  const r = a.aggregateChecks(data, 'week', { refDate: '2026-09-29' });
  assert.equal(r.purchaseCount, 2); // a, b (c imported, e/d davrdan tashqarida)
  assert.equal(r.totalAmount, 12403 + 12078 + 12100 + 50000);
});

test('oylik davr: sentyabrdagi barcha posted cheklar (avgust tashqarida)', () => {
  const r = a.aggregateChecks(data, 'month', { refDate: '2026-09-29' });
  assert.equal(r.purchaseCount, 3); // a, b, e
});

test("bo'sh kategoriya noma'lum guruhga tushadi va summa bo'yicha saralanadi", () => {
  const r = a.aggregateChecks(data, 'week', { refDate: '2026-09-29' });
  assert.equal(r.categories[0].category, a.UNKNOWN_CATEGORY); // 50000 eng katta
  assert.equal(r.categories[0].amount, 50000);
  const amounts = r.categories.map((c) => c.amount);
  assert.deepEqual(amounts, [...amounts].sort((x, y) => y - x));
});

test("metric 'frequency' takror xaridni yuqoriga chiqaradi", () => {
  const freqData = [
    check('r1', '2026-09-29', 'POSTED', [{ code: 'MILK', name: 'Sut', category: 'Sut', net: 15000 }]),
    check('r2', '2026-09-28', 'POSTED', [{ code: 'MILK', name: 'Sut', category: 'Sut', net: 15000 }]),
    check('r3', '2026-09-29', 'POSTED', [{ code: 'TV', name: 'Katta xarid', category: 'Texnika', net: 9000000 }]),
  ];
  const byAmount = a.aggregateChecks(freqData, 'week', { refDate: '2026-09-29', metric: 'amount' });
  assert.equal(byAmount.products[0].code, 'TV'); // summa bo'yicha TV birinchi
  const byFreq = a.aggregateChecks(freqData, 'week', { refDate: '2026-09-29', metric: 'frequency' });
  assert.equal(byFreq.products[0].code, 'MILK'); // 2 marta xarid → birinchi
  assert.equal(byFreq.products[0].frequency, 2);
});

test("bo'sh davr: 0 qiymat, bo'sh ro'yxatlar (loading emas, xato emas)", () => {
  const r = a.aggregateChecks(data, 'month', { refDate: '2026-01-15' });
  assert.equal(r.purchaseCount, 0);
  assert.equal(r.totalAmount, 0);
  assert.deepEqual(r.categories, []);
  assert.deepEqual(r.products, []);
});

test('isInPeriod: hafta chegaralari (dushanba–yakshanba)', () => {
  assert.equal(a.isInPeriod('2026-09-28', 'week', '2026-09-29'), true); // dushanba
  assert.equal(a.isInPeriod('2026-09-27', 'week', '2026-09-29'), false); // oldingi yakshanba
  assert.equal(a.isInPeriod('2026-10-04', 'week', '2026-09-29'), true); // yakshanba
  assert.equal(a.isInPeriod('2026-10-05', 'week', '2026-09-29'), false); // keyingi dushanba
});

test('isInPeriod: oy chegaralari', () => {
  assert.equal(a.isInPeriod('2026-09-01', 'month', '2026-09-29'), true);
  assert.equal(a.isInPeriod('2026-09-30', 'month', '2026-09-29'), true);
  assert.equal(a.isInPeriod('2026-08-31', 'month', '2026-09-29'), false);
  assert.equal(a.isInPeriod('2026-10-01', 'month', '2026-09-29'), false);
});
