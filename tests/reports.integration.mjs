import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Opt-in only: the target MUST be a disposable test-profile database.
// Uses the dev-only OTP log for its own new synthetic user, without printing credentials.
const args=process.argv.slice(2);
const server=args[args.indexOf('--isolated-test-server')+1];
const otpLog=args[args.indexOf('--otp-log')+1];
if(!args.includes('--isolated-test-server')||!args.includes('--otp-log'))throw new Error('Pass --isolated-test-server http://localhost:8095 --otp-log /private/tmp/mm-integration-backend.log');
const endpoint=new URL(server);
if(endpoint.protocol!=='http:'||!['localhost','127.0.0.1'].includes(endpoint.hostname)||!endpoint.port||endpoint.port==='8080')throw new Error('Use a dedicated local test server port, never the application on 8080.');
const baseUrl=endpoint.origin+'/api/v1';
const root=fileURLToPath(new URL('..',import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts')) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return {url:url.href,shortCircuit:true};
    }
    return next(specifier,context);
  },
  load(url, context, next) {
    if (url.endsWith('/src/shared/api/env.ts')) return {format:'module',source:`export const env={apiBaseUrl:${JSON.stringify(baseUrl)}};`,shortCircuit:true};
    if (url.endsWith('.ts')) return {format:'module',source:stripTypeScriptTypes(readFileSync(new URL(url),'utf8')),shortCircuit:true};
    return next(url,context);
  }
});
const jar=new Map();
const nativeFetch=globalThis.fetch;
globalThis.document={get cookie(){return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');}};
globalThis.fetch=async(input,init)=>{
  const req=new Request(input,init);
  req.headers.set('Cookie',document.cookie);
  const result=await nativeFetch(req);
  for(const cookie of result.headers.getSetCookie()) {
    const [pair]=cookie.split(';');const index=pair.indexOf('=');jar.set(pair.slice(0,index),pair.slice(index+1));
  }
  return result;
};
const {apiClient,ApiError}=await import(root+'/src/shared/api/client.ts');
apiClient.defaults.adapter='fetch';
const {reportSummary,reportCategories,reportTrend,exportCsv}=await import(root+'/src/shared/api/reports.ts');
const {fetchDashboardSummary}=await import(root+'/src/shared/api/dashboard.ts');
const {createTransaction,listTransactions}=await import(root+'/src/shared/api/transactions.ts');
const {createAccount,listAccounts}=await import(root+'/src/shared/api/accounts.ts');
const {reportPreset}=await import(root+'/src/shared/lib/reportPeriod.ts');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
async function reject(name,fn,code){await assert.rejects(fn,e=>e instanceof ApiError&&e.code===code);checks++;console.log('PASS '+name);}
try {
  await apiClient.get('/auth/csrf');
  const phone='+99890'+String(Math.floor(Math.random()*10000000)).padStart(7,'0');
  await apiClient.post('/auth/otp/request',{phone});
  const line=readFileSync(otpLog,'utf8').split('\n').findLast(line=>line.includes('OTP for '+phone+' is '));
  const code=line?.match(/ is (\d{6}) /)?.[1];assert.ok(code,'Synthetic OTP issued');
  await apiClient.post('/auth/otp/verify',{phone,code});
  await apiClient.get('/auth/csrf');
  await apiClient.post('/onboarding/complete',{baseCurrency:'UZS',timezone:'Pacific/Kiritimati',firstAccountName:'Reports QA A',initialBalance:'500.00'});
  const a=(await listAccounts())[0];
  const b=await createAccount({name:'Reports QA B',type:'CASH',currency:'UZS',openingBalance:'0.00',openingDate:'2025-01-01'});
  const categories=(await apiClient.get('/categories')).data;
  const income=categories.find(c=>c.type==='INCOME'),expense=categories.find(c=>c.type==='EXPENSE');
  const profile=(await apiClient.get('/profile')).data;
  const period=reportPreset('this_month',profile.timezone);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:profile.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const create=payload=>createTransaction({...payload,transactionDate:today},randomUUID());
  await create({type:'INCOME',amount:'100.10',accountId:a.id,categoryId:income.id});
  await create({type:'EXPENSE',amount:'20.05',accountId:a.id,categoryId:expense.id,note:'=1+1, sinov o‘g‘ri "CSV"'});
  await create({type:'TRANSFER',amount:'7.11',fromAccountId:a.id,toAccountId:b.id});
  await create({type:'EXPENSE',amount:'3.01',accountId:b.id,categoryId:expense.id});
  const summary=await reportSummary(period),cat=await reportCategories(period,'EXPENSE'),trend=await reportTrend(period);
  check('real frontend summary excludes transfer/opening',()=>assert.deepEqual([summary.income,summary.expense,summary.net,summary.transactionCount],['100.10','23.06','77.04',3]));
  check('category and monthly trend reconcile',()=>{assert.equal(cat.total,summary.expense);assert.equal(trend.points[0].expense,summary.expense);assert.equal(trend.points[0].net,summary.net);});
  const filtered=await reportSummary({...period,accountId:b.id});
  check('account filter excludes transfer in totals',()=>assert.deepEqual([filtered.income,filtered.expense],['0.00','3.01']));
  const categoryFiltered=await reportSummary({...period,type:'EXPENSE',categoryId:expense.id});
  check('transaction summary accepts the list type and category filters',()=>assert.deepEqual([categoryFiltered.income,categoryFiltered.expense],['0.00','23.06']));
  const searchFiltered=await reportSummary({...period,search:'SINOV'});
  check('transaction summary accepts the list note search',()=>assert.deepEqual([searchFiltered.expense,searchFiltered.transactionCount],['20.05',1]));
  const dashboard=await fetchDashboardSummary(period);
  check('real dashboard reconciles balances, totals and recent rows',()=>assert.deepEqual(
    [dashboard.totalBalance,dashboard.income,dashboard.expense,dashboard.net,dashboard.accountsCount,dashboard.recentTransactions.length],
    ['577.04','100.10','23.06','77.04',2,4],
  ));
  const rows=await listTransactions({...period,limit:1});
  check('CSV availability probe returns rows',()=>assert.equal(rows.items.length,1));
  const blob=await exportCsv(period,new AbortController().signal);
  const bytes=new Uint8Array(await blob.arrayBuffer()),csv=await blob.text();
  check('CSV Blob is UTF-8 BOM, CRLF, expected header',()=>{assert.deepEqual([...bytes.slice(0,3)],[239,187,191]);assert.ok(csv.startsWith('id,date,type,account,category,amount,currency,note\r\n'));});
  check('CSV contains all four rows including transfer',()=>{assert.equal(csv.split('\r\n').filter(Boolean).length,5);assert.ok(csv.includes(',TRANSFER,'));});
  check('CSV user text quoting and formula safety retained',()=>{assert.ok(csv.includes('"\'=1+1, sinov o‘g‘ri ""CSV"""'));});
  const filteredCsv=await (await exportCsv({...period,accountId:b.id},new AbortController().signal)).text();
  check('CSV account filter includes both transfer directions',()=>{assert.equal(filteredCsv.split('\r\n').filter(Boolean).length,3);assert.ok(filteredCsv.includes(',TRANSFER,'));});
  const empty={from:'2025-01-01',to:'2025-01-02'};
  const emptySummary=await reportSummary(empty),emptyRows=await listTransactions({...empty,limit:1});
  check('empty period summary and list',()=>{assert.equal(emptySummary.transactionCount,0);assert.equal(emptyRows.items.length,0);assert.equal(summary.period.from,period.from);});
  await reject('CSV 367-day JSON error decoded from Blob',()=>exportCsv({from:'2024-01-01',to:'2025-01-01'},new AbortController().signal),'DATE_RANGE_TOO_LARGE');
  await reject('missing account safely rejected',()=>reportSummary({...period,accountId:randomUUID()}),'ACCOUNT_NOT_FOUND');
  await apiClient.post('/auth/logout');
  await reject('CSV session expiration becomes ApiError',()=>exportCsv(period,new AbortController().signal),'UNAUTHENTICATED');
  console.log(`Completed ${checks} real-HTTP frontend checks; synthetic data only; Spring Boot/H2.`);
} catch(e) {console.error('FAILED '+(e.code??e.name)+': '+e.message);process.exitCode=1;}
