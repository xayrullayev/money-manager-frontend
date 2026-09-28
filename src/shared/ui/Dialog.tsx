import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { DialogCloseContext, useDialogClose } from "./dialogContext";
import styles from "./Dialog.module.css";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** desktopda kengroq dialog (masalan ko'p ustunli forma) */
  wide?: boolean;
  /** true bo'lsa ESC va overlay bosish bilan yopilmaydi (masalan submit jarayonida) */
  preventClose?: boolean;
  /**
   * Forma o'zgartirilgan bo'lsa true. Shunda ESC, overlay, × va `DialogCancelButton`
   * darhol yopmaydi — avval "Saqlanmagan o'zgarishlar" tasdig'i chiqadi (Design-02).
   */
  dirty?: boolean;
  /** Tasdiq matni; standart: "Kiritilgan o‘zgarishlar saqlanmaydi. Yopilsinmi?" */
  discardMessage?: string;
}

/** Formadagi "Bekor qilish" — to'g'ridan-to'g'ri onClose emas, dirty tasdig'idan o'tadi. */
export function DialogCancelButton({ children = "Bekor qilish", disabled }: { children?: ReactNode; disabled?: boolean }) {
  const requestClose = useDialogClose();
  return (
    <Button type="button" variant="secondary" onClick={requestClose} disabled={disabled}>
      {children}
    </Button>
  );
}

/**
 * Umumiy modal — Design-02 Dialog komponenti: desktopda markazlashgan dialog,
 * mobilda pastdan chiquvchi sheet (bitta komponent, CSS orqali responsive).
 * Focus trap, ESC bilan yopish, orqadagi scroll bloklanadi, ochilganda birinchi
 * fokuslanadigan elementga fokus beriladi, yopilganda oldingi fokus qaytariladi.
 * `dirty` bo'lsa har qanday yopish yo'li tasdiq so'raydi; tasdiqda ESC = "Davom etish".
 * Design-05/07/09/11 kabi barcha dialog/sheet ekranlari shu komponentdan foydalanishi kerak.
 */
export function Dialog({ title, onClose, children, wide, preventClose, dirty, discardMessage }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const state = useRef({ onClose, preventClose, dirty, confirming });
  useEffect(() => {
    state.current = { onClose, preventClose, dirty, confirming };
  }, [onClose, preventClose, dirty, confirming]);

  const requestClose = useCallback(() => {
    const { onClose: close, preventClose: locked, dirty: isDirty } = state.current;
    if (locked) return;
    if (isDirty) setConfirming(true);
    else close();
  }, []);

  useEffect(() => {
    if (confirming) keepEditingRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    // `data-autofocus` bilan belgilangan element birinchi fokus oladi (masalan xavfli dialogda "Bekor qilish").
    (
      dialog?.querySelector<HTMLElement>("[data-autofocus]") ??
      dialog?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')
    )?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Ichki komponent (masalan ochiq Combobox) ESC'ni o'zi ishlatgan bo'lsa — dialog yopilmaydi.
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (state.current.confirming) setConfirming(false);
        else requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [requestClose]);

  return (
    <div className={styles.overlay} onClick={requestClose} role="presentation">
      <div
        ref={dialogRef}
        className={[styles.sheet, wide ? styles.sheetWide : ""].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id="dialog-title">
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={requestClose}
            disabled={preventClose}
            aria-label="Yopish"
          >
            ×
          </button>
        </div>
        {confirming && (
          <div className={styles.confirm} role="group" aria-labelledby="dialog-discard-text">
            <p id="dialog-discard-text" className={styles.confirmText} aria-live="assertive">
              {discardMessage ?? "Kiritilgan o‘zgarishlar saqlanmaydi. Yopilsinmi?"}
            </p>
            <div className={styles.confirmActions}>
              <Button ref={keepEditingRef} variant="secondary" onClick={() => setConfirming(false)}>
                Davom etish
              </Button>
              <Button variant="danger" onClick={() => state.current.onClose()}>
                Ha, yopish
              </Button>
            </div>
          </div>
        )}
        <DialogCloseContext.Provider value={requestClose}>{children}</DialogCloseContext.Provider>
      </div>
    </div>
  );
}
