import { apiClient } from "./client";
import type { Transaction } from "./transactions";

/** Bakend-12: dashboard va hisobot agregatsiyalari. */
export interface DashboardSummary {
  savings?: import("./savings").SavingsSummary;
  totalBalance: string;
  currency: string;
  period: { from: string; to: string };
  income: string;
  expense: string;
  net: string;
  /** Faol hisoblar soni — "Jami qoldiq" karta metasi uchun ("UZS • 3 ta hisob") */
  accountsCount: number;
  budgets: BudgetProgress[];
  recentTransactions: Transaction[];
}

/** Bakend-11: oylik kategoriya budjeti va sarf progressi. */
export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  colorToken: string;
  limit: string;
  spent: string;
  /** Manfiy bo'lishi mumkin (limitdan oshganda) */
  remaining: string;
  utilizationPercent: number;
  exceeded: boolean;
}

export interface DashboardPeriod {
  from: string; // "YYYY-MM-DD"
  to: string;
}

export async function fetchDashboardSummary(period: DashboardPeriod): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary", {
    params: period,
  });
  return data;
}

/* --- Dashboard "Pul oqimi" (Cashflow) grafigi — GET /dashboard/cashflow --- */

export type CashflowRange = "THIS_YEAR" | "LAST_YEAR" | "LAST_12_MONTHS";

export interface CashflowMonth {
  /** "YYYY-MM" */
  month: string;
  income: string;
  /** Musbat son; grafikda nol chizig'idan pastga chiziladi */
  expense: string;
  net: string;
  /** Joriy oydan keyingi oy — summalar 0, grafikda bo'sh ustun */
  future: boolean;
}

export interface Cashflow {
  currency: string;
  range: CashflowRange;
  period: { from: string; to: string };
  /** Real qoldiq (accountId bo'lsa — o'sha hisob) */
  totalBalance: string;
  income: string;
  expense: string;
  net: string;
  /** "MOCK" — oylik summalar hozircha soxta (backend random, deterministik) */
  dataSource: "MOCK" | "LEDGER";
  months: CashflowMonth[];
}

export interface CashflowFilters {
  range?: CashflowRange;
  accountId?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
}

export async function fetchCashflow(filters: CashflowFilters, signal?: AbortSignal): Promise<Cashflow> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
  const { data } = await apiClient.get<Cashflow>("/dashboard/cashflow", { params, signal });
  return data;
}
