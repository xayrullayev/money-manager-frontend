import { apiClient } from "./client";

/** Bakend-07: hisob turlari — faqat foydalanuvchi belgilaydigan bookkeeping hisoblari. */
export type AccountType = "CASH" | "BANK" | "CARD";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  /** Ledger entries yig'indisidan hisoblangan joriy balans (string, aniqlik uchun) */
  balance: string;
  archived: boolean;
}

export async function listAccounts(params?: { includeArchived?: boolean }): Promise<Account[]> {
  const { data } = await apiClient.get<Account[]>("/accounts", {
    params: { includeArchived: params?.includeArchived ?? false },
  });
  return data;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  openingBalance: string;
  openingDate: string;
  currency: string;
}

export interface UpdateAccountPayload {
  name: string;
  type: AccountType;
}

export async function fetchAccountSummary(includeArchived = false): Promise<Record<string, string>> {
  const { data } = await apiClient.get<Record<string, string>>("/accounts/summary", { params: { includeArchived } });
  return data;
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const { data } = await apiClient.post<Account>("/accounts", payload);
  return data;
}

export async function updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
  const { data } = await apiClient.patch<Account>(`/accounts/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function archiveAccount(id: string): Promise<void> {
  await apiClient.post(`/accounts/${encodeURIComponent(id)}/archive`);
}

/** Arxivdan qaytarish — idempotent (allaqachon faol bo'lsa ham 204), ledger o'zgarmaydi. */
export async function unarchiveAccount(id: string): Promise<void> {
  await apiClient.post(`/accounts/${encodeURIComponent(id)}/unarchive`);
}
