/**
 * Frontend-CHECK-02 — chek import mock client.
 *
 * F01 (Check API client/turlar/mock) hali merge qilinmagani uchun bu ekran o'z
 * mock klientiga tayanadi va mustaqil export qilinadi. F01 tayyor bo'lganda bu
 * fayl uning `importCheckFromUrl` kontrakti bilan almashtiriladi — ekran va
 * `useCheckImport` interfeysi o'zgarmaydi.
 *
 * Mock deterministik: natija manba URL'idan kelib chiqadi, shuning uchun QR va
 * qo'lda kiritilgan bir xil havola bir xil chekni beradi. Salbiy holatlarni
 * sinash uchun URL'ga `?mock=unavailable` yoki `?mock=timeout` qo'shish mumkin.
 */

export interface ImportedCheck {
  id: string;
  merchantName: string;
  /** Musbat string; valyuta alohida. */
  totalAmount: string;
  currency: string;
  /** ISO local date "YYYY-MM-DD". */
  purchasedAt: string;
  itemCount: number;
  /** Import qilingan asl manba (audit uchun). */
  sourceUrl: string;
}

export interface ImportCheckOptions {
  signal?: AbortSignal;
  /** 0–100 oralig'ida progress hodisalari. */
  onProgress?: (value: number) => void;
}

export class CheckImportError extends Error {
  readonly code: "source-unavailable" | "unknown";
  constructor(code: "source-unavailable" | "unknown", message: string) {
    super(message);
    this.name = "CheckImportError";
    this.code = code;
  }
}

/** Test/dev muhitida progress bosqichlarini tezlatish uchun sozlanadi. */
const STEP_MS = 220;

export function importCheckFromUrl(url: string, options: ImportCheckOptions = {}): Promise<ImportedCheck> {
  const { signal, onProgress } = options;
  const mockFlag = readMockFlag(url);

  return new Promise<ImportedCheck>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    let step = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cleanup = () => {
      for (const t of timers) clearTimeout(t);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort);

    // `timeout` mock — hech qachon yakunlanmaydi; `useCheckImport` timeout'i ishga tushadi.
    if (mockFlag === "timeout") {
      onProgress?.(15);
      return; // faqat abort yoki tashqi timeout to'xtatadi
    }

    const tick = () => {
      step += 1;
      const progress = Math.min(90, step * 30);
      onProgress?.(progress);
      if (step < 3) {
        timers.push(setTimeout(tick, STEP_MS));
        return;
      }
      cleanup();
      if (mockFlag === "unavailable") {
        reject(new CheckImportError("source-unavailable", "Chek manbasi javob bermadi"));
        return;
      }
      onProgress?.(100);
      resolve(buildMockCheck(url));
    };

    timers.push(setTimeout(tick, STEP_MS));
  });
}

function readMockFlag(url: string): "unavailable" | "timeout" | null {
  try {
    const value = new URL(url).searchParams.get("mock");
    if (value === "unavailable" || value === "timeout") return value;
  } catch {
    /* buildMockCheck oldidan parseCheckSource tekshirgan — bu yerga yaroqli URL keladi */
  }
  return null;
}

/** URL'dan deterministik "chek" yasaladi — bir xil havola → bir xil natija. */
function buildMockCheck(url: string): ImportedCheck {
  const hash = hashString(url);
  const merchants = ["Korzinka", "Makro", "Havas", "Oasis", "Baraka Market"];
  const merchantName = merchants[hash % merchants.length];
  const amount = (2000 + (hash % 480_000)).toFixed(2);
  const itemCount = 1 + (hash % 9);
  const day = 1 + (hash % 28);
  const month = 1 + (hash % 12);
  const purchasedAt = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    id: `chk_${hash.toString(16)}`,
    merchantName,
    totalAmount: amount,
    currency: "UZS",
    purchasedAt,
    itemCount,
    sourceUrl: url,
  };
}

function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function abortError(): DOMException {
  return new DOMException("Import bekor qilindi", "AbortError");
}
