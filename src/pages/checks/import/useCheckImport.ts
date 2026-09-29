import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  INITIAL_IMPORT_STATUS,
  importStatusReducer,
  parseCheckSource,
  type ImportErrorCode,
} from "./importSource";
import {
  CheckImportError,
  importCheckFromUrl,
  type ImportCheckOptions,
  type ImportedCheck,
} from "./checkImportApi";

/** Import shu vaqtdan uzoq davom etsa "timeout" xatosi ko'rsatiladi. */
const PROCESSING_TIMEOUT_MS = 20_000;

type ImportFn = (url: string, options: ImportCheckOptions) => Promise<ImportedCheck>;

export interface UseCheckImportOptions {
  /** Test uchun inject qilinadigan import funksiyasi; standart — mock client. */
  importFn?: ImportFn;
  processingTimeoutMs?: number;
}

export interface CheckImportController {
  status: ReturnType<typeof importStatusReducer>;
  /** Oxirgi muvaffaqiyatli import qilingan chek (dedupe uchun ham ishlatiladi). */
  lastCheck: ImportedCheck | null;
  /**
   * QR yoki havoladan import boshlaydi. Bir xil manba qayta kelsa (double-click
   * yoki takroriy QR) yangi so'rov yubormaydi — oldingi chekni qaytaradi.
   */
  submit: (rawInput: string) => void;
  reset: () => void;
}

export function useCheckImport(options: UseCheckImportOptions = {}): CheckImportController {
  const importFn = options.importFn ?? importCheckFromUrl;
  const timeoutMs = options.processingTimeoutMs ?? PROCESSING_TIMEOUT_MS;

  const [status, dispatch] = useReducer(importStatusReducer, INITIAL_IMPORT_STATUS);

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckRef = useRef<ImportedCheck | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightKeyRef.current = null;
    clearTimers();
  }, [clearTimers]);

  const finishError = useCallback((code: ImportErrorCode) => {
    inFlightKeyRef.current = null;
    clearTimers();
    if (mountedRef.current) dispatch({ type: "error", code });
  }, [clearTimers]);

  const submit = useCallback(
    (rawInput: string) => {
      const parsed = parseCheckSource(rawInput);
      if (!parsed.ok) {
        finishError("invalid-url");
        return;
      }
      const { url, dedupeKey } = parsed.source;

      // Dedupe: aynan shu manba hozir yuklanmoqda — takroriy so'rovni tashlab yuboramiz.
      if (inFlightKeyRef.current === dedupeKey) return;

      // Dedupe: aynan shu manba allaqachon import qilingan — qayta so'ramay, oldingi chekni ochamiz.
      if (lastKeyRef.current === dedupeKey && lastCheckRef.current) {
        dispatch({ type: "success", checkId: lastCheckRef.current.id });
        return;
      }

      cancelInFlight();
      const controller = new AbortController();
      abortRef.current = controller;
      inFlightKeyRef.current = dedupeKey;
      dispatch({ type: "start" });

      timeoutRef.current = setTimeout(() => {
        controller.abort();
        finishError("timeout");
      }, timeoutMs);

      importFn(url, {
        signal: controller.signal,
        onProgress: (value) => {
          if (mountedRef.current) dispatch({ type: "progress", value });
        },
      })
        .then((check) => {
          if (controller.signal.aborted) return;
          lastCheckRef.current = check;
          lastKeyRef.current = dedupeKey;
          inFlightKeyRef.current = null;
          clearTimers();
          if (mountedRef.current) dispatch({ type: "success", checkId: check.id });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return; // abort/timeout allaqachon ko'rsatilgan
          if (error instanceof CheckImportError && error.code === "source-unavailable") {
            finishError("source-unavailable");
          } else {
            finishError("unknown");
          }
        });
    },
    [cancelInFlight, clearTimers, finishError, importFn, timeoutMs],
  );

  const reset = useCallback(() => {
    cancelInFlight();
    dispatch({ type: "reset" });
  }, [cancelInFlight]);

  // Unmount: kamera emas, lekin polling/import so'rovi to'xtatiladi (talab: unmountda to'xtaydi).
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    status,
    lastCheck: lastCheckRef.current,
    submit,
    reset,
  };
}
