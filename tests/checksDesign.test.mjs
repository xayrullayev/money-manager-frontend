import { test } from 'node:test';
import assert from 'node:assert/strict';
import { items, groups, totals, ranks, validateReceiptLink } from '../src/pages/checks-design/checkModel.ts';
test('26 qator: chegirmadan keyingi jami va guruhlar teng', () => {
 assert.equal(items.length,26);
 assert.equal(totals.gross,471856);
 assert.equal(totals.discount,19319);
 assert.equal(totals.net,452537);
 assert.equal(groups(items).reduce((a,g)=>a+g.total,0),452537);
});
test('uzum ikki qator ammo bitta xarid; sof summa', () => {
 const grape=ranks(items).find(x=>x.code==='00806001001000000');
 assert.equal(grape.amount,24481); assert.equal(grape.count,1);
});
test('OFD link input host va duplicate parametrni tekshiradi', () => {
 assert.equal(validateReceiptLink('https://ofd.soliq.uz/check?t=DEMO&r=1&c=20260928212532&s=123456789012'),null);
 for (const x of ['https://ofd.soliq.uz.evil.test/check?t=x','http://ofd.soliq.uz/check','https://user@ofd.soliq.uz/check?t=x','https://ofd.soliq.uz/check?t=a&t=b&r=1&c=20260928212532&s=1']) assert.ok(validateReceiptLink(x));
});
