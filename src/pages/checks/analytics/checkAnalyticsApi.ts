/**
 * Frontend-CHECK-04 — chek analitikasi mock client.
 *
 * B08 kelishilgan mock response o'rnida mustaqil, deterministik client.
 * `aggregateChecks` sof mantiqiga tayanadi; backend ulanganda faqat shu fayl
 * almashtiriladi.
 */
import { checkFixtures, CHECK_TODAY } from "../history/checkFixtures";
import { countsTowardRating } from "../history/checkTypes";
import {
  aggregateChecks,
  isInPeriod,
  type AnalyticsMetric,
  type AnalyticsPeriod,
  type CheckAnalytics,
} from "./checkAnalytics";

export interface GetAnalyticsParams {
  period: AnalyticsPeriod;
  metric?: AnalyticsMetric;
  /** Deterministik davr uchun mos sana (standart — fixture "bugun"i). */
  refDate?: string;
  signal?: AbortSignal;
}

export interface AnalyticsResult {
  analytics: CheckAnalytics;
  /**
   * Davrda posted bo'lmagan (hali tasdiqlanmagan) cheklar bo'lsa `true` —
   * reyting to'liq emas, foydalanuvchiga qisman ma'lumot ko'rsatilmoqda.
   */
  partial: boolean;
}

export class CheckAnalyticsError extends Error {
  readonly code: "server-error";
  constructor(message: string) {
    super(message);
    this.name = "CheckAnalyticsError";
    this.code = "server-error";
  }
}

const DELAY_MS = 260;

export function getCheckAnalytics(params: GetAnalyticsParams): Promise<AnalyticsResult> {
  const { period, metric, signal } = params;
  const refDate = params.refDate ?? CHECK_TODAY;

  return new Promise<AnalyticsResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Bekor qilindi", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      const analytics = aggregateChecks(checkFixtures, period, { refDate, metric });
      const pendingInPeriod = checkFixtures.some(
        (c) => !countsTowardRating(c.status) && isInPeriod(c.purchasedAt, period, refDate),
      );
      resolve({ analytics, partial: pendingInPeriod });
    }, DELAY_MS);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Bekor qilindi", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}
