/**
 * Environment konfiguratsiyasi — Frontend-01 talabi.
 * Barcha runtime sozlamalar shu yerdan o'qiladi, komponentlar import.meta.env'ga
 * to'g'ridan-to'g'ri murojaat qilmaydi.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  defaultCountryCode: import.meta.env.VITE_DEFAULT_COUNTRY_CODE ?? "+998",
  otpCodeLength: Number(import.meta.env.VITE_OTP_CODE_LENGTH ?? 6),
  otpResendSeconds: Number(import.meta.env.VITE_OTP_RESEND_SECONDS ?? 60),
  /**
   * Mock API rejimi (Frontend-check-01). `VITE_API_MOCK=1` bo'lganda apiClient
   * real backendga chiqmaydi — barcha `/api/v1` so'rovlari brauzer ichidagi
   * in-memory mock adapter orqali kontraktga mos javob oladi. Real backend yo'q
   * paytida Dashboard/dialog/hisobot ekranlarini ko'rish va QA qilish uchun.
   */
  apiMock: import.meta.env.VITE_API_MOCK === "1" || import.meta.env.VITE_API_MOCK === "true",
} as const;
