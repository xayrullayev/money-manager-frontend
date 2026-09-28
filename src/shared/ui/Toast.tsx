import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

type ToastVariant = "success" | "error" | "info";

/** Toast qanday yopilgani: vaqt tugadi, × bosildi yoki action (masalan "Bekor qilish") bosildi. */
export type ToastDismissReason = "timeout" | "close" | "action";

export interface ToastOptions {
  /** Masalan Undo: { label: "Bekor qilish", onClick } — Design-02/05/06. */
  action?: { label: string; onClick: () => void };
  /** Toast qaysi yo'l bilan bo'lmasin yopilganda bir marta chaqiriladi. */
  onDismiss?: (reason: ToastDismissReason) => void;
}

interface ToastRecord extends ToastOptions {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  /** Toast ko'rsatish. Standart 4s dan keyin avtomatik yopiladi (durationMs=0 — faqat qo'lda). */
  showToast: (message: string, variant?: ToastVariant, durationMs?: number, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON: Record<ToastVariant, string> = { success: "✓", error: "!", info: "i" };
const ROLE: Record<ToastVariant, "status" | "alert"> = { success: "status", error: "alert", info: "status" };
/** Design-02: bir vaqtda max 2 ta toast ko'rinadi, qolganlari navbatda kutadi. */
const MAX_VISIBLE = 2;

/**
 * Design-02 Toast komponenti. App ildizida bir marta o'raladi (App.tsx),
 * istalgan sahifa useToast() orqali bildirishnoma chaqiradi.
 * - max 2 ta ko'rinadi, qolganlari navbatda (taymer ko'ringandan keyin boshlanadi);
 * - hover/fokusda taymer to'xtaydi;
 * - success/info — polite, error — assertive (role="alert");
 * - ixtiyoriy action tugmasi (Undo) klaviatura bilan fokuslanadi.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((toast: ToastRecord, reason: ToastDismissReason) => {
    setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    toast.onDismiss?.(reason);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 4000, options?: ToastOptions) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, message, variant, durationMs, ...options }]);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport}>
          {toasts.slice(0, MAX_VISIBLE).map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (toast: ToastRecord, reason: ToastDismissReason) => void }) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(toast.durationMs);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (toast.durationMs <= 0 || paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => onDismissRef.current(toast, "timeout"), remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [toast, paused]);

  return (
    <div
      role={ROLE[toast.variant]}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className={[styles.toast, styles[toast.variant]].join(" ")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICON[toast.variant]}
      </span>
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast, "action");
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className={styles.closeBtn} aria-label="Yopish" onClick={() => onDismiss(toast, "close")}>
        ×
      </button>
    </div>
  );
}

/** Toast chaqirish uchun hook — ToastProvider ichidan foydalanish shart. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast faqat <ToastProvider> ichida ishlaydi");
  }
  return context;
}
