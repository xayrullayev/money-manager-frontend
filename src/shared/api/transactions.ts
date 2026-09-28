import { apiClient } from "./client";
import type { TransactionType } from "./categories";

/** Bakend-09/10: kirim/chiqim/o'tkazma tranzaksiyasi. */
export interface Transaction {
  id: string;
  type: TransactionType;
  /** Har doim musbat string; ishora type orqali aniqlanadi */
  amount: string;
  currency: string;
  accountId: string;
  accountName: string;
  /** TRANSFER uchun manba hisob */
  fromAccountId?: string;
  fromAccountName?: string;
  /** TRANSFER uchun maqsad hisob */
  toAccountId?: string;
  toAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  transactionDate: string; // ISO local date, "YYYY-MM-DD"
  note?: string;
  /** Optimistic concurrency — Bakend-09 */
  version: number;
}

export interface CreateExpenseOrIncomePayload {
  type: "INCOME" | "EXPENSE";
  amount: string;
  accountId: string;
  categoryId: string;
  transactionDate: string;
  note?: string;
}

export interface CreateTransferPayload {
  type: "TRANSFER";
  amount: string;
  fromAccountId: string;
  toAccountId: string;
  transactionDate: string;
  note?: string;
}

export type CreateTransactionPayload = CreateExpenseOrIncomePayload | CreateTransferPayload;

/**
 * Bakend-09: PATCH — bu partial patch emas, formaning to'liq qayta yuborilishi
 * (full replace) + `expectedVersion`. Versiya mos kelmasa backend
 * `409 STALE_VERSION` qaytaradi — jim overwrite yo'q (Design-05).
 */
export type UpdateTransactionPayload = CreateTransactionPayload & { expectedVersion: number };

export interface ListTransactionsParams {
  from?: string;
  to?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface ListTransactionsResult {
  items: Transaction[];
  nextCursor?: string;
}

/**
 * `Idempotency-Key` — Bakend-10 qabul mezoni: bitta kalit + bitta payload
 * retryda bir xil natija beradi, boshqa payload esa 409 qaytaradi. Frontend
 * har bir yangi forma submission uchun yangi kalit yaratadi
 * (`createIdempotencyKey`), lekin bitta submission ichidagi retryda (masalan
 * tarmoq xatosi) xuddi shu kalitni qayta ishlatadi.
 */
export async function createTransaction(
  payload: CreateTransactionPayload,
  idempotencyKey: string,
): Promise<Transaction> {
  const { data } = await apiClient.post<Transaction>("/transactions", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return data;
}

export async function listTransactions(params: ListTransactionsParams): Promise<ListTransactionsResult> {
  const { data } = await apiClient.get<ListTransactionsResult>("/transactions", { params });
  return data;
}

export async function getTransaction(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<Transaction>(`/transactions/${encodeURIComponent(id)}`);
  return data;
}

export async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
  const { data } = await apiClient.patch<Transaction>(`/transactions/${encodeURIComponent(id)}`, payload);
  return data;
}

/** Soft delete + ledger reversal (Bakend-09). `version` mos kelmasa 409 STALE_VERSION. */
export async function deleteTransaction(id: string, version: number): Promise<void> {
  await apiClient.delete(`/transactions/${encodeURIComponent(id)}`, { params: { version } });
}
