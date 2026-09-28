import { apiClient } from "./client";
import type { Transaction } from "./transactions";

/** Bakend-12: dashboard va hisobot agregatsiyalari. */
export interface DashboardSummary {
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
