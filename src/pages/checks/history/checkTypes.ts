/**
 * Frontend-CHECK-04 — chek (receipt) domen turlari.
 *
 * Tarix ro'yxati va analitika ekranlari shu turlarga tayanadi. React/DOM'ga
 * bog'liq emas — sof mantiq va testlar shu yerdan foydalanadi.
 */

/**
 * Chek holati:
 * - `DRAFT` / `IMPORTED` — hali xarajat sifatida tasdiqlanmagan (posted emas).
 * - `POSTED` — xarajat tranzaksiyasiga aylangan; faqat shu holat reytingga kiradi.
 */
export type CheckStatus = "DRAFT" | "IMPORTED" | "POSTED";

export interface CheckLineItem {
  /** MXIK kodi (bir xil mahsulotni turli chek qatorlarida birlashtirish uchun). */
  code: string;
  name: string;
  /** Kategoriya nomi; bo'sh bo'lsa "noma'lum" deb hisoblanadi. */
  category: string;
  /** Chegirmadan keyingi sof summa (butun so'm). */
  net: number;
}

/** Ro'yxat uchun yengil ko'rinish (qatorlarsiz). */
export interface CheckSummary {
  id: string;
  merchantName: string;
  /** ISO local sana "YYYY-MM-DD". */
  purchasedAt: string;
  currency: string;
  status: CheckStatus;
  itemCount: number;
  /** Sof total (butun so'm). */
  total: number;
}

export interface CheckDetail extends Omit<CheckSummary, "itemCount" | "total"> {
  items: CheckLineItem[];
}

/** Chekning sof totali — qatorlar `net` yig'indisi. */
export function checkTotal(check: CheckDetail): number {
  return check.items.reduce((sum, item) => sum + item.net, 0);
}

/**
 * Chek xarajat reytingiga qo'shiladimi. Draft/imported hali posted emas,
 * shuning uchun reytingdan tashqarida (CHECK-04 qamrovi).
 */
export function countsTowardRating(status: CheckStatus): boolean {
  return status === "POSTED";
}

/** Detaldan ro'yxat ko'rinishini yasaydi. */
export function toSummary(check: CheckDetail): CheckSummary {
  return {
    id: check.id,
    merchantName: check.merchantName,
    purchasedAt: check.purchasedAt,
    currency: check.currency,
    status: check.status,
    itemCount: check.items.length,
    total: checkTotal(check),
  };
}
