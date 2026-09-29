/**
 * Frontend-CHECK-02 — chek import manbasini (QR yoki havola) bir xil
 * validatsiya yo'lidan o'tkazuvchi sof mantiq.
 *
 * QR skaneri ham, havola paste formasi ham natijani shu yerga uzatadi, shuning
 * uchun "QR va paste bir xil import natijasiga olib keladi" talabi aynan shu
 * funksiya orqali ta'minlanadi. React/DOM'ga bog'liq emas — node:test bilan
 * mustaqil tekshiriladi.
 */

/** Manbani solishtirishda (dedupe) e'tiborsiz qoldiriladigan tracking parametrlar. */
const IGNORED_QUERY_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "lang", "locale"]);

export interface ParsedCheckSource {
  /** Import uchun ishlatiladigan normallashtirilgan to'liq URL. */
  url: string;
  /**
   * Bir xil chekni aniqlash uchun barqaror kalit. QR va qo'lda kiritilgan bir
   * xil havola (parametrlar tartibi/registri farqli bo'lsa ham) bitta kalitga
   * tushadi — shuning uchun "qayta skan oldingi chekni ochadi".
   */
  dedupeKey: string;
}

export type ParseCheckSourceResult =
  | { ok: true; source: ParsedCheckSource }
  | { ok: false; reason: "empty" | "invalid" };

/**
 * QR o'qilgan matn yoki foydalanuvchi kiritgan havolani tekshiradi va
 * normallashtiradi. QR ba'zan URL'ni bo'sh joy/qator bilan qaytaradi yoki
 * `HTTP://` kabi katta harflar bilan beradi — bularni tozalaymiz.
 */
export function parseCheckSource(input: string): ParseCheckSourceResult {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  // Faqat http(s) — `javascript:`, `data:`, `file:` kabi sxemalar rad etiladi.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "invalid" };
  }
  if (!parsed.hostname) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    source: {
      url: parsed.toString(),
      dedupeKey: buildDedupeKey(parsed),
    },
  };
}

function buildDedupeKey(url: URL): string {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");
  const params = Array.from(url.searchParams.entries())
    .filter(([key]) => !IGNORED_QUERY_KEYS.has(key.toLowerCase()))
    .map(([key, value]) => [key.toLowerCase(), value] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return params ? `${host}${path}?${params}` : `${host}${path}`;
}

/** Ikki manba (masalan ketma-ket ikki QR skan) bir xil chekmi. */
export function isSameSource(a: ParsedCheckSource, b: ParsedCheckSource): boolean {
  return a.dedupeKey === b.dedupeKey;
}

/* ────────────────────────────  Import holati (status)  ──────────────────────────── */

export type ImportErrorCode =
  | "invalid-url"
  | "camera-unavailable"
  | "camera-denied"
  | "source-unavailable"
  | "timeout"
  | "unknown";

export interface ImportStatus {
  phase: "idle" | "processing" | "success" | "error";
  /** 0–100. `processing` bosqichida progress ko'rsatiladi. */
  progress: number;
  errorCode?: ImportErrorCode;
  /** Muvaffaqiyatli importda tayyor bo'lgan chek identifikatori. */
  checkId?: string;
}

export const INITIAL_IMPORT_STATUS: ImportStatus = { phase: "idle", progress: 0 };

export type ImportAction =
  | { type: "start" }
  | { type: "progress"; value: number }
  | { type: "success"; checkId: string }
  | { type: "error"; code: ImportErrorCode }
  | { type: "reset" };

/**
 * Import holati mashinasi. Soxta muvaffaqiyat bo'lmasligi uchun `success`ga
 * faqat aniq `checkId` bilan o'tiladi; xato holatida `checkId` tozalanadi.
 */
export function importStatusReducer(state: ImportStatus, action: ImportAction): ImportStatus {
  switch (action.type) {
    case "start":
      return { phase: "processing", progress: 0 };
    case "progress":
      if (state.phase !== "processing") return state;
      return { ...state, progress: clampProgress(action.value) };
    case "success":
      return { phase: "success", progress: 100, checkId: action.checkId };
    case "error":
      return { phase: "error", progress: 0, errorCode: action.code };
    case "reset":
      return INITIAL_IMPORT_STATUS;
    default:
      return state;
  }
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Foydalanuvchiga ko'rsatiladigan tushunarli xato matni (Design-05 uslubi). */
export function importErrorMessage(code: ImportErrorCode): string {
  switch (code) {
    case "invalid-url":
      return "Havola noto'g'ri. To'liq chek havolasini (https://…) tekshirib qayta kiriting.";
    case "camera-unavailable":
      return "Kamera bu qurilmada mavjud emas. Chek havolasini pastdagi maydonga qo'ying.";
    case "camera-denied":
      return "Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki havola orqali import qiling.";
    case "source-unavailable":
      return "Chek manbasi hozir javob bermayapti. Biroz kuting va qayta urinib ko'ring.";
    case "timeout":
      return "Chekni o'qish juda uzoq davom etdi. Ulanishni tekshirib, qayta urinib ko'ring.";
    case "unknown":
    default:
      return "Chekni import qilib bo'lmadi. Qayta urinib ko'ring.";
  }
}
