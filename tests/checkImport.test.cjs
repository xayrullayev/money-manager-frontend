const { test } = require('node:test');
const assert = require('node:assert/strict');
const s = require(process.env.TEST_BUILD + '/importSource.js');

test('bo\'sh va noto\'g\'ri havola rad etiladi', () => {
  assert.equal(s.parseCheckSource('').ok, false);
  assert.equal(s.parseCheckSource('   ').reason, 'empty');
  assert.equal(s.parseCheckSource('salom dunyo').reason, 'invalid');
  assert.equal(s.parseCheckSource('javascript:alert(1)').reason, 'invalid');
  assert.equal(s.parseCheckSource('ftp://host/x').reason, 'invalid');
});

test('yaroqli havola normallashtiriladi', () => {
  const r = s.parseCheckSource('  HTTPS://Ofd.Soliq.uz/check?t=5&r=9  ');
  assert.equal(r.ok, true);
  assert.match(r.source.url, /^https:\/\/ofd\.soliq\.uz\/check/);
});

test('QR va qo\'lda kiritilgan bir xil havola bir xil dedupe kalitini beradi', () => {
  // parametrlar tartibi, registr, tracking va oxiridagi slash farq qilmaydi
  const fromQr = s.parseCheckSource('https://ofd.soliq.uz/check/?r=9&t=5');
  const fromPaste = s.parseCheckSource('HTTPS://OFD.soliq.uz/check?t=5&r=9&utm_source=sms');
  assert.equal(fromQr.ok && fromPaste.ok, true);
  assert.equal(fromQr.source.dedupeKey, fromPaste.source.dedupeKey);
  assert.equal(s.isSameSource(fromQr.source, fromPaste.source), true);
});

test('turli cheklar turli dedupe kalitiga ega', () => {
  const a = s.parseCheckSource('https://ofd.soliq.uz/check?t=5&r=9');
  const b = s.parseCheckSource('https://ofd.soliq.uz/check?t=5&r=10');
  assert.equal(s.isSameSource(a.source, b.source), false);
});

test('holat mashinasi: soxta muvaffaqiyat yo\'q — success faqat checkId bilan', () => {
  let st = s.INITIAL_IMPORT_STATUS;
  assert.equal(st.phase, 'idle');
  st = s.importStatusReducer(st, { type: 'start' });
  assert.equal(st.phase, 'processing');
  st = s.importStatusReducer(st, { type: 'progress', value: 60 });
  assert.equal(st.progress, 60);
  st = s.importStatusReducer(st, { type: 'success', checkId: 'chk_1' });
  assert.equal(st.phase, 'success');
  assert.equal(st.checkId, 'chk_1');
  assert.equal(st.progress, 100);
});

test('progress faqat processing bosqichida qabul qilinadi va 0–100 orasida', () => {
  let st = s.importStatusReducer(s.INITIAL_IMPORT_STATUS, { type: 'progress', value: 50 });
  assert.equal(st.phase, 'idle'); // processing emas — o'zgarmaydi
  st = s.importStatusReducer({ phase: 'processing', progress: 0 }, { type: 'progress', value: 250 });
  assert.equal(st.progress, 100);
  st = s.importStatusReducer({ phase: 'processing', progress: 0 }, { type: 'progress', value: -5 });
  assert.equal(st.progress, 0);
});

test('xato holati checkId ni tozalaydi va reset idlega qaytaradi', () => {
  let st = s.importStatusReducer({ phase: 'success', progress: 100, checkId: 'chk_1' }, { type: 'error', code: 'timeout' });
  assert.equal(st.phase, 'error');
  assert.equal(st.errorCode, 'timeout');
  assert.equal(st.checkId, undefined);
  st = s.importStatusReducer(st, { type: 'reset' });
  assert.deepEqual(st, s.INITIAL_IMPORT_STATUS);
});

test('har bir xato kodi tushunarli matn beradi (soxta muvaffaqiyat emas)', () => {
  for (const code of ['invalid-url', 'camera-unavailable', 'camera-denied', 'source-unavailable', 'timeout', 'unknown']) {
    const msg = s.importErrorMessage(code);
    assert.equal(typeof msg, 'string');
    assert.ok(msg.length > 0);
  }
});
