import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Frontend-CHECK-02 — kamera orqali QR skaneri.
 *
 * - Kamera faqat aniq foydalanuvchi harakati (`start`) bilan yoqiladi.
 * - `BarcodeDetector` yo'q bo'lsa → `unsupported` (havola fallback ko'rsatiladi).
 * - Ruxsat rad etilsa → `denied`.
 * - Bir xil QR ketma-ket o'qilsa dedupe qilinadi; import mantiqi ham alohida
 *   dedupe qiladi, bu esa kamera darajasidagi "double read"ni kamaytiradi.
 * - `stop`da va unmountda kamera track'lari va animation frame to'xtaydi.
 */

export type QrScannerState = "idle" | "starting" | "scanning" | "denied" | "unsupported" | "error";

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

/** Kamera QR skanerini brauzer qo'llab-quvvatlaydimi (SSR/jsdom'da `false`). */
export function isQrScanSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof (globalThis as { BarcodeDetector?: unknown }).BarcodeDetector === "function"
  );
}

export interface UseQrScannerOptions {
  /** Har bir (dedupe qilingan) QR o'qilganda chaqiriladi. */
  onScan: (rawValue: string) => void;
  /** Skanerni to'xtatmasdan, aynan bir xil qiymatni qayta yubormaslik oynasi (ms). */
  dedupeWindowMs?: number;
}

export interface QrScannerController {
  state: QrScannerState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => void;
  stop: () => void;
}

export function useQrScanner(options: UseQrScannerOptions): QrScannerController {
  const { onScan, dedupeWindowMs = 2500 } = options;
  const [state, setState] = useState<QrScannerState>("idle");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastValueRef = useRef<{ value: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    detectorRef.current = null;
    setState("idle");
  }, []);

  const handleValue = useCallback(
    (rawValue: string) => {
      const now = Date.now();
      const last = lastValueRef.current;
      if (last && last.value === rawValue && now - last.at < dedupeWindowMs) {
        return; // takroriy o'qish — tashlab yuboramiz
      }
      lastValueRef.current = { value: rawValue, at: now };
      onScanRef.current(rawValue);
    },
    [dedupeWindowMs],
  );

  const start = useCallback(() => {
    if (!isQrScanSupported()) {
      setState("unsupported");
      return;
    }
    setState("starting");

    const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector!;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        detectorRef.current = new Detector({ formats: ["qr_code"] });
        const video = videoRef.current;
        if (!video) {
          stop();
          return;
        }
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        return video.play().then(() => {
          setState("scanning");
          scanLoop();
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const name = (error as { name?: string })?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setState("denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setState("unsupported");
        } else {
          setState("error");
        }
      });

    function scanLoop() {
      const detector = detectorRef.current;
      const video = videoRef.current;
      if (!detector || !video || cancelled) return;
      detector
        .detect(video)
        .then((codes) => {
          if (codes.length > 0 && codes[0].rawValue) handleValue(codes[0].rawValue);
        })
        .catch(() => {
          /* alohida kadr xatosi — skanni davom ettiramiz */
        })
        .finally(() => {
          if (!cancelled) rafRef.current = requestAnimationFrame(scanLoop);
        });
    }

    // start qayta chaqirilsa oldingi loopni to'xtatish uchun cancelled bayrog'i
    // stop() ichida track'lar tozalanadi; bu yerda faqat scanLoop uchun.
    cleanupRef.current = () => {
      cancelled = true;
    };
  }, [handleValue, stop]);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      // Unmountda kamera track'lari va RAF to'xtaydi.
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
      }
    };
  }, []);

  return { state, videoRef, start, stop };
}
