/**
 * Frontend-CHECK-04 — cheklar tarixi mock client.
 *
 * B08 kelishilgan mock response o'rnida mustaqil, deterministik client. Backend
 * ulanganда faqat shu fayl almashtiriladi — ekran/hook interfeysi o'zgarmaydi.
 */
import { toSummary, type CheckDetail, type CheckSummary } from "./checkTypes";
import { checkFixtures } from "./checkFixtures";

export interface ListChecksParams {
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}

export interface ChecksPage {
  items: CheckSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export class CheckHistoryError extends Error {
  readonly code: "server-error" | "not-found";
  constructor(code: "server-error" | "not-found", message: string) {
    super(message);
    this.name = "CheckHistoryError";
    this.code = code;
  }
}

const DELAY_MS = 260;

/** Sana bo'yicha kamayish tartibida saralangan chek ro'yxati. */
function sorted(): CheckDetail[] {
  return [...checkFixtures].sort((a, b) => (a.purchasedAt < b.purchasedAt ? 1 : a.purchasedAt > b.purchasedAt ? -1 : 0));
}

export function listChecks(params: ListChecksParams): Promise<ChecksPage> {
  const { page, pageSize, signal } = params;
  return withDelay(signal, () => {
    const all = sorted().map(toSummary);
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return {
      items,
      page,
      pageSize,
      total: all.length,
      hasMore: start + pageSize < all.length,
    };
  });
}

export function getCheckDetail(id: string, options: { signal?: AbortSignal } = {}): Promise<CheckDetail> {
  return withDelay(options.signal, () => {
    const found = checkFixtures.find((c) => c.id === id);
    if (!found) throw new CheckHistoryError("not-found", "Chek topilmadi");
    return found;
  });
}

function withDelay<T>(signal: AbortSignal | undefined, produce: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Bekor qilindi", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, DELAY_MS);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Bekor qilindi", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });
}
