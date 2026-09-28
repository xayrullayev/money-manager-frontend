const {test}=require('node:test');const assert=require('node:assert/strict');
const {periodError,reportPreset}=require(process.env.TEST_BUILD+'/reportPeriod.js');
test('366 inclusive days allowed, 367 rejected',()=>{assert.equal(periodError('2024-01-01','2024-12-31'),'');assert.notEqual(periodError('2024-01-01','2025-01-01'),'');});
test('rejects invalid calendar dates and reversed ranges',()=>{for(const [a,b] of [['2026-02-30','2026-03-01'],['2026-10-01','2026-09-01'],['','2026-09-01']])assert.notEqual(periodError(a,b),'');});
test('report presets follow profile timezone and year boundary',()=>{assert.deepEqual(reportPreset('last_month','Asia/Tashkent',new Date('2026-12-31T23:00:00Z')),{from:'2026-12-01',to:'2026-12-31'});});
const {reportPeriodSelection}=require(process.env.TEST_BUILD+'/reportPeriod.js');
test('shared custom date links display a custom period, not this month',()=>{
  assert.deepEqual(reportPeriodSelection(new URLSearchParams('from=2026-02-01&to=2026-02-10'),'Asia/Tashkent',new Date('2026-09-24T00:00:00Z')),{from:'2026-02-01',to:'2026-02-10',preset:'custom'});
});
test('preset-only links resolve dates in the profile timezone',()=>{
  assert.deepEqual(reportPeriodSelection(new URLSearchParams('preset=last_month'),'Asia/Tashkent',new Date('2026-12-31T23:00:00Z')),{from:'2026-12-01',to:'2026-12-31',preset:'last_month'});
});
test('stale or unknown preset labels never contradict explicit dates',()=>{
  for(const preset of ['this_month','invalid'])assert.equal(reportPeriodSelection(new URLSearchParams(`preset=${preset}&from=2026-02-01&to=2026-02-10`),'Asia/Tashkent',new Date('2026-09-24T00:00:00Z')).preset,'custom');
});
