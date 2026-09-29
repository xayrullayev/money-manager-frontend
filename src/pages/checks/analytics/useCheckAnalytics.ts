import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCheckAnalytics as defaultGetAnalytics,
  type AnalyticsResult,
  type GetAnalyticsParams,
} from "./checkAnalyticsApi";
import type { AnalyticsMetric, AnalyticsPeriod } from "./checkAnalytics";

type AnalyticsFn = (params: GetAnalyticsParams) => Promise<AnalyticsResult>;

export interface UseCheckAnalyticsOptions {
  initialPeriod?: AnalyticsPeriod;
  initialMetric?: AnalyticsMetric;
  /** Test/dev uchun mos sana. */
  refDate?: string;
  /** Test uchun inject qilinadigan funksiya. */
  analyticsFn?: AnalyticsFn;
}

export type AnalyticsPhase = "loading" | "ready" | "error";

export interface CheckAnalyticsController {
  phase: AnalyticsPhase;
  period: AnalyticsPeriod;
  metric: AnalyticsMetric;
  result: AnalyticsResult | null;
  setPeriod: (period: AnalyticsPeriod) => void;
  setMetric: (metric: AnalyticsMetric) => void;
  reload: () => void;
}

export function useCheckAnalytics(options: UseCheckAnalyticsOptions = {}): CheckAnalyticsController {
  const analyticsFn = options.analyticsFn ?? defaultGetAnalytics;

  const [period, setPeriodState] = useState<AnalyticsPeriod>(options.initialPeriod ?? "week");
  const [metric, setMetricState] = useState<AnalyticsMetric>(options.initialMetric ?? "amount");
  const [phase, setPhase] = useState<AnalyticsPhase>("loading");
  const [result, setResult] = useState<AnalyticsResult | null>(null);

  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  // Faqat eng oxirgi so'rov natijasi qo'llanadi — eskirgan javob yangi filtrni bosmaydi.
  const requestIdRef = useRef(0);

  const load = useCallback(
    (nextPeriod: AnalyticsPeriod, nextMetric: AnalyticsMetric) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;
      setPhase("loading");

      analyticsFn({ period: nextPeriod, metric: nextMetric, refDate: options.refDate, signal: controller.signal })
        .then((res) => {
          if (controller.signal.aborted || requestId !== requestIdRef.current || !mountedRef.current) return;
          setResult(res);
          setPhase("ready");
        })
        .catch((error: unknown) => {
          if ((error as { name?: string })?.name === "AbortError") return;
          if (requestId !== requestIdRef.current || !mountedRef.current) return;
          setPhase("error");
        });
    },
    [analyticsFn, options.refDate],
  );

  const setPeriod = useCallback(
    (next: AnalyticsPeriod) => {
      setPeriodState(next);
      load(next, metric);
    },
    [load, metric],
  );

  const setMetric = useCallback(
    (next: AnalyticsMetric) => {
      setMetricState(next);
      load(period, next);
    },
    [load, period],
  );

  const reload = useCallback(() => load(period, metric), [load, period, metric]);

  useEffect(() => {
    mountedRef.current = true;
    load(period, metric);
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { phase, period, metric, result, setPeriod, setMetric, reload };
}
