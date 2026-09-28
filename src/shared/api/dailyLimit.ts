import { apiClient } from "./client";
import type { DailyLimitStatusCode } from "../lib/dailyLimit";

/**
 * Kunlik xarajat limiti — docs/daily-limit-contract.md (v1) bilan 1:1.
 * Pul maydonlari string ("20000.00"); limit yo'q bo'lsa `configured=false`, `status="NONE"`,
 * id/limit/remaining/percent/version/updatedAt = null, `spent` baribir hisoblanadi.
 */
export interface DailyLimitStatus {
  configured: boolean;
  id: string | null;
  limit: string | null;
  spent: string;
  /** limit − spent; oshib ketganda manfiy ("-1200.00") */
  remaining: string | null;
  /** 1 kasr, HALF_UP ("12.5", "240.3"); 100 dan oshishi mumkin */
  percent: string | null;
  status: DailyLimitStatusCode;
  /** YYYY-MM-DD, foydalanuvchi timezone'idagi sana */
  date: string;
  currency: string;
  version: number | null;
  updatedAt: string | null;
}

export async function fetchDailyLimit(date?: string): Promise<DailyLimitStatus> {
  return (await apiClient.get<DailyLimitStatus>("/daily-limit", { params: date ? { date } : undefined })).data;
}

export async function createDailyLimit(limit: string): Promise<DailyLimitStatus> {
  return (await apiClient.post<DailyLimitStatus>("/daily-limit", { limit })).data;
}

export async function updateDailyLimit(limit: string, expectedVersion: number): Promise<DailyLimitStatus> {
  return (await apiClient.patch<DailyLimitStatus>("/daily-limit", { limit, expectedVersion })).data;
}

/** Idempotent: limit yo'q bo'lsa ham 204. */
export async function deleteDailyLimit(): Promise<void> {
  await apiClient.delete("/daily-limit");
}
