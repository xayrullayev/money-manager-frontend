import { apiClient } from "./client";
import type { CategoryColorToken, CategoryIconKey } from "../lib/categoryTokens";

/** Bakend-08: income/expense kategoriyalar. */
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = Exclude<TransactionType, "TRANSFER">;

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  iconKey: string;
  colorToken: string;
  archived: boolean;
}

export async function listCategories(params?: { type?: CategoryType; includeArchived?: boolean }): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories", {
    params: { type: params?.type, includeArchived: params?.includeArchived ?? false },
  });
  return data;
}

export interface CreateCategoryPayload {
  name: string;
  /** Yaratilgandan keyin o'zgarmaydi — mavjud operatsiyalar shu turga bog'liq (Design-07). */
  type: CategoryType;
  /** Backend allowlist tokeni (Bakend-08) — majburiy. Qarang: shared/lib/categoryTokens.ts */
  iconKey: CategoryIconKey;
  colorToken: CategoryColorToken;
}

/**
 * Backend PATCH (UpdateCategoryRequest) nom, iconKey va colorToken'ni birga
 * majburiy talab qiladi; `type` yuborilsa 400 — tur o'zgarmaydi.
 */
export interface UpdateCategoryPayload {
  name: string;
  iconKey: CategoryIconKey;
  colorToken: CategoryColorToken;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const { data } = await apiClient.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${encodeURIComponent(id)}`, payload);
  return data;
}

/** O'chirish o'rniga arxivlash — tarixli operatsiyalarda kategoriya nomi saqlanib qoladi (Design-07 qabul mezoni). */
export async function archiveCategory(id: string): Promise<void> {
  await apiClient.post(`/categories/${encodeURIComponent(id)}/archive`);
}

/** Arxivdan qaytarish — idempotent (allaqachon faol bo'lsa ham 204), tarix o'zgarmaydi. */
export async function unarchiveCategory(id: string): Promise<void> {
  await apiClient.post(`/categories/${encodeURIComponent(id)}/unarchive`);
}
