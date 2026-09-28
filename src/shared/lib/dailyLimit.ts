/**
 * Kunlik limit (Frontend-04) — sof funksiyalar: progress kengligi, ekran o'quvchi matni,
 * status → xabar/ton va limit inputini tekshirish. React/API'ga bog'liq emas (node:test).
 * Pul qiymatlari string bo'lib qoladi — float arifmetikasi yo'q; `percent` faqat bar
 * kengligi uchun songa aylantiriladi (docs/daily-limit-contract.md).
 */
import { validLimit } from "./budgets";
import { formatMoney } from "./money";

/** Kontrakt: `status` maydoni. Chegaralar backendda yaxlitlashdan oldingi aniq qiymat bo'yicha. */
export type DailyLimitStatusCode = "NONE" | "OK" | "NEAR" | "REACHED" | "OVER";

export type DailyLimitTone = "neutral" | "warning" | "danger";

/** Bar kengligi va `aria-valuenow`: min(percent, 100), manfiy/yaroqsiz → 0. */
export function progressValue(percent: string | null | undefined): number {
  if (!percent) return 0;
  const parsed = Number.parseFloat(percent);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed >= 100 ? 100 : parsed;
}

/** Ko'rinadigan foiz: server stringi o'zgarishsiz ("240.3" → "240.3%"). */
export function percentLabel(percent: string | null | undefined): string {
  return percent ? `${percent}%` : "0%";
}

/** `aria-valuetext`: "2 500 000 UZS / 20 000 000 UZS, 12.5%" (kontrakt). */
export function progressValueText(spent: string, limit: string, percent: string | null, currency: string): string {
  return `${formatMoney(spent, currency)} / ${formatMoney(limit, currency)}, ${percentLabel(percent)}`;
}

/**
 * Manfiy `remaining`dan oshgan summa — faqat string bilan ("-1200.00" → "1200.00").
 * Oshmagan bo'lsa (0 yoki musbat) null.
 */
export function overLimitAmount(remaining: string | null | undefined): string | null {
  if (!remaining) return null;
  const value = remaining.trim();
  if (!value.startsWith("-")) return null;
  const abs = value.slice(1);
  return /[1-9]/.test(abs) ? abs : null;
}

export interface DailyLimitMessage {
  tone: DailyLimitTone;
  /** null — qo'shimcha matn kerak emas (OK / NONE) */
  text: string | null;
}

/** Status → ogohlantirish matni va ton. Rang yagona signal emas: har doim matn bilan birga. */
export function statusMessage(status: DailyLimitStatusCode, remaining: string | null | undefined, currency: string): DailyLimitMessage {
  switch (status) {
    case "NEAR":
      return { tone: "warning", text: "Limitga yaqinlashdingiz" };
    case "REACHED":
      return { tone: "danger", text: "Kunlik limitga yetdingiz" };
    case "OVER": {
      const over = overLimitAmount(remaining);
      return { tone: "danger", text: over ? `Limitdan ${formatMoney(over, currency)} oshdi` : "Limitdan oshdi" };
    }
    default:
      return { tone: "neutral", text: null };
  }
}

/** Input'dagi bo'sh joy (guruhlash) va vergulni (kasr) API formatiga keltiradi: "2 500 000,5" → "2500000.5". */
export function normalizeLimitInput(raw: string): string {
  return raw.replace(/[\s  ]/g, "").replace(",", ".");
}

export const LIMIT_REQUIRED_MESSAGE = "Limit summasini kiriting.";
export const LIMIT_INVALID_MESSAGE = "Musbat summa kiriting: 17 ta butun va 2 tagacha kasr raqami.";

/** null — to'g'ri. Qoida budjet limiti bilan bir xil (`validLimit`). */
export function validateLimitInput(raw: string): string | null {
  const value = normalizeLimitInput(raw);
  if (!value) return LIMIT_REQUIRED_MESSAGE;
  return validLimit(value) ? null : LIMIT_INVALID_MESSAGE;
}

/** Tahrirlash uchun boshlang'ich qiymat: "20000.00" → "20000", "20000.50" → "20000.50". */
export function limitInputValue(limit: string | null | undefined): string {
  if (!limit) return "";
  return limit.endsWith(".00") ? limit.slice(0, -3) : limit;
}
