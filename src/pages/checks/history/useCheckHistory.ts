import { useCallback, useEffect, useRef, useState } from "react";
import { listChecks as defaultListChecks, type ChecksPage, type ListChecksParams } from "./checkHistoryApi";
import type { CheckSummary } from "./checkTypes";

const DEFAULT_PAGE_SIZE = 4;

type ListFn = (params: ListChecksParams) => Promise<ChecksPage>;

export interface UseCheckHistoryOptions {
  pageSize?: number;
  /** Test uchun inject qilinadigan ro'yxat funksiyasi. */
  listFn?: ListFn;
}

export type CheckHistoryPhase = "loading" | "ready" | "error";

export interface CheckHistoryState {
  phase: CheckHistoryPhase;
  items: CheckSummary[];
  /** Keyingi sahifa mavjudmi. */
  hasMore: boolean;
  /** "Yana" bosilgandagi qo'shimcha yuklash (birinchi yuklash emas). */
  loadingMore: boolean;
  total: number;
}

export interface CheckHistoryController extends CheckHistoryState {
  loadMore: () => void;
  reload: () => void;
}

export function useCheckHistory(options: UseCheckHistoryOptions = {}): CheckHistoryController {
  const listFn = options.listFn ?? defaultListChecks;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const [state, setState] = useState<CheckHistoryState>({
    phase: "loading",
    items: [],
    hasMore: false,
    loadingMore: false,
    total: 0,
  });

  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  // Har bir yuklash uchun ketma-ket ID — faqat eng oxirgi so'rov natijasi qo'llanadi
  // (eskirgan javob yangi filtr/sahifani bosib ketmaydi).
  const requestIdRef = useRef(0);
  const pageRef = useRef(0);

  const load = useCallback(
    (page: number, mode: "replace" | "append") => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setState((prev) =>
        mode === "replace"
          ? { ...prev, phase: "loading", loadingMore: false }
          : { ...prev, loadingMore: true },
      );

      listFn({ page, pageSize, signal: controller.signal })
        .then((res) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current || !mountedRef.current) return;
          pageRef.current = res.page;
          setState((prev) => ({
            phase: "ready",
            items: mode === "append" ? [...prev.items, ...res.items] : res.items,
            hasMore: res.hasMore,
            loadingMore: false,
            total: res.total,
          }));
        })
        .catch((error: unknown) => {
          if ((error as { name?: string })?.name === "AbortError") return;
          if (requestId !== requestIdRef.current || !mountedRef.current) return;
          setState((prev) => ({ ...prev, phase: mode === "replace" ? "error" : prev.phase, loadingMore: false }));
        });
    },
    [listFn, pageSize],
  );

  const loadMore = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "ready" || !prev.hasMore || prev.loadingMore) return prev;
      load(pageRef.current + 1, "append");
      return prev;
    });
  }, [load]);

  const reload = useCallback(() => {
    pageRef.current = 0;
    load(1, "replace");
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    load(1, "replace");
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, loadMore, reload };
}
