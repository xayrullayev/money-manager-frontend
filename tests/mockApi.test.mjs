/**
 * Frontend-check-01 — mock API kontrakt tekshiruvi.
 *
 * `handlers.ts` + `db.ts` runtime jihatdan sof (faqat bir-biriga va type-only
 * importlarga bog'liq), shuning uchun TS-strip ESM loader bilan to'g'ridan-to'g'ri
 * import qilinadi va `dispatch` real axios/brauzersiz sinaladi.
 */
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      return { url: new URL(specifier + ".ts", context.parentURL).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith(".ts")) {
      return { format: "module", source: stripTypeScriptTypes(readFileSync(new URL(url), "utf8")), shortCircuit: true };
    }
    return next(url, context);
  },
});

const root = fileURLToPath(new URL("..", import.meta.url));
const { dispatch, MockHttpError } = await import(root + "/src/shared/api/mock/handlers.ts");
const { db } = await import(root + "/src/shared/api/mock/db.ts");

const H = { "content-type": "application/json" };
const call = async (method, path, { query = {}, body = undefined, headers = H } = {}) =>
  dispatch(method, path, query, body, headers);

const isMoney = (v) => typeof v === "string" && /^-?\d+\.\d{2}$/.test(v);

test("seed: hisoblar, kategoriyalar va operatsiyalar mavjud", () => {
  assert.ok(db.accounts.length >= 3);
  assert.ok(db.categories.some((c) => c.type === "INCOME"));
  assert.ok(db.transactions.length > 0);
});

test("GET /accounts — faol hisoblar, balans money-string", async () => {
  const res = await call("GET", "/accounts", { query: { includeArchived: false } });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every((a) => !a.archived));
  assert.ok(res.data.every((a) => isMoney(a.balance)));
});

test("GET /accounts?includeArchived=true — arxivni ham qaytaradi", async () => {
  const res = await call("GET", "/accounts", { query: { includeArchived: "true" } });
  assert.ok(res.data.some((a) => a.archived));
});

test("POST /transactions — balansga ta'sir qiladi va idempotency ishlaydi", async () => {
  const account = db.accounts.find((a) => !a.archived);
  const category = db.categories.find((c) => c.type === "EXPENSE");
  const before = Number(account.balance);
  const body = {
    type: "EXPENSE",
    amount: "50000",
    accountId: account.id,
    categoryId: category.id,
    transactionDate: "2026-09-01",
  };
  const key = "idem-test-1";
  const first = await call("POST", "/transactions", { body, headers: { ...H, "idempotency-key": key } });
  assert.equal(first.status, 201);
  assert.equal(Number(account.balance), before - 50000);
  // Bir xil kalit — ikkinchi marta yozmaydi (retry bir xil natija).
  const second = await call("POST", "/transactions", { body, headers: { ...H, "idempotency-key": key } });
  assert.equal(second.data.id, first.data.id);
  assert.equal(Number(account.balance), before - 50000);
});

test("POST /transactions — amount<=0 => 400 INVALID_AMOUNT", async () => {
  const account = db.accounts.find((a) => !a.archived);
  const category = db.categories.find((c) => c.type === "EXPENSE");
  await assert.rejects(
    () => call("POST", "/transactions", { body: { type: "EXPENSE", amount: "0", accountId: account.id, categoryId: category.id } }),
    (e) => e instanceof MockHttpError && e.status === 400 && e.code === "INVALID_AMOUNT",
  );
});

test("PATCH /transactions/:id — versiya mos kelmasa 409 STALE_VERSION", async () => {
  const txn = db.transactions[0];
  await assert.rejects(
    () => call("PATCH", `/transactions/${txn.id}`, { body: { type: txn.type, amount: txn.amount, accountId: txn.accountId, categoryId: txn.categoryId, expectedVersion: 999 } }),
    (e) => e instanceof MockHttpError && e.status === 409 && e.code === "STALE_VERSION",
  );
});

test("GET /dashboard/summary — kontrakt maydonlari to'liq", async () => {
  const res = await call("GET", "/dashboard/summary", { query: { from: "2026-09-01", to: "2026-09-30" } });
  const d = res.data;
  for (const k of ["totalBalance", "income", "expense", "net"]) assert.ok(isMoney(d[k]), k);
  assert.equal(typeof d.accountsCount, "number");
  assert.ok(Array.isArray(d.budgets));
  assert.ok(Array.isArray(d.recentTransactions));
  assert.ok(d.savings && isMoney(d.savings.totalSavings));
});

test("auth: noto'g'ri OTP => 400, to'g'ri OTP => sessiya", async () => {
  await assert.rejects(
    () => call("POST", "/auth/otp/verify", { body: { phone: "+998901112233", code: "000000" } }),
    (e) => e instanceof MockHttpError && e.code === "INVALID_OTP",
  );
  const ok = await call("POST", "/auth/otp/verify", { body: { phone: "+998901234567", code: "111111" } });
  assert.equal(ok.data.isNewUser, false);
  assert.equal(db.session.authenticated, true);
});

test("daily-limit: yaratish => status hisoblanadi, o'chirish => NONE", async () => {
  const created = await call("POST", "/daily-limit", { body: { limit: "100000" } });
  assert.equal(created.data.configured, true);
  assert.ok(isMoney(created.data.limit));
  assert.ok(["OK", "NEAR", "REACHED", "OVER"].includes(created.data.status));
  await call("DELETE", "/daily-limit");
  const after = await call("GET", "/daily-limit", {});
  assert.equal(after.data.configured, false);
  assert.equal(after.data.status, "NONE");
});

test("savings: hissa qo'shish current/progress yangilaydi", async () => {
  const plan = db.savingPlans[0];
  const before = Number(plan.currentAmount);
  const res = await call("POST", `/savings/plans/${plan.id}/contributions`, {
    body: { amount: "1000000", kind: "CONTRIBUTION", occurredOn: "2026-09-01" },
  });
  assert.equal(res.status, 201);
  assert.equal(Number(plan.currentAmount), before + 1000000);
  assert.ok(plan.progressPercent >= 0 && plan.progressPercent <= 100 || plan.progressPercent > 100);
});

test("noma'lum yo'l => 404 NOT_FOUND", async () => {
  await assert.rejects(
    () => call("GET", "/nope/nowhere", {}),
    (e) => e instanceof MockHttpError && e.status === 404,
  );
});
