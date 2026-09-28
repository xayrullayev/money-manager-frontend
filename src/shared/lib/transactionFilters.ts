import { resolvePeriod, type PeriodPreset } from "./period";

/**
 * Operatsiyalar ro'yxati filtrlari (Design-06): "Filter/search URL
 * query-paramda; detaildan Back qilganda filter tiklanadi".
 *
 * URL — yagona manba (source of truth): sahifa state'ni URL'dan o'qiydi va
 * o'zgarishni URL'ga yozadi. Shu sababli bu modul sof funksiyalardan iborat
 * va API/React'ga bog'liq emas (node testlarda to'g'ridan-to'g'ri tekshiriladi).
 */

export type TransactionTypeFilter = "" | "INCOME" | "EXPENSE" | "TRANSFER";

/** Davr tanlovi: "all" — sana filtri yo'q, "custom" — foydalanuvchi o'zi kiritgan from/to. */
export type PeriodFilter = "all" | PeriodPreset | "custom";

export interface TransactionFilters {
  search: string;
  type: TransactionTypeFilter;
  accountId: string;
  categoryId: string;
  from: string;
  to: string;
}

/** API'ga yuboriladigan shakl — bo'sh qiymatlar umuman yuborilmaydi. */
export interface TransactionQuery {
  search?: string;
  type?: Exclude<TransactionTypeFilter, "">;
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
}

export type TransactionSummaryQuery =
  | { state: "period_required" }
  | { state: "transfer_excluded" }
  | {
      state: "ready";
      params: {
        from: string;
        to: string;
        search?: string;
        type?: "INCOME" | "EXPENSE";
        accountId?: string;
        categoryId?: string;
      };
    };

export const EMPTY_FILTERS: TransactionFilters = {
  search: "",
  type: "",
  accountId: "",
  categoryId: "",
  from: "",
  to: "",
};

/** URL kalitlari qisqa va o'qiladigan: /transactions?type=EXPENSE&from=2026-09-01 */
const KEYS = {
  search: "q",
  type: "type",
  accountId: "account",
  categoryId: "category",
  from: "from",
  to: "to",
} as const satisfies Record<keyof TransactionFilters, string>;

const TYPES: readonly TransactionTypeFilter[] = ["INCOME", "EXPENSE", "TRANSFER"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Backend ID'lari UUID; boshqa narsa URL'da bo'lsa jimgina tashlab yuboriladi (400 olmaslik uchun). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SEARCH_MAX_LENGTH = 100;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * URL → filtrlar. Noto'g'ri qiymatlar (qo'lda tahrirlangan yoki eskirgan link)
 * xato bermaydi, faqat e'tiborsiz qoldiriladi. from > to bo'lsa almashtiriladi.
 */
export function parseFilters(params: URLSearchParams): TransactionFilters {
  const read = (key: keyof TransactionFilters) => (params.get(KEYS[key]) ?? "").trim();

  const rawType = read("type").toUpperCase() as TransactionTypeFilter;
  const accountId = read("accountId");
  const categoryId = read("categoryId");
  let from = read("from");
  let to = read("to");
  if (!isValidIsoDate(from)) from = "";
  if (!isValidIsoDate(to)) to = "";
  if (from && to && from > to) [from, to] = [to, from];

  const type = TYPES.includes(rawType) ? rawType : "";

  return {
    search: read("search").slice(0, SEARCH_MAX_LENGTH),
    type,
    accountId: UUID.test(accountId) ? accountId : "",
    // O'tkazmaning kategoriyasi yo'q — type=TRANSFER bilan kategoriya filtri ma'nosiz.
    categoryId: UUID.test(categoryId) && type !== "TRANSFER" ? categoryId : "",
    from,
    to,
  };
}

/** Filtrlar → URL. Bo'sh qiymatlar URL'ga yozilmaydi, tartib barqaror. */
export function filtersToSearchParams(filters: TransactionFilters): URLSearchParams {
  const params = new URLSearchParams();
  (Object.keys(KEYS) as (keyof TransactionFilters)[]).forEach((key) => {
    const value = key === "search" ? filters.search.trim() : filters[key];
    if (value) params.set(KEYS[key], value);
  });
  return params;
}

export function toQuery(filters: TransactionFilters): TransactionQuery {
  const query: TransactionQuery = {};
  const search = filters.search.trim();
  if (search) query.search = search;
  if (filters.type) query.type = filters.type;
  if (filters.accountId) query.accountId = filters.accountId;
  if (filters.categoryId && filters.type !== "TRANSFER") query.categoryId = filters.categoryId;
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  return query;
}

/**
 * Reporting API bir martada faqat aniq, 366 kundan oshmaydigan davrni
 * jamlaydi. Operatsiyalar ro'yxatining sana chegarasi bo'lmasa, current-month
 * defaultini "butun tarix jami" deb ko'rsatmaslik uchun request yuborilmaydi.
 */
export function toSummaryQuery(filters: TransactionFilters): TransactionSummaryQuery {
  if (filters.type === "TRANSFER") return { state: "transfer_excluded" };
  if (!filters.from || !filters.to) return { state: "period_required" };
  const params: Extract<TransactionSummaryQuery, { state: "ready" }>["params"] = {
    from: filters.from,
    to: filters.to,
  };
  const search = filters.search.trim();
  if (search) params.search = search;
  if (filters.type) params.type = filters.type;
  if (filters.accountId) params.accountId = filters.accountId;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  return {
    state: "ready",
    params,
  };
}

const PRESETS: PeriodPreset[] = ["this_month", "last_month", "last_30_days"];

/** from/to qaysi presetga to'g'ri kelishini aniqlaydi (select'da to'g'ri variantni ko'rsatish uchun). */
export function detectPeriod(filters: Pick<TransactionFilters, "from" | "to">, now: Date = new Date()): PeriodFilter {
  if (!filters.from && !filters.to) return "all";
  for (const preset of PRESETS) {
    const range = resolvePeriod(preset, now);
    if (range.from === filters.from && range.to === filters.to) return preset;
  }
  return "custom";
}

/**
 * Davr tanlanganda from/to'ni hisoblaydi. "custom" tanlansa mavjud qiymatlar
 * saqlanadi (bo'sh bo'lsa joriy oy bilan boshlanadi — foydalanuvchi keyin o'zgartiradi).
 */
export function applyPeriod(filters: TransactionFilters, period: PeriodFilter, now: Date = new Date()): TransactionFilters {
  if (period === "all") return { ...filters, from: "", to: "" };
  if (period === "custom") {
    if (filters.from || filters.to) return filters;
    return { ...filters, ...resolvePeriod("this_month", now) };
  }
  return { ...filters, ...resolvePeriod(period, now) };
}

/** Faol filtrlar soni — "N ta filtr" va "Barchasini tozalash" ko'rinishi uchun. from/to bitta filtr hisoblanadi. */
export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.type) count += 1;
  if (filters.accountId) count += 1;
  if (filters.categoryId) count += 1;
  if (filters.from || filters.to) count += 1;
  return count;
}

/** Bitta filtrni olib tashlash (chip ×). "period" from va to'ni birga tozalaydi. */
export function removeFilter(
  filters: TransactionFilters,
  key: "search" | "type" | "accountId" | "categoryId" | "period",
): TransactionFilters {
  if (key === "period") return { ...filters, from: "", to: "" };
  return { ...filters, [key]: "" };
}
