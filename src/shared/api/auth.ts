import { apiClient } from "./client";

/**
 * Auth API — Design-03 / Design-AUTH-01 / Design-AUTH-02 asosida.
 *
 * MVP autentifikatsiya email/parolsiz, faqat telefon raqami + SMS kod orqali
 * ishlaydi (Design-03: "Email, parol, ism yoki boshqa shaxsiy ma'lumot talab
 * qilinmaydi"). Ro'yxatdan o'tish va tizimga kirish bir xil oqimni ishlatadi:
 * agar raqam avval ro'yxatdan o'tgan bo'lsa — bu kirish, aks holda — yangi
 * ro'yxatdan o'tish. Buni backend hal qiladi, frontend faqat natijaga qarab
 * onboarding kerakligini biladi.
 *
 * Endpoint yo'llari va javob shakli Bakend-04 kontrakti telefon/SMS oqimiga
 * moslashtirilgach (Design-03 handoff eslatmasi) shu yerda yangilanadi.
 */

export interface RequestOtpPayload {
  /** E.164 formatida, masalan "+998901234567" */
  phone: string;
}

export interface RequestOtpResult {
  /** Backend tasdiqlagan holatda kod amal qilish muddati (soniya) */
  codeExpiresInSeconds: number;
  /** Keyingi "qayta yuborish" tugmasi qachon faollashishi (soniya) */
  resendAvailableInSeconds: number;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface VerifyOtpResult {
  /** Raqam ilk marta tasdiqlangan bo'lsa true — onboardingga yo'naltiriladi */
  isNewUser: boolean;
  user: {
    id: string;
    phone: string;
  };
}

export interface MeResult {
  id: string;
  phone: string;
  baseCurrency: string | null;
  onboardingCompleted: boolean;
}

export async function requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResult> {
  const { data } = await apiClient.post<RequestOtpResult>("/auth/otp/request", payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
  const { data } = await apiClient.post<VerifyOtpResult>("/auth/otp/verify", payload);
  return data;
}

export async function fetchMe(): Promise<MeResult> {
  const { data } = await apiClient.get<MeResult>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
