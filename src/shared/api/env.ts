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
} as const;
