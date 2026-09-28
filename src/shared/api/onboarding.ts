import { apiClient } from "./client";

/**
 * Onboarding API — Design-03 5-qadam: asosiy valyuta, timezone, birinchi hisob
 * va boshlang'ich qoldiq. Bular registration formasiga kirmaydi, alohida
 * bosqich sifatida yuboriladi (Bakend-06/07 kontrakti bilan moslashtiriladi).
 */
export interface CompleteOnboardingPayload {
  baseCurrency: string;
  timezone: string;
  firstAccountName: string;
  /** Float arifmetikasisiz — string sifatida yuboriladi (Frontend-02 qabul mezoni) */
  initialBalance: string;
}

export async function completeOnboarding(payload: CompleteOnboardingPayload): Promise<void> {
  await apiClient.post("/onboarding/complete", payload);
}
