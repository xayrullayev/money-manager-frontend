import { apiClient } from "./client";
export interface Budget {
  id: string; month: string; categoryId: string; categoryName: string; colorToken: string;
  limit: string; spent: string; remaining: string; utilizationPercent: number; exceeded: boolean;
}
export interface BudgetInput { categoryId: string; month: string; limit: string; }
export async function listBudgets(month: string): Promise<Budget[]> {
  return (await apiClient.get<Budget[]>("/budgets", { params: { month } })).data;
}
export async function createBudget(input: BudgetInput): Promise<Budget> {
  return (await apiClient.post<Budget>("/budgets", input)).data;
}
export async function updateBudget(id: string, limit: string): Promise<Budget> {
  return (await apiClient.patch<Budget>(`/budgets/${encodeURIComponent(id)}`, { limit })).data;
}
export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${encodeURIComponent(id)}`);
}
