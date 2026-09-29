/**
 * Mock API — in-memory store va seed data (Frontend-check-01).
 *
 * Bu modul faqat `VITE_API_MOCK` yoqilganda yuklanadi. Ma'lumotlar brauzer
 * sahifasi ochilganda bir marta seed qilinadi va sahifa yopilguncha (yoki
 * yangilanguncha) saqlanadi — mutatsiyalar (create/update/delete) shu yerdagi
 * holatga yoziladi, shuning uchun UI real backenddagidek "javob beradi".
 *
 * Barcha turlar `src/shared/api/*.ts` dagi kontrakt interfeyslariga bog'langan,
 * shuning uchun `tsc` mock javoblarini kontraktga qarab tekshiradi (bu — "check
 * API client turlar" qismi).
 */
import type { Account } from "../accounts";
import type { Category } from "../categories";
import type { Transaction } from "../transactions";
import type { SavingContribution, SavingPlan } from "../savings";
import type { Budget } from "../budgets";
import type { DailyLimitStatus } from "../dailyLimit";
import type { Profile } from "../profile";

/** API pul maydonlari — 2 kasrli string ("150000.00"). */
export function money(value: number): string {
  return value.toFixed(2);
}

/** Foiz — 1 kasr, HALF_UP ("12.5"). */
export function percent(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

let counter = 1;
/** Deterministik, o'qilishi oson id — "mock-acc-1" kabi. */
export function id(prefix: string): string {
  return `mock-${prefix}-${counter++}`;
}

/** "YYYY-MM-DD" — bugungi sana (test uchun `now` override qilinadi). */
export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Bugundan `days` kun oldingi sana (manfiy — kelajak). */
export function daysAgo(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export interface MockSession {
  authenticated: boolean;
  isNewUser: boolean;
}

export interface MockDb {
  session: MockSession;
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  savingPlans: SavingPlan[];
  contributions: Record<string, SavingContribution[]>;
  budgets: Budget[];
  dailyLimit: DailyLimitStatus | null;
  /** Idempotency-Key -> yaratilgan tranzaksiya (Bakend-10: retry bir xil natija). */
  idempotency: Map<string, Transaction>;
}

const CURRENCY = "UZS";

function seedAccounts(): Account[] {
  return [
    { id: id("acc"), name: "Naqd pul", type: "CASH", currency: CURRENCY, balance: money(1_250_000), archived: false },
    { id: id("acc"), name: "Uzcard", type: "CARD", currency: CURRENCY, balance: money(4_820_000), archived: false },
    { id: id("acc"), name: "Hamkorbank", type: "BANK", currency: CURRENCY, balance: money(9_140_000), archived: false },
    { id: id("acc"), name: "Eski hamyon", type: "CASH", currency: CURRENCY, balance: money(0), archived: true },
  ];
}

function seedCategories(): Category[] {
  return [
    { id: id("cat"), name: "Oylik maosh", type: "INCOME", iconKey: "salary", colorToken: "green", archived: false },
    { id: id("cat"), name: "Freelance", type: "INCOME", iconKey: "freelance", colorToken: "teal", archived: false },
    { id: id("cat"), name: "Oziq-ovqat", type: "EXPENSE", iconKey: "food", colorToken: "orange", archived: false },
    { id: id("cat"), name: "Transport", type: "EXPENSE", iconKey: "transport", colorToken: "blue", archived: false },
    { id: id("cat"), name: "Uy-joy", type: "EXPENSE", iconKey: "housing", colorToken: "purple", archived: false },
    { id: id("cat"), name: "Ko'ngilochar", type: "EXPENSE", iconKey: "entertainment", colorToken: "pink", archived: false },
    { id: id("cat"), name: "Ta'lim", type: "EXPENSE", iconKey: "education", colorToken: "yellow", archived: false },
  ];
}

function seedTransactions(accounts: Account[], categories: Category[]): Transaction[] {
  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");
  const [cash, card, bank] = accounts;
  const rows: Array<Omit<Transaction, "id" | "version">> = [
    { type: "INCOME", amount: money(9_000_000), currency: CURRENCY, accountId: bank.id, accountName: bank.name, categoryId: income[0].id, categoryName: income[0].name, transactionDate: daysAgo(1), note: "Sentabr oyligi" },
    { type: "EXPENSE", amount: money(185_000), currency: CURRENCY, accountId: card.id, accountName: card.name, categoryId: expense[0].id, categoryName: expense[0].name, transactionDate: daysAgo(1), note: "Korzinka" },
    { type: "EXPENSE", amount: money(45_000), currency: CURRENCY, accountId: cash.id, accountName: cash.name, categoryId: expense[1].id, categoryName: expense[1].name, transactionDate: daysAgo(2), note: "Taksi" },
    { type: "EXPENSE", amount: money(2_400_000), currency: CURRENCY, accountId: bank.id, accountName: bank.name, categoryId: expense[2].id, categoryName: expense[2].name, transactionDate: daysAgo(3), note: "Ijara" },
    { type: "INCOME", amount: money(1_500_000), currency: CURRENCY, accountId: card.id, accountName: card.name, categoryId: income[1].id, categoryName: income[1].name, transactionDate: daysAgo(5), note: "Loyiha to'lovi" },
    { type: "EXPENSE", amount: money(120_000), currency: CURRENCY, accountId: card.id, accountName: card.name, categoryId: expense[3].id, categoryName: expense[3].name, transactionDate: daysAgo(6), note: "Kino" },
    {
      type: "TRANSFER",
      amount: money(500_000),
      currency: CURRENCY,
      accountId: bank.id,
      accountName: bank.name,
      fromAccountId: bank.id,
      fromAccountName: bank.name,
      toAccountId: cash.id,
      toAccountName: cash.name,
      transactionDate: daysAgo(4),
      note: "Naqdga yechish",
    },
  ];
  return rows.map((row) => ({ ...row, id: id("txn"), version: 1 }));
}

function seedSavingPlans(): SavingPlan[] {
  const make = (
    name: string,
    iconKey: string,
    colorToken: string,
    target: number,
    current: number,
    dueDate?: string,
  ): SavingPlan => {
    const remaining = Math.max(0, target - current);
    return {
      id: id("plan"),
      name,
      iconKey,
      colorToken,
      targetAmount: money(target),
      currentAmount: money(current),
      remaining: money(remaining),
      progressPercent: target > 0 ? Math.round((current / target) * 100) : 0,
      completed: current >= target,
      archived: false,
      currency: CURRENCY,
      version: 1,
      dueDate,
    };
  };
  return [
    make("Favqulodda jamg'arma", "emergency", "green", 20_000_000, 12_500_000),
    make("Sayohat — Turkiya", "travel", "blue", 8_000_000, 3_200_000, daysAgo(-120)),
    make("Yangi noutbuk", "gadget", "purple", 15_000_000, 15_000_000),
  ];
}

function seedBudgets(categories: Category[], month: string): Budget[] {
  const expense = categories.filter((c) => c.type === "EXPENSE");
  const make = (category: Category, limit: number, spent: number): Budget => {
    const remaining = limit - spent;
    return {
      id: id("bud"),
      month,
      categoryId: category.id,
      categoryName: category.name,
      colorToken: category.colorToken,
      limit: money(limit),
      spent: money(spent),
      remaining: money(remaining),
      utilizationPercent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      exceeded: spent > limit,
    };
  };
  return [
    make(expense[0], 2_500_000, 1_850_000),
    make(expense[1], 600_000, 165_000),
    make(expense[2], 2_400_000, 2_400_000),
    make(expense[3], 400_000, 520_000),
  ];
}

function seedProfile(): Profile {
  return {
    id: id("user"),
    displayName: "Demo Foydalanuvchi",
    baseCurrency: CURRENCY,
    timezone: "Asia/Tashkent",
    locale: "uz-UZ",
    onboardingCompleted: true,
  };
}

function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** Yangi, to'liq seed qilingan DB yaratadi (test/reset uchun ham ishlatiladi). */
export function createDb(now = new Date()): MockDb {
  counter = 1;
  const accounts = seedAccounts();
  const categories = seedCategories();
  const savingPlans = seedSavingPlans();
  const contributions: Record<string, SavingContribution[]> = {};
  savingPlans.forEach((plan) => {
    contributions[plan.id] = [
      { id: id("con"), amount: plan.currentAmount, kind: "CONTRIBUTION", occurredOn: daysAgo(30, now), note: "Boshlang'ich", createdAt: new Date(now).toISOString() },
    ];
  });
  return {
    session: { authenticated: true, isNewUser: false },
    profile: seedProfile(),
    accounts,
    categories,
    transactions: seedTransactions(accounts, categories),
    savingPlans,
    contributions,
    budgets: seedBudgets(categories, currentMonth(now)),
    dailyLimit: null,
    idempotency: new Map(),
  };
}

/** Sahifa umri davomida yagona (singleton) DB. */
export const db: MockDb = createDb();
