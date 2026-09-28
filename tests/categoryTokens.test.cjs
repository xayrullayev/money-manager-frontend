const { test } = require('node:test');
const assert = require('node:assert/strict');
const t = require(process.env.TEST_BUILD + '/categoryTokens.js');

test('standard Uzbek names map to matching icons', () => {
  assert.equal(t.suggestCategoryTokens('Oziq-ovqat', 'EXPENSE').iconKey, 'food');
  assert.equal(t.suggestCategoryTokens('Sog‘liq', 'EXPENSE').iconKey, 'health');
  assert.equal(t.suggestCategoryTokens("Ko'ngilochar", 'EXPENSE').iconKey, 'entertainment');
  assert.equal(t.suggestCategoryTokens('Uy-joy va kommunal', 'EXPENSE').iconKey, 'housing');
  assert.equal(t.suggestCategoryTokens('Ish haqi', 'INCOME').iconKey, 'salary');
  assert.equal(t.suggestCategoryTokens('Sovg‘a', 'INCOME').iconKey, 'gift');
});

test('unknown names fall back to "other", every value is in the backend allowlist', () => {
  for (const [name, type] of [['Xyz', 'EXPENSE'], ['Abc', 'INCOME'], ['Obunalar', 'EXPENSE'], ['Taʼlim', 'EXPENSE']]) {
    const r = t.suggestCategoryTokens(name, type);
    assert.ok(t.CATEGORY_ICON_KEYS.includes(r.iconKey), r.iconKey);
    assert.ok(t.CATEGORY_COLOR_TOKENS.includes(r.colorToken), r.colorToken);
  }
  assert.equal(t.suggestCategoryTokens('Xyz', 'EXPENSE').iconKey, 'other');
});

test('picker metadata covers the whole allowlist exactly', () => {
  assert.deepEqual(Object.keys(t.CATEGORY_ICONS).sort(), [...t.CATEGORY_ICON_KEYS].sort());
  assert.deepEqual(Object.keys(t.CATEGORY_COLORS).sort(), [...t.CATEGORY_COLOR_TOKENS].sort());
  assert.equal(t.CATEGORY_ICON_KEYS.length, 13);
  assert.equal(t.CATEGORY_COLOR_TOKENS.length, 10);
  for (const meta of Object.values(t.CATEGORY_ICONS)) assert.ok(meta.glyph && meta.label);
});

test('toCategoryTokens keeps known values and falls back for unknown ones', () => {
  assert.deepEqual(t.toCategoryTokens('food', 'orange'), { iconKey: 'food', colorToken: 'orange' });
  assert.deepEqual(t.toCategoryTokens('<svg>', '#ff0000'), { iconKey: 'other', colorToken: 'gray' });
});
