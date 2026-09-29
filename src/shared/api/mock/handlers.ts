/**
 * Mock API — route jadvali va so'rov ishlovchilari (Frontend-check-01).
 *
 * Har bir handler `src/shared/api/*.ts` chaqiradigan endpointga mos keladi va
 * kontraktdagi turda javob qaytaradi. Mutatsiyalar `db` holatiga yoziladi.
 * Xatolar `MockHttpError` orqali Bakend-13 "Problem Details" shaklida qaytadi.
 */
import type { Account } from "../accounts";
import type { Category, CategoryType, TransactionType } from "../categories";
import type { Transaction } from "../transactions";
import type { SavingContribution, SavingPlan } from "../savings";
import type { Budget } from "../budgets";
import type { DailyLimitStatus } from "../dailyLimit";
import { db, id, money, percent, today } from "./db";

/** Bakend-13 Problem Details shaklidagi mock xato. */
export class MockHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;
  constructor(status: number, code: string, detail: string, fieldErrors?: Record<string, string>) {
    super(detail);
    this.name = "MockHttpError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface MockRequest {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockResponse {
  status: number;
  data: unknown;
}

type Handler = (req: MockRequest) => MockResponse | Promise<MockResponse>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

const routes: Route[] = [];

function route(method: string, path: string, handler: Handler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/:[^/]+/g, (match) => {
        keys.push(match.slice(1));
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method: method.toUpperCase(), pattern, keys, handler });
}

/** URL yo'liga mos routeni topib chaqiradi; topilmasa 404. */
export function dispatch(
  method: string,
  path: string,
  query: Record<string, unknown>,
  body: unknown,
  headers: Record<string, string>,
): MockResponse | Promise<MockResponse> {
  for (const r of routes) {
    if (r.method !== method.toUpperCase()) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1]);
    });
    return r.handler({ params, query, body, headers });
  }
  throw new MockHttpError(404, "NOT_FOUND", `Mock API: ${method} ${path} uchun handler yo'q.`);
}

/* --------------------------------- helpers -------------------------------- */

const ok = (data: unknown): MockResponse => ({ status: 200, data });
const created = (data: unknown): MockResponse => ({ status: 201, data });
const noContent = (): MockResponse => ({ status: 204, data: null });

function asObject(body: unknown): Record<string, unknown> {
  if (typeof body === "string") {
    try {
      return body ? (JSON.parse(body) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return (body as Record<string, unknown>) ?? {};
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function requireAuth(): void {
  if (!db.session.authenticated) {
    throw new MockHttpError(401, "UNAUTHENTICATED", "Sessiya topilmadi.");
  }
}

function findAccount(accountId: string): Account {
  const account = db.accounts.find((a) => a.id === accountId);
  if (!account) throw new MockHttpError(404, "ACCOUNT_NOT_FOUND", "Hisob topilmadi.");
  return account;
}

function adjustBalance(accountId: string, delta: number): void {
  const account = db.accounts.find((a) => a.id === accountId);
  if (account) account.balance = money(num(account.balance) + delta);
}

/** Tranzaksiyaning hisob(lar) balansiga ta'siri (INCOME +, EXPENSE −, TRANSFER ikkalasi). */
function applyTransaction(txn: Transaction, direction: 1 | -1): void {
  const amount = num(txn.amount) * direction;
  if (txn.type === "INCOME") adjustBalance(txn.accountId, amount);
  else if (txn.type === "EXPENSE") adjustBalance(txn.accountId, -amount);
  else if (txn.type === "TRANSFER" && txn.fromAccountId && txn.toAccountId) {
    adjustBalance(txn.fromAccountId, -amount);
    adjustBalance(txn.toAccountId, amount);
  }
}

/* ---------------------------------- auth ---------------------------------- */

route("GET", "/auth/csrf", () => ok({ csrf: "mock-csrf-token" }));

route("POST", "/auth/otp/request", (req) => {
  const { phone } = asObject(req.body);
  if (typeof phone !== "string" || !/^\+\d{6,15}$/.test(phone)) {
    throw new MockHttpError(400, "INVALID_PHONE", "Telefon raqami E.164 formatida bo'lishi kerak.", {
      phone: "Noto'g'ri telefon raqami",
    });
  }
  return ok({ codeExpiresInSeconds: 120, resendAvailableInSeconds: 60 });
});

route("POST", "/auth/otp/verify", (req) => {
  const { phone, code } = asObject(req.body);
  if (code !== "111111") {
    throw new MockHttpError(400, "INVALID_OTP", "Kod noto'g'ri (mock rejimda kod: 111111).", {
      code: "Kod noto'g'ri",
    });
  }
  // Demo raqam allaqachon onboarding tugatgan; boshqa raqamlar — yangi foydalanuvchi.
  const isNewUser = phone !== "+998901234567";
  db.session = { authenticated: true, isNewUser };
  db.profile.onboardingCompleted = !isNewUser;
  return ok({ isNewUser, user: { id: db.profile.id, phone: String(phone) } });
});

route("GET", "/auth/me", () => {
  requireAuth();
  return ok({
    id: db.profile.id,
    phone: "+998901234567",
    baseCurrency: db.profile.onboardingCompleted ? db.profile.baseCurrency : null,
    onboardingCompleted: db.profile.onboardingCompleted,
  });
});

route("POST", "/auth/logout", () => {
  db.session = { authenticated: false, isNewUser: false };
  return noContent();
});

/* ------------------------------- onboarding ------------------------------- */

route("POST", "/onboarding/complete", (req) => {
  requireAuth();
  const body = asObject(req.body);
  db.profile.baseCurrency = String(body.baseCurrency ?? "UZS");
  db.profile.timezone = String(body.timezone ?? "Asia/Tashkent");
  db.profile.onboardingCompleted = true;
  db.session.isNewUser = false;
  const firstAccount: Account = {
    id: id("acc"),
    name: String(body.firstAccountName ?? "Asosiy hisob"),
    type: "CASH",
    currency: db.profile.baseCurrency,
    balance: money(num(body.initialBalance)),
    archived: false,
  };
  db.accounts.unshift(firstAccount);
  return noContent();
});

/* -------------------------------- profile --------------------------------- */

route("GET", "/profile", () => {
  requireAuth();
  return ok(db.profile);
});

route("PATCH", "/profile", (req) => {
  requireAuth();
  const body = asObject(req.body);
  if (typeof body.displayName === "string") db.profile.displayName = body.displayName;
  if (typeof body.timezone === "string") db.profile.timezone = body.timezone;
  return ok(db.profile);
});

/* -------------------------------- accounts -------------------------------- */

route("GET", "/accounts", (req) => {
  requireAuth();
  const includeArchived = req.query.includeArchived === true || req.query.includeArchived === "true";
  return ok(db.accounts.filter((a) => includeArchived || !a.archived));
});

route("GET", "/accounts/summary", (req) => {
  requireAuth();
  const includeArchived = req.query.includeArchived === true || req.query.includeArchived === "true";
  const summary: Record<string, string> = {};
  db.accounts
    .filter((a) => includeArchived || !a.archived)
    .forEach((a) => {
      summary[a.currency] = money(num(summary[a.currency]) + num(a.balance));
    });
  return ok(summary);
});

route("POST", "/accounts", (req) => {
  requireAuth();
  const body = asObject(req.body);
  const account: Account = {
    id: id("acc"),
    name: String(body.name ?? "Yangi hisob"),
    type: (body.type as Account["type"]) ?? "CASH",
    currency: String(body.currency ?? db.profile.baseCurrency),
    balance: money(num(body.openingBalance)),
    archived: false,
  };
  db.accounts.push(account);
  return created(account);
});

route("PATCH", "/accounts/:id", (req) => {
  requireAuth();
  const account = findAccount(req.params.id);
  const body = asObject(req.body);
  if (typeof body.name === "string") account.name = body.name;
  if (typeof body.type === "string") account.type = body.type as Account["type"];
  return ok(account);
});

route("POST", "/accounts/:id/archive", (req) => {
  requireAuth();
  findAccount(req.params.id).archived = true;
  return noContent();
});

route("POST", "/accounts/:id/unarchive", (req) => {
  requireAuth();
  findAccount(req.params.id).archived = false;
  return noContent();
});

/* ------------------------------- categories ------------------------------- */

route("GET", "/categories", (req) => {
  requireAuth();
  const includeArchived = req.query.includeArchived === true || req.query.includeArchived === "true";
  const type = req.query.type as CategoryType | undefined;
  return ok(
    db.categories.filter((c) => (includeArchived || !c.archived) && (!type || c.type === type)),
  );
});

route("POST", "/categories", (req) => {
  requireAuth();
  const body = asObject(req.body);
  const category: Category = {
    id: id("cat"),
    name: String(body.name ?? "Yangi kategoriya"),
    type: (body.type as CategoryType) ?? "EXPENSE",
    iconKey: String(body.iconKey ?? "other"),
    colorToken: String(body.colorToken ?? "gray"),
    archived: false,
  };
  db.categories.push(category);
  return created(category);
});

route("PATCH", "/categories/:id", (req) => {
  requireAuth();
  const category = db.categories.find((c) => c.id === req.params.id);
  if (!category) throw new MockHttpError(404, "CATEGORY_NOT_FOUND", "Kategoriya topilmadi.");
  const body = asObject(req.body);
  if (typeof body.name === "string") category.name = body.name;
  if (typeof body.iconKey === "string") category.iconKey = body.iconKey;
  if (typeof body.colorToken === "string") category.colorToken = body.colorToken;
  return ok(category);
});

route("POST", "/categories/:id/archive", (req) => {
  requireAuth();
  const category = db.categories.find((c) => c.id === req.params.id);
  if (category) category.archived = true;
  return noContent();
});

route("POST", "/categories/:id/unarchive", (req) => {
  requireAuth();
  const category = db.categories.find((c) => c.id === req.params.id);
  if (category) category.archived = false;
  return noContent();
});

/* ------------------------------ transactions ------------------------------ */

function buildTransaction(body: Record<string, unknown>): Transaction {
  const type = body.type as TransactionType;
  const base = {
    id: id("txn"),
    type,
    amount: money(num(body.amount)),
    currency: db.profile.baseCurrency,
    transactionDate: String(body.transactionDate ?? today()),
    note: typeof body.note === "string" ? body.note : undefined,
    version: 1,
  };
  if (type === "TRANSFER") {
    const from = findAccount(String(body.fromAccountId));
    const to = findAccount(String(body.toAccountId));
    if (from.id === to.id) {
      throw new MockHttpError(400, "SAME_ACCOUNT_TRANSFER", "O'tkazma bitta hisob ichida bo'lishi mumkin emas.");
    }
    return {
      ...base,
      accountId: from.id,
      accountName: from.name,
      fromAccountId: from.id,
      fromAccountName: from.name,
      toAccountId: to.id,
      toAccountName: to.name,
    };
  }
  const account = findAccount(String(body.accountId));
  const category = db.categories.find((c) => c.id === body.categoryId);
  if (!category) throw new MockHttpError(400, "CATEGORY_REQUIRED", "Kategoriya majburiy.");
  return {
    ...base,
    accountId: account.id,
    accountName: account.name,
    categoryId: category.id,
    categoryName: category.name,
  };
}

route("POST", "/transactions", (req) => {
  requireAuth();
  const key = req.headers["idempotency-key"];
  if (key && db.idempotency.has(key)) {
    return created(db.idempotency.get(key));
  }
  const body = asObject(req.body);
  if (num(body.amount) <= 0) {
    throw new MockHttpError(400, "INVALID_AMOUNT", "Summa musbat bo'lishi kerak.", { amount: "Summa > 0 bo'lsin" });
  }
  const txn = buildTransaction(body);
  db.transactions.unshift(txn);
  applyTransaction(txn, 1);
  if (key) db.idempotency.set(key, txn);
  return created(txn);
});

route("GET", "/transactions", (req) => {
  requireAuth();
  const { from, to, type, accountId, categoryId, search } = req.query as Record<string, string | undefined>;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  let items = db.transactions.filter((t) => {
    if (from && t.transactionDate < from) return false;
    if (to && t.transactionDate > to) return false;
    if (type && t.type !== type) return false;
    if (accountId && t.accountId !== accountId && t.fromAccountId !== accountId && t.toAccountId !== accountId)
      return false;
    if (categoryId && t.categoryId !== categoryId) return false;
    if (search && !(t.note ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  items = [...items].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  const offset = req.query.cursor ? Number(req.query.cursor) : 0;
  const page = items.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  return ok({ items: page, nextCursor: nextOffset < items.length ? String(nextOffset) : undefined });
});

route("GET", "/transactions/:id", (req) => {
  requireAuth();
  const txn = db.transactions.find((t) => t.id === req.params.id);
  if (!txn) throw new MockHttpError(404, "TRANSACTION_NOT_FOUND", "Operatsiya topilmadi.");
  return ok(txn);
});

route("PATCH", "/transactions/:id", (req) => {
  requireAuth();
  const index = db.transactions.findIndex((t) => t.id === req.params.id);
  if (index === -1) throw new MockHttpError(404, "TRANSACTION_NOT_FOUND", "Operatsiya topilmadi.");
  const existing = db.transactions[index];
  const body = asObject(req.body);
  if (num(body.expectedVersion) !== existing.version) {
    throw new MockHttpError(409, "STALE_VERSION", "Operatsiya boshqa joyda o'zgargan. Sahifani yangilang.");
  }
  applyTransaction(existing, -1); // eski ta'sirni bekor qilib...
  const updated = { ...buildTransaction(body), id: existing.id, version: existing.version + 1 };
  db.transactions[index] = updated;
  applyTransaction(updated, 1); // ...yangisini qo'llaymiz
  return ok(updated);
});

route("DELETE", "/transactions/:id", (req) => {
  requireAuth();
  const index = db.transactions.findIndex((t) => t.id === req.params.id);
  if (index === -1) throw new MockHttpError(404, "TRANSACTION_NOT_FOUND", "Operatsiya topilmadi.");
  const existing = db.transactions[index];
  if (Number(req.query.version) !== existing.version) {
    throw new MockHttpError(409, "STALE_VERSION", "Operatsiya boshqa joyda o'zgargan. Sahifani yangilang.");
  }
  applyTransaction(existing, -1);
  db.transactions.splice(index, 1);
  return noContent();
});

/* -------------------------------- dashboard ------------------------------- */

function periodTotals(from: string, to: string, accountId?: string) {
  let income = 0;
  let expense = 0;
  db.transactions.forEach((t) => {
    if (t.transactionDate < from || t.transactionDate > to) return;
    if (accountId && t.accountId !== accountId) return;
    if (t.type === "INCOME") income += num(t.amount);
    else if (t.type === "EXPENSE") expense += num(t.amount);
  });
  return { income, expense, net: income - expense };
}

route("GET", "/dashboard/summary", (req) => {
  requireAuth();
  const from = String(req.query.from ?? today());
  const to = String(req.query.to ?? today());
  const active = db.accounts.filter((a) => !a.archived);
  const totalBalance = active.reduce((sum, a) => sum + num(a.balance), 0);
  const totals = periodTotals(from, to);
  const totalSavings = db.savingPlans.filter((p) => !p.archived).reduce((s, p) => s + num(p.currentAmount), 0);
  const totalTarget = db.savingPlans.filter((p) => !p.archived).reduce((s, p) => s + num(p.targetAmount), 0);
  const recentTransactions = [...db.transactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 5);
  return ok({
    savings: {
      totalSavings: money(totalSavings),
      totalTarget: money(totalTarget),
      currency: db.profile.baseCurrency,
      planCount: db.savingPlans.filter((p) => !p.archived).length,
    },
    totalBalance: money(totalBalance),
    currency: db.profile.baseCurrency,
    period: { from, to },
    income: money(totals.income),
    expense: money(totals.expense),
    net: money(totals.net),
    accountsCount: active.length,
    budgets: db.budgets.map((b) => ({
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      colorToken: b.colorToken,
      limit: b.limit,
      spent: b.spent,
      remaining: b.remaining,
      utilizationPercent: b.utilizationPercent,
      exceeded: b.exceeded,
    })),
    recentTransactions,
  });
});

route("GET", "/dashboard/cashflow", (req) => {
  requireAuth();
  const range = (req.query.range as string) ?? "LAST_12_MONTHS";
  const now = new Date();
  const months: Array<{ month: string; income: string; expense: string; net: string; future: boolean }> = [];
  let incomeSum = 0;
  let expenseSum = 0;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthKey = d.toISOString().slice(0, 7);
    const seed = (d.getUTCMonth() + 1) * 137;
    const income = 6_000_000 + (seed % 5) * 900_000;
    const expense = 3_500_000 + (seed % 7) * 450_000;
    incomeSum += income;
    expenseSum += expense;
    months.push({ month: monthKey, income: money(income), expense: money(expense), net: money(income - expense), future: false });
  }
  const totalBalance = db.accounts.filter((a) => !a.archived).reduce((s, a) => s + num(a.balance), 0);
  return ok({
    currency: db.profile.baseCurrency,
    range,
    period: { from: months[0].month + "-01", to: months[months.length - 1].month + "-01" },
    totalBalance: money(totalBalance),
    income: money(incomeSum),
    expense: money(expenseSum),
    net: money(incomeSum - expenseSum),
    dataSource: "MOCK",
    months,
  });
});

/* --------------------------------- budgets -------------------------------- */

route("GET", "/budgets", (req) => {
  requireAuth();
  const month = req.query.month as string | undefined;
  return ok(db.budgets.filter((b) => !month || b.month === month));
});

route("POST", "/budgets", (req) => {
  requireAuth();
  const body = asObject(req.body);
  const category = db.categories.find((c) => c.id === body.categoryId);
  if (!category) throw new MockHttpError(400, "CATEGORY_REQUIRED", "Kategoriya majburiy.");
  const limit = num(body.limit);
  const spent = 0;
  const budget: Budget = {
    id: id("bud"),
    month: String(body.month),
    categoryId: category.id,
    categoryName: category.name,
    colorToken: category.colorToken,
    limit: money(limit),
    spent: money(spent),
    remaining: money(limit - spent),
    utilizationPercent: 0,
    exceeded: false,
  };
  db.budgets.push(budget);
  return created(budget);
});

route("PATCH", "/budgets/:id", (req) => {
  requireAuth();
  const budget = db.budgets.find((b) => b.id === req.params.id);
  if (!budget) throw new MockHttpError(404, "BUDGET_NOT_FOUND", "Budjet topilmadi.");
  const limit = num(asObject(req.body).limit);
  const spent = num(budget.spent);
  budget.limit = money(limit);
  budget.remaining = money(limit - spent);
  budget.utilizationPercent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  budget.exceeded = spent > limit;
  return ok(budget);
});

route("DELETE", "/budgets/:id", (req) => {
  requireAuth();
  const index = db.budgets.findIndex((b) => b.id === req.params.id);
  if (index !== -1) db.budgets.splice(index, 1);
  return noContent();
});

/* --------------------------------- reports -------------------------------- */

route("GET", "/reports/summary", (req) => {
  requireAuth();
  const from = String(req.query.from ?? today());
  const to = String(req.query.to ?? today());
  const accountId = req.query.accountId as string | undefined;
  const totals = periodTotals(from, to, accountId);
  const count = db.transactions.filter(
    (t) => t.transactionDate >= from && t.transactionDate <= to && t.type !== "TRANSFER",
  ).length;
  return ok({
    currency: db.profile.baseCurrency,
    period: { from, to },
    income: money(totals.income),
    expense: money(totals.expense),
    net: money(totals.net),
    transactionCount: count,
  });
});

route("GET", "/reports/categories", (req) => {
  requireAuth();
  const from = String(req.query.from ?? today());
  const to = String(req.query.to ?? today());
  const type = (req.query.type as TransactionType) ?? "EXPENSE";
  const byCategory = new Map<string, { name: string; amount: number; archived: boolean }>();
  db.transactions.forEach((t) => {
    if (t.transactionDate < from || t.transactionDate > to) return;
    if (t.type !== type || !t.categoryId) return;
    const category = db.categories.find((c) => c.id === t.categoryId);
    const entry = byCategory.get(t.categoryId) ?? {
      name: t.categoryName ?? "—",
      amount: 0,
      archived: category?.archived ?? false,
    };
    entry.amount += num(t.amount);
    byCategory.set(t.categoryId, entry);
  });
  const total = [...byCategory.values()].reduce((s, e) => s + e.amount, 0);
  const items = [...byCategory.entries()].map(([categoryId, e]) => ({
    categoryId,
    categoryName: e.name,
    amount: money(e.amount),
    percent: total > 0 ? Math.round((e.amount / total) * 100) : 0,
    archived: e.archived,
  }));
  return ok({ currency: db.profile.baseCurrency, total: money(total), items });
});

route("GET", "/reports/trend", (req) => {
  requireAuth();
  const from = String(req.query.from ?? today());
  const to = String(req.query.to ?? today());
  const byMonth = new Map<string, { income: number; expense: number }>();
  db.transactions.forEach((t) => {
    if (t.transactionDate < from || t.transactionDate > to || t.type === "TRANSFER") return;
    const bucket = t.transactionDate.slice(0, 7);
    const entry = byMonth.get(bucket) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") entry.income += num(t.amount);
    else entry.expense += num(t.amount);
    byMonth.set(bucket, entry);
  });
  const points = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, e]) => ({
      bucket,
      income: money(e.income),
      expense: money(e.expense),
      net: money(e.income - e.expense),
    }));
  return ok({ currency: db.profile.baseCurrency, points });
});

route("GET", "/reports/transactions/export.csv", (req) => {
  requireAuth();
  const from = String(req.query.from ?? today());
  const to = String(req.query.to ?? today());
  const rows = db.transactions.filter((t) => t.transactionDate >= from && t.transactionDate <= to);
  const header = "date,type,amount,currency,account,category,note";
  const body = rows
    .map((t) =>
      [t.transactionDate, t.type, t.amount, t.currency, t.accountName, t.categoryName ?? "", (t.note ?? "").replace(/,/g, " ")].join(","),
    )
    .join("\n");
  return { status: 200, data: `${header}\n${body}\n` };
});

/* --------------------------------- savings -------------------------------- */

function findPlan(planId: string): SavingPlan {
  const plan = db.savingPlans.find((p) => p.id === planId);
  if (!plan) throw new MockHttpError(404, "PLAN_NOT_FOUND", "Jamg'arma rejasi topilmadi.");
  return plan;
}

function recomputePlan(plan: SavingPlan): void {
  const target = num(plan.targetAmount);
  const current = num(plan.currentAmount);
  plan.remaining = money(Math.max(0, target - current));
  plan.progressPercent = target > 0 ? Math.round((current / target) * 100) : 0;
  plan.completed = current >= target && target > 0;
}

route("GET", "/savings/plans", (req) => {
  requireAuth();
  const archived = req.query.archived === true || req.query.archived === "true";
  return ok(db.savingPlans.filter((p) => p.archived === archived));
});

route("GET", "/savings/summary", () => {
  requireAuth();
  const active = db.savingPlans.filter((p) => !p.archived);
  return ok({
    totalSavings: money(active.reduce((s, p) => s + num(p.currentAmount), 0)),
    totalTarget: money(active.reduce((s, p) => s + num(p.targetAmount), 0)),
    currency: db.profile.baseCurrency,
    planCount: active.length,
  });
});

route("GET", "/savings/plans/:id", (req) => {
  requireAuth();
  return ok(findPlan(req.params.id));
});

route("POST", "/savings/plans", (req) => {
  requireAuth();
  const body = asObject(req.body);
  const target = num(body.targetAmount);
  const plan: SavingPlan = {
    id: id("plan"),
    name: String(body.name ?? "Yangi reja"),
    iconKey: String(body.iconKey ?? "other"),
    colorToken: String(body.colorToken ?? "green"),
    targetAmount: money(target),
    currentAmount: money(0),
    remaining: money(target),
    progressPercent: 0,
    completed: false,
    archived: false,
    currency: String(body.currency ?? db.profile.baseCurrency),
    version: 1,
    dueDate: typeof body.dueDate === "string" ? body.dueDate : undefined,
  };
  db.savingPlans.push(plan);
  db.contributions[plan.id] = [];
  return created(plan);
});

route("PATCH", "/savings/plans/:id", (req) => {
  requireAuth();
  const plan = findPlan(req.params.id);
  const body = asObject(req.body);
  if (num(body.expectedVersion) !== plan.version) {
    throw new MockHttpError(409, "STALE_VERSION", "Reja boshqa joyda o'zgargan. Sahifani yangilang.");
  }
  if (typeof body.name === "string") plan.name = body.name;
  if (typeof body.iconKey === "string") plan.iconKey = body.iconKey;
  if (typeof body.colorToken === "string") plan.colorToken = body.colorToken;
  if (body.targetAmount !== undefined) plan.targetAmount = money(num(body.targetAmount));
  if (body.clearDueDate === true) plan.dueDate = undefined;
  else if (typeof body.dueDate === "string") plan.dueDate = body.dueDate;
  plan.version += 1;
  recomputePlan(plan);
  return ok(plan);
});

route("POST", "/savings/plans/:id/archive", (req) => {
  requireAuth();
  findPlan(req.params.id).archived = true;
  return noContent();
});

route("POST", "/savings/plans/:id/unarchive", (req) => {
  requireAuth();
  findPlan(req.params.id).archived = false;
  return noContent();
});

route("GET", "/savings/plans/:id/contributions", (req) => {
  requireAuth();
  const plan = findPlan(req.params.id);
  const all = db.contributions[plan.id] ?? [];
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const offset = req.query.cursor ? Number(req.query.cursor) : 0;
  const page = all.slice(offset, offset + limit);
  const nextOffset = offset + limit;
  return ok({ items: page, nextCursor: nextOffset < all.length ? String(nextOffset) : undefined });
});

route("POST", "/savings/plans/:id/contributions", (req) => {
  requireAuth();
  const plan = findPlan(req.params.id);
  const body = asObject(req.body);
  const amount = num(body.amount);
  if (amount <= 0) throw new MockHttpError(400, "INVALID_AMOUNT", "Summa musbat bo'lishi kerak.");
  const kind = (body.kind as SavingContribution["kind"]) ?? "CONTRIBUTION";
  const contribution: SavingContribution = {
    id: id("con"),
    amount: money(amount),
    kind,
    occurredOn: String(body.occurredOn ?? today()),
    note: typeof body.note === "string" ? body.note : undefined,
    createdAt: new Date().toISOString(),
  };
  (db.contributions[plan.id] ??= []).unshift(contribution);
  const delta = kind === "WITHDRAWAL" ? -amount : amount;
  plan.currentAmount = money(Math.max(0, num(plan.currentAmount) + delta));
  plan.version += 1;
  recomputePlan(plan);
  return created(contribution);
});

route("DELETE", "/savings/plans/:id/contributions/:cid", (req) => {
  requireAuth();
  const plan = findPlan(req.params.id);
  const list = db.contributions[plan.id] ?? [];
  const index = list.findIndex((c) => c.id === req.params.cid);
  if (index !== -1) {
    const [removed] = list.splice(index, 1);
    const delta = removed.kind === "WITHDRAWAL" ? num(removed.amount) : -num(removed.amount);
    plan.currentAmount = money(Math.max(0, num(plan.currentAmount) + delta));
    plan.version += 1;
    recomputePlan(plan);
  }
  return noContent();
});

route("GET", "/savings/plans/:id/balance", (req) => {
  requireAuth();
  const plan = findPlan(req.params.id);
  const year = Number(req.query.year ?? new Date().getUTCFullYear());
  const nowMonth = new Date().getUTCMonth();
  const nowYear = new Date().getUTCFullYear();
  const current = num(plan.currentAmount);
  const months = Array.from({ length: 12 }, (_, i) => {
    const future = year > nowYear || (year === nowYear && i > nowMonth);
    const fraction = (i + 1) / 12;
    return {
      month: `${year}-${String(i + 1).padStart(2, "0")}`,
      balance: future ? undefined : money(Math.round(current * fraction)),
      future,
    };
  });
  return ok({ planId: plan.id, currency: plan.currency, year, months });
});

/* ------------------------------- daily limit ------------------------------ */

function dailyLimitStatus(date: string): DailyLimitStatus {
  const spent = db.transactions
    .filter((t) => t.type === "EXPENSE" && t.transactionDate === date)
    .reduce((s, t) => s + num(t.amount), 0);
  const existing = db.dailyLimit;
  if (!existing || existing.limit === null) {
    return {
      configured: false,
      id: null,
      limit: null,
      spent: money(spent),
      remaining: null,
      percent: null,
      status: "NONE",
      date,
      currency: db.profile.baseCurrency,
      version: null,
      updatedAt: null,
    };
  }
  const limit = num(existing.limit);
  const remaining = limit - spent;
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const status: DailyLimitStatus["status"] =
    remaining < 0 ? "OVER" : pct >= 100 ? "REACHED" : pct >= 80 ? "NEAR" : "OK";
  return {
    ...existing,
    spent: money(spent),
    remaining: money(remaining),
    percent: percent(pct),
    status,
    date,
    currency: db.profile.baseCurrency,
  };
}

route("GET", "/daily-limit", (req) => {
  requireAuth();
  return ok(dailyLimitStatus(String(req.query.date ?? today())));
});

route("POST", "/daily-limit", (req) => {
  requireAuth();
  const limit = num(asObject(req.body).limit);
  db.dailyLimit = {
    configured: true,
    id: id("limit"),
    limit: money(limit),
    spent: money(0),
    remaining: money(limit),
    percent: percent(0),
    status: "OK",
    date: today(),
    currency: db.profile.baseCurrency,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  return created(dailyLimitStatus(today()));
});

route("PATCH", "/daily-limit", (req) => {
  requireAuth();
  const body = asObject(req.body);
  if (!db.dailyLimit || db.dailyLimit.version === null) {
    throw new MockHttpError(404, "DAILY_LIMIT_NOT_FOUND", "Kunlik limit o'rnatilmagan.");
  }
  if (num(body.expectedVersion) !== db.dailyLimit.version) {
    throw new MockHttpError(409, "STALE_VERSION", "Limit boshqa joyda o'zgargan. Sahifani yangilang.");
  }
  db.dailyLimit.limit = money(num(body.limit));
  db.dailyLimit.version += 1;
  db.dailyLimit.updatedAt = new Date().toISOString();
  return ok(dailyLimitStatus(today()));
});

route("DELETE", "/daily-limit", () => {
  requireAuth();
  db.dailyLimit = null;
  return noContent();
});
