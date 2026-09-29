/**
 * Mock API o'rnatuvchisi (Frontend-check-01).
 *
 * `installMockApi()` `env.apiMock` yoqilgan bo'lsa `apiClient` adapterini mock
 * adapterga almashtiradi. `main.tsx` ilova render bo'lishidan oldin chaqiradi.
 * Ishlab chiqarish (mock o'chirilgan) buildida bu no-op — real backend ishlaydi.
 */
import { apiClient } from "../client";
import { env } from "../env";
import { mockAdapter } from "./adapter";

let installed = false;

export function installMockApi(): boolean {
  if (!env.apiMock || installed) return installed;
  apiClient.defaults.adapter = mockAdapter;
  installed = true;
  if (typeof console !== "undefined") {
    console.info("[mock-api] Frontend-check-01: mock adapter yoqildi — real backendga so'rov ketmaydi. OTP kod: 111111");
  }
  return true;
}

export { mockAdapter } from "./adapter";
export { db, createDb } from "./db";
