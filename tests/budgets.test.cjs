const {test}=require('node:test');
const assert=require('node:assert/strict');
const b=require(process.env.TEST_BUILD+'/budgets.js');
test('month follows the user timezone across a month boundary',()=>{
 const now=new Date('2026-09-30T21:30:00Z');
 assert.equal(b.currentMonth('Asia/Tashkent',now),'2026-10');
 assert.equal(b.currentMonth('America/New_York',now),'2026-09');
});
test('month accepts real calendar months and makes leap-year drill-down dates',()=>{
 assert.equal(b.isMonth('2026-13'),false); assert.equal(b.isMonth('0000-01'),false);
 assert.equal(b.isMonth('2026-09'),true);
 assert.deepEqual(b.monthRange('2024-02'),{from:'2024-02-01',to:'2024-02-29'});
 assert.deepEqual(b.monthRange('2026-12'),{from:'2026-12-01',to:'2026-12-31'});
});
test('limit validation preserves decimal string precision and rejects invalid values',()=>{
 for(const value of ['0','-1','1e3','1.001','100000000000000000','NaN','']) assert.equal(b.validLimit(value),false,value);
 for(const value of ['0.01','125000','99999999999999999.99']) assert.equal(b.validLimit(value),true,value);
});
test('budget warning starts at 80%, overflow only after 100%',()=>{
 assert.equal(b.budgetState(79.99),'normal'); assert.equal(b.budgetState(80),'near');
 assert.equal(b.budgetState(100),'near'); assert.equal(b.budgetState(240),'exceeded');
});

test('server overflow survives rounded utilization percent',()=>{
 assert.equal(b.budgetState(100, true),'exceeded');
 assert.equal(b.budgetState(100, false),'near');
});
