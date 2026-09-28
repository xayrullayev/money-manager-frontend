/**
 * Pul bilan ishlash — Frontend-02 qabul mezoni: "decimal summalarni float
 * arifmetikasisiz string yuborish". Barcha summalar backendga/dan STRING
 * sifatida uzatiladi; bu yerda faqat KO'RSATISH uchun formatlaymiz.
 */

const numberFormatters = new Map<string, Intl.NumberFormat>();

/** UZS kasrsiz ko'rsatiladi (DESIGN_SYSTEM.md §3.2), boshqa valyutalar — 2 kasr. */
function fractionDigits(currency: string): number {
  return currency === "UZS" ? 0 : 2;
}

function getNumberFormatter(currency: string): Intl.NumberFormat {
  let formatter = numberFormatters.get(currency);
  if (!formatter) {
    // Guruhlash/kasr belgisini o'zimiz qo'yamiz: brauzerlarning ko'pchiligida "uz-UZ" CLDR
    // ma'lumoti yo'q va "UZS 150,000" kabi inglizcha formatga tushib qoladi (uzDate.ts'dagi sabab bilan bir xil).
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits(currency),
      maximumFractionDigits: fractionDigits(currency),
      useGrouping: true,
    });
    numberFormatters.set(currency, formatter);
  }
  return formatter;
}

/** Faqat raqam qismi: 12450000 -> "12 450 000" (guruh — bo'linmas bo'sh joy, kasr — vergul). */
export function formatAmount(amount: string | number, currency: string): string {
  const numeric = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numeric)) return "—";
  return getNumberFormatter(currency)
    .formatToParts(numeric)
    .map((part) => (part.type === "group" ? "\u00A0" : part.type === "decimal" ? "," : part.value))
    .join("");
}

/** "150000.00" + "UZS" -> "150 000 UZS" (faqat ko'rsatish uchun; Figma: "12 450 000 UZS") */
export function formatMoney(amount: string | number, currency: string): string {
  const formatted = formatAmount(amount, currency);
  return formatted === "—" ? `— ${currency}` : `${formatted}\u00A0${currency}`;
}

/** Kirim musbat, chiqim manfiy ishora bilan ko'rsatiladi (Design-02: rang bilan birga belgi/matn) */
export function formatSignedMoney(amount: string | number, currency: string, type: "INCOME" | "EXPENSE"): string {
  const sign = type === "INCOME" ? "+" : "−";
  const numeric = Math.abs(typeof amount === "string" ? Number(amount) : amount);
  return `${sign} ${formatMoney(numeric, currency)}`;
}

/** Amount inputidan faqat raqam va bitta nuqtani qoldiradi */
export function sanitizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [intPart, ...rest] = cleaned.split(".");
  if (rest.length === 0) return intPart;
  return `${intPart}.${rest.join("").slice(0, 2)}`;
}

export function isValidPositiveAmount(value: string): boolean {
  if (!value) return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

/** Idempotency key — Frontend-02: "retryda bir xil idempotency key" */
export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
