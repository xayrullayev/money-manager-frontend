/**
 * Frontend-CHECK-04 — chek analitikasi (haftalik/oylik reyting) sof mantiqi.
 *
 * Kategoriya va MXIK (mahsulot kodi) bo'yicha guruhlash, hafta/oy davri filtri.
 * React/DOM'ga bog'liq emas — node:test bilan mustaqil tekshiriladi.
 */
import {
  countsTowardRating,
  type CheckDetail,
  type CheckLineItem,
} from "../history/checkTypes";

export type AnalyticsPeriod = "week" | "month";
/** Reytingni qaysi ko'rsatkich bo'yicha tartiblash: summa yoki xaridlar soni. */
export type AnalyticsMetric = "amount" | "frequency";

/** Kategoriyasi bo'sh mahsulotlar shu belgi ostida guruhlanadi. */
export const UNKNOWN_CATEGORY = "Noma'lum kategoriya";

export interface CategoryGroup {
  category: string;
  amount: number;
  /** Shu kategoriyadagi qatorlar soni. */
  itemCount: number;
}

export interface ProductRank {
  code: string;
  name: string;
  amount: number;
  /**
   * Xaridlar soni: shu MXIK kodi uchraган alohida cheklar soni. Bitta chekdagi
   * ikki qator bitta xarid deb hisoblanadi (frequency 1).
   */
  frequency: number;
}

export interface CheckAnalytics {
  period: AnalyticsPeriod;
  /** Reytingga kirgan (posted) cheklar soni. */
  purchaseCount: number;
  /** Reytingga kirgan cheklar sof total yig'indisi. */
  totalAmount: number;
  categories: CategoryGroup[];
  products: ProductRank[];
}

/* ────────────────────────────  Davr (hafta/oy) filtri  ──────────────────────────── */

/** "YYYY-MM-DD" ni UTC Date'ga aylantiradi (vaqt mintaqasidan mustaqil). */
function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Berilgan sanani o'z ichiga olgan haftaning dushanbasi (UTC, 00:00). */
function weekStart(date: Date): Date {
  const day = date.getUTCDay(); // 0 = yakshanba
  const diff = (day + 6) % 7; // dushanbagacha ortga
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diff));
}

/** `dateStr` chek sanasi `refIso` davri (hafta/oy) ichida ekanini tekshiradi. */
export function isInPeriod(dateStr: string, period: AnalyticsPeriod, refIso: string): boolean {
  const date = parseDate(dateStr);
  const ref = parseDate(refIso);
  if (period === "month") {
    return date.getUTCFullYear() === ref.getUTCFullYear() && date.getUTCMonth() === ref.getUTCMonth();
  }
  const start = weekStart(ref).getTime();
  const end = start + 7 * 24 * 60 * 60 * 1000;
  const t = date.getTime();
  return t >= start && t < end;
}

/* ────────────────────────────  Guruhlash / reyting  ──────────────────────────── */

function categoryOf(item: CheckLineItem): string {
  const trimmed = (item.category ?? "").trim();
  return trimmed || UNKNOWN_CATEGORY;
}

/**
 * Posted cheklarni kategoriya va MXIK kodi bo'yicha guruhlab reyting yasaydi.
 * `metric` faqat mahsulot reytingi tartibiga ta'sir qiladi (summa yoki soni).
 */
export function aggregateChecks(
  checks: CheckDetail[],
  period: AnalyticsPeriod,
  options: { refDate: string; metric?: AnalyticsMetric } = { refDate: todayIso() },
): CheckAnalytics {
  const metric = options.metric ?? "amount";
  const posted = checks.filter(
    (c) => countsTowardRating(c.status) && isInPeriod(c.purchasedAt, period, options.refDate),
  );

  const categories = new Map<string, CategoryGroup>();
  const products = new Map<string, ProductRank & { checkIds: Set<string> }>();
  let totalAmount = 0;

  for (const check of posted) {
    for (const item of check.items) {
      totalAmount += item.net;

      const catKey = categoryOf(item);
      const cat = categories.get(catKey) ?? { category: catKey, amount: 0, itemCount: 0 };
      cat.amount += item.net;
      cat.itemCount += 1;
      categories.set(catKey, cat);

      const prod =
        products.get(item.code) ??
        { code: item.code, name: item.name, amount: 0, frequency: 0, checkIds: new Set<string>() };
      prod.amount += item.net;
      prod.checkIds.add(check.id);
      products.set(item.code, prod);
    }
  }

  const categoryList = [...categories.values()].sort(byAmountThenName);
  const productList = [...products.values()]
    .map(({ checkIds, ...rest }) => ({ ...rest, frequency: checkIds.size }))
    .sort(metric === "frequency" ? byFrequencyThenAmount : byAmountThenName);

  return {
    period,
    purchaseCount: posted.length,
    totalAmount,
    categories: categoryList,
    products: productList,
  };
}

function byAmountThenName(a: { amount: number; category?: string; name?: string }, b: { amount: number; category?: string; name?: string }): number {
  if (b.amount !== a.amount) return b.amount - a.amount;
  const an = a.category ?? a.name ?? "";
  const bn = b.category ?? b.name ?? "";
  return an < bn ? -1 : an > bn ? 1 : 0;
}

function byFrequencyThenAmount(a: ProductRank, b: ProductRank): number {
  if (b.frequency !== a.frequency) return b.frequency - a.frequency;
  return b.amount - a.amount;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
