const {test}=require('node:test');
const assert=require('node:assert/strict');
const d=require(process.env.TEST_BUILD+'/dailyLimit.js');
const m=require(process.env.TEST_BUILD+'/money.js');
const NB=' ';

test('bar width and aria-valuenow are min(percent, 100) from the percent string',()=>{
 assert.equal(d.progressValue('0'),0);
 assert.equal(d.progressValue('0.0'),0);
 assert.equal(d.progressValue('12.5'),12.5);
 assert.equal(d.progressValue('100.0'),100);
 assert.equal(d.progressValue('240.3'),100);
 assert.equal(d.progressValue(null),0);
 assert.equal(d.progressValue('abc'),0);
 assert.equal(d.progressValue('-5'),0);
});

test('visible percent keeps the server string',()=>{
 assert.equal(d.percentLabel('12.5'),'12.5%');
 assert.equal(d.percentLabel('240.3'),'240.3%');
 assert.equal(d.percentLabel(null),'0%');
});

test('aria-valuetext matches the contract wording',()=>{
 assert.equal(d.progressValueText('2500000.00','20000000.00','12.5','UZS'),`2${NB}500${NB}000${NB}UZS / 20${NB}000${NB}000${NB}UZS, 12.5%`);
 assert.equal(d.progressValueText('0.00','20000.00','0.0','UZS'),`0${NB}UZS / 20${NB}000${NB}UZS, 0.0%`);
});

test('status maps to tone and text (never colour alone)',()=>{
 assert.deepEqual(d.statusMessage('NONE',null,'UZS'),{tone:'neutral',text:null});
 assert.deepEqual(d.statusMessage('OK','17500.00','UZS'),{tone:'neutral',text:null});
 assert.deepEqual(d.statusMessage('NEAR','1000.00','UZS'),{tone:'warning',text:'Limitga yaqinlashdingiz'});
 assert.deepEqual(d.statusMessage('REACHED','0.00','UZS'),{tone:'danger',text:'Kunlik limitga yetdingiz'});
 assert.deepEqual(d.statusMessage('OVER','-1200.00','UZS'),{tone:'danger',text:`Limitdan 1${NB}200${NB}UZS oshdi`});
});

test('over-limit amount comes from negative remaining by string manipulation',()=>{
 assert.equal(d.overLimitAmount('-1200.00'),'1200.00');
 assert.equal(d.overLimitAmount('-99999999999999999.99'),'99999999999999999.99');
 assert.equal(d.overLimitAmount('0.00'),null);
 assert.equal(d.overLimitAmount('-0.00'),null);
 assert.equal(d.overLimitAmount('17500.00'),null);
 assert.equal(d.overLimitAmount(null),null);
 // Katta summa float'ga aylanmaydi: 17 xonali oshish aniq ko'rsatiladi.
 assert.equal(d.statusMessage('OVER','-99999999999999999.00','UZS').text,`Limitdan 99${NB}999${NB}999${NB}999${NB}999${NB}999${NB}UZS oshdi`);
});

test('limit input validation reuses the budget rule',()=>{
 assert.equal(d.validateLimitInput(''),d.LIMIT_REQUIRED_MESSAGE);
 assert.equal(d.validateLimitInput('   '),d.LIMIT_REQUIRED_MESSAGE);
 assert.equal(d.validateLimitInput('0'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('0.00'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('-5'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('10.001'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('123456789012345678'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('1e5'),d.LIMIT_INVALID_MESSAGE);
 assert.equal(d.validateLimitInput('12345678901234567'),null);
 assert.equal(d.validateLimitInput('99999999999999999.99'),null);
 assert.equal(d.validateLimitInput('0.01'),null);
 assert.equal(d.validateLimitInput('2 500 000'),null);
 assert.equal(d.validateLimitInput('2500000,50'),null);
 assert.equal(d.normalizeLimitInput('2 500 000,5'),'2500000.5');
});

test('edit prefill drops a trailing .00 only',()=>{
 assert.equal(d.limitInputValue('20000.00'),'20000');
 assert.equal(d.limitInputValue('20000.50'),'20000.50');
 assert.equal(d.limitInputValue(null),'');
});

test('money formatter keeps 17-digit decimal strings exact',()=>{
 assert.equal(m.formatMoney('99999999999999999.00','UZS'),`99${NB}999${NB}999${NB}999${NB}999${NB}999${NB}UZS`);
 assert.equal(m.formatMoney('12345678901234567.25','USD'),`12${NB}345${NB}678${NB}901${NB}234${NB}567,25${NB}USD`);
});
