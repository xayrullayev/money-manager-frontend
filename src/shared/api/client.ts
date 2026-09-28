import axios, { AxiosError } from "axios";
import { env } from "./env";

/**
 * API client — Frontend-01 (API client) va Bakend-04 (secure cookie session)
 * talablariga mos.
 *
 * - `withCredentials: true` — HttpOnly+Secure session cookie backend bilan
 *   bir xil origin/allowlist kontraktida ishlaydi.
 * - CSRF token backend cookie orqali yuboradi (masalan `XSRF-TOKEN`); biz uni
 *   header sifatida qaytaramiz. Backend contract yakunlanguncha header nomi
 *   shu yerda markazlashtirilgan — o'zgarsa faqat shu fayl yangilanadi.
 */
const CSRF_COOKIE_NAME = "XSRF-TOKEN";
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const isMutation = ["post", "put", "patch", "delete"].includes(
    (config.method ?? "get").toLowerCase(),
  );
  if (isMutation) {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    }
  }
  return config;
});

/**
 * Bakend-13 "Problem Details" xato modeli.
 * stack trace / SQL / secrets javobda kelmaydi — faqat shu maydonlar.
 */
export interface ProblemDetails {
  status: number;
  code: string;
  detail: string;
  traceId?: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(problem: ProblemDetails) {
    super(problem.detail);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.traceId = problem.traceId;
    this.fieldErrors = problem.fieldErrors;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<Partial<ProblemDetails>>) => {
    if (error.response) {
      const data = error.response.data;
      // Backend Bakend-13 "Problem Details" formatida javob berganida `detail` maydoni
      // bo'ladi. Agar javob boshqa shaklda bo'lsa (masalan backend hali ishga tushirilmagan,
      // noto'g'ri host yoki proxy HTML sahifa qaytargan) — buni foydalanuvchiga aniqroq
      // tushuntiramiz, "kutilmagan xatolik" deb chalkashtirmasdan.
      const looksLikeProblemDetails = typeof data === "object" && data !== null && typeof data.detail === "string";
      throw new ApiError({
        status: error.response.status,
        code: (looksLikeProblemDetails && data?.code) || "UNEXPECTED_RESPONSE",
        detail: looksLikeProblemDetails
          ? (data!.detail as string)
          : `Server javobi kutilgan formatda emas (status ${error.response.status}). Backend hali ulanmagan yoki API manzili (${env.apiBaseUrl}) noto'g'ri bo'lishi mumkin.`,
        traceId: looksLikeProblemDetails ? data?.traceId : undefined,
        fieldErrors: looksLikeProblemDetails ? data?.fieldErrors : undefined,
      });
    }
    if (error.request) {
      throw new ApiError({
        status: 0,
        code: "NETWORK_ERROR",
        detail: `Backend bilan bog'lanib bo'lmadi (${env.apiBaseUrl}). Backend server ishga tushirilganini tekshiring.`,
      });
    }
    throw new ApiError({
      status: 0,
      code: "CLIENT_ERROR",
      detail: error.message,
    });
  },
);
