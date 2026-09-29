/**
 * Frontend-check-05 — to'liq oqim (end-to-end) QA, mock API orqali.
 *
 * Haqiqiy `src/shared/api/*` modullari mock adapterga ulanadi (backendsiz) va
 * butun foydalanuvchi sayohati bir marta yurgiziladi: auth → onboarding →
 * hisob/kategoriya → operatsiya yaratish/tahrirlash/chek tafsiloti/"xarajatga
 * saqlash" nusxasi → dashboard → budjet → jamg'arma → kunlik limit → hisobot/CSV
 * → logout (401). Bu check-01 (mock) va check-03 (chek ekrani) ekranlari ortidagi
 * ma'lumot oqimini uchidan-uchiga tekshiradi.
 *
 * `npm test` bilan ishga tushadi (registerHooks + TS-strip loader; env.ts va
 * axios adapter test uchun almashtiriladi).
 */
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const url = new URL(specifier + ".ts", context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    // env.ts import.meta.env'ga bog'liq — testda statik obyektga almashtiramiz (mock yoqilgan).
    if (url.endsWith("/src/shared/api/env.ts")) {
      return {
        format: "module",
        source: 'export const env={apiBaseUrl:"http://mock.local/api/v1",defaultCountryCode:"+998",otpCodeLength:6,otpResendSeconds:60,apiMock:true};',
        shortCircuit: true,
      };
    }
    if (url.endsWith(".ts")) {
      return { format: "module", source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8")), shortCircuit: true };
    }
    return next(url, context);
  },
});

// client.ts request interceptor'i mutatsiyalarda document.cookie o'qiydi — brauzersiz shim.
let cookieJar = "";
globalThis.document = {
  get cookie() {
    return cookieJar;
  },
  set cookie(value) {
    cookieJar = value;
  },
};

const root = fileURLToPath(new URL("..", import.meta.url));
const { apiClient, ApiError } = await import(root + "/src/shared/api/client.ts");
const { mockAdapter } = await import(root + "/src/shared/api/mock/adapter.ts");
apiClient.defaults.adapter = mockAdapter;

const auth = await import(root + "/src/shared/api/auth.ts");
const { completeOnboarding } = await import(root + "/src/shared/api/onboarding.ts");
const accounts = await import(root + "/src/shared/api/accounts.ts");
const categories = await import(root + "/src/shared/api/categories.ts");
const transactions = await import(root + "/src/shared/api/transactions.ts");
const { fetchDashboardSummary, fetchCashflow } = await import(root + "/src/shared/api/dashboard.ts");
const budgets = await import(root + "/src/shared/api/budgets.ts");
const savings = await import(root + "/src/shared/api/savings.ts");
const dailyLimit = await import(root + "/src/shared/api/dailyLimit.ts");
const reports = await import(root + "/src/shared/api/reports.ts");
const { createIdempotencyKey } = await import(root + "/src/shared/lib/money.ts");

const isMoney = (v) => typeof v === "string" && /^-?\d+\.\d{2}$/.test(v);
const NEW_PHONE = "+998907654321";

// Testlar ketma-ket bir foydalanuvchi sayohati sifatida ishlaydi (holat baham ko'riladi).
let expenseId;
let expenseVersion;

test("01 auth: OTP so'rash va tasdiqlash (yangi foydalanuvchi)", async () => {
  const requested = await auth.requestOtp({ phone: NEW_PHONE });
  assert.equal(typeof requested.codeExpiresInSeconds, "number");
  const verified = await auth.verifyOtp({ phone: NEW_PHONE, code: "111111" });
  assert.equal(verified.isNewUser, true);
  const me = await auth.fetchMe();
  assert.equal(me.onboardingCompleted, false);
});

test("02 onboarding: yakunlangach fetchMe onboardingCompleted=true", async () => {
  await completeOnboarding({ baseCurrency: "UZS", timezone: "Asia/Tashkent", firstAccountName: "Hamyon", initialBalance: "300000" });
  const me = await auth.fetchMe();
  assert.equal(me.onboardingCompleted, true);
  assert.equal(me.baseCurrency, "UZS");
});

test("03 hisob va kategoriya yaratish", async () => {
  const account = await accounts.createAccount({ name: "Test karta", type: "CARD", openingBalance: "1000000", openingDate: "2026-09-01", currency: "UZS" });
  assert.ok(isMoney(account.balance));
  const list = await accounts.listAccounts();
  assert.ok(list.some((a) => a.id === account.id));
  const category = await categories.createCategory({ name: "Test xarajat", type: "EXPENSE", iconKey: "food", colorToken: "orange" });
  assert.equal(category.type, "EXPENSE");
});

test("04 operatsiya yaratish (idempotency) va balansga ta'sir", async () => {
  const list = await accounts.listAccounts();
  const cats = await categories.listCategories({ type: "EXPENSE" });
  const account = list[0];
  const before = Number(account.balance);
  const key = createIdempotencyKey();
  const payload = { type: "EXPENSE", amount: "75000", accountId: account.id, categoryId: cats[0].id, transactionDate: "2026-09-10", note: "QA xarajat" };
  const created = await transactions.createTransaction(payload, key);
  expenseId = created.id;
  expenseVersion = created.version;
  assert.ok(isMoney(created.amount));
  // Aynan shu kalit bilan retry — yangi yozuv yaratmaydi.
  const retried = await transactions.createTransaction(payload, key);
  assert.equal(retried.id, created.id);
  const after = (await accounts.listAccounts()).find((a) => a.id === account.id);
  assert.equal(Number(after.balance), before - 75000);
});

test("05 chek tafsiloti: getTransaction id bo'yicha", async () => {
  const tx = await transactions.getTransaction(expenseId);
  assert.equal(tx.id, expenseId);
  assert.equal(tx.note, "QA xarajat");
});

test("06 tahrirlash: expectedVersion bilan, keyin stale 409", async () => {
  const tx = await transactions.getTransaction(expenseId);
  const updated = await transactions.updateTransaction(expenseId, {
    type: "EXPENSE", amount: "80000", accountId: tx.accountId, categoryId: tx.categoryId, transactionDate: tx.transactionDate, note: "QA tahrirlandi", expectedVersion: tx.version,
  });
  assert.equal(updated.version, tx.version + 1);
  expenseVersion = updated.version;
  await assert.rejects(
    () => transactions.updateTransaction(expenseId, { type: "EXPENSE", amount: "1", accountId: tx.accountId, categoryId: tx.categoryId, transactionDate: tx.transactionDate, note: "x", expectedVersion: 1 }),
    (e) => e instanceof ApiError && e.status === 409 && e.code === "STALE_VERSION",
  );
});

test("07 xarajatga saqlash (nusxa): yangi operatsiya yaratiladi", async () => {
  const source = await transactions.getTransaction(expenseId);
  const copy = await transactions.createTransaction(
    { type: "EXPENSE", amount: source.amount, accountId: source.accountId, categoryId: source.categoryId, transactionDate: source.transactionDate, note: source.note },
    createIdempotencyKey(),
  );
  assert.notEqual(copy.id, source.id);
  assert.equal(copy.amount, source.amount);
});

test("08 dashboard: xulosa va cashflow kontrakti", async () => {
  const summary = await fetchDashboardSummary({ from: "2026-09-01", to: "2026-09-30" });
  for (const k of ["totalBalance", "income", "expense", "net"]) assert.ok(isMoney(summary[k]), k);
  assert.ok(Array.isArray(summary.recentTransactions));
  const cashflow = await fetchCashflow({ range: "LAST_12_MONTHS" });
  assert.equal(cashflow.months.length, 12);
  assert.equal(cashflow.dataSource, "MOCK");
});

test("09 budjet yaratish va ro'yxat", async () => {
  const cats = await categories.listCategories({ type: "EXPENSE" });
  const month = "2026-09";
  const created = await budgets.createBudget({ categoryId: cats[0].id, month, limit: "500000" });
  assert.ok(isMoney(created.limit));
  const list = await budgets.listBudgets(month);
  assert.ok(list.some((b) => b.id === created.id));
});

test("10 jamg'arma: reja yaratish va hissa qo'shish", async () => {
  const plan = await savings.createSavingPlan({ name: "QA reja", iconKey: "other", colorToken: "green", targetAmount: "1000000", currency: "UZS" });
  assert.equal(Number(plan.currentAmount), 0);
  const contribution = await savings.addContribution(plan.id, { amount: "250000", kind: "CONTRIBUTION", occurredOn: "2026-09-10" }, createIdempotencyKey());
  assert.equal(contribution.kind, "CONTRIBUTION");
  const refreshed = await savings.fetchSavingPlan(plan.id);
  assert.equal(Number(refreshed.currentAmount), 250000);
  const summary = await savings.fetchSavingsSummary();
  assert.ok(isMoney(summary.totalSavings));
});

test("11 kunlik limit: yaratish, o'qish, o'chirish", async () => {
  const created = await dailyLimit.createDailyLimit("200000");
  assert.equal(created.configured, true);
  const status = await dailyLimit.fetchDailyLimit();
  assert.ok(["OK", "NEAR", "REACHED", "OVER"].includes(status.status));
  await dailyLimit.deleteDailyLimit();
  const cleared = await dailyLimit.fetchDailyLimit();
  assert.equal(cleared.configured, false);
});

test("12 hisobot: summary/kategoriya/trend va CSV eksport", async () => {
  const params = { from: "2026-09-01", to: "2026-09-30" };
  const summary = await reports.reportSummary(params);
  assert.ok(isMoney(summary.income) && isMoney(summary.expense));
  const cat = await reports.reportCategories(params, "EXPENSE");
  assert.ok(Array.isArray(cat.items));
  const trend = await reports.reportTrend(params);
  assert.ok(Array.isArray(trend.points));
  const blob = await reports.exportCsv(params, new AbortController().signal);
  const text = await blob.text();
  assert.match(text.split("\n")[0], /date,type,amount/);
});

test("13 logout: keyin himoyalangan chaqiruv 401", async () => {
  await auth.logout();
  await assert.rejects(
    () => accounts.listAccounts(),
    (e) => e instanceof ApiError && e.status === 401,
  );
});
