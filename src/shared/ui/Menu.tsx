import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Menu.module.css";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  /** Qaytarib bo'lmaydigan amal (masalan "Limitni olib tashlash") — danger rangida */
  tone?: "default" | "danger";
}

interface MenuButtonProps {
  /** Tugmaning ekran o'quvchi nomi, masalan "Kunlik limit amallari" */
  label: string;
  items: MenuItem[];
  /** Tugma ichidagi belgi; standart — vertikal ⋮ */
  icon?: ReactNode;
  className?: string;
}

/**
 * Umumiy amallar menyusi (WAI-ARIA menu button): tugma `aria-haspopup="menu"` + `aria-expanded`,
 * ro'yxat `role="menu"`, bandlar `role="menuitem"`. Klaviatura: Enter/Space/↓ ochib birinchi bandga,
 * ↑ — oxirgi bandga; menyuda ↑/↓ aylanadi, Home/End, Esc yopadi. Esc, tashqariga bosish va band
 * tanlash fokusni tugmaga qaytaradi (tanlangan amal dialog ochsa, dialog yopilganda ham shu tugmaga).
 * Tab menyuni yopadi va fokus tabiiy tartibda davom etadi. Barcha bosish maydonlari ≥ 44px.
 */
export function MenuButton({ label, items, icon, className }: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocus = useRef<"first" | "last">("first");
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const target = pendingFocus.current === "last" ? itemRefs.current[items.length - 1] : itemRefs.current[0];
    target?.focus();
    function handlePointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        // Bosish oxirida brauzer fokusni o'zi o'zgartiradi: bo'sh joyga bosilsa fokus tugmaga
        // qaytadi, boshqa interaktiv elementga bosilsa fokus o'sha yerda qoladi.
        setTimeout(() => {
          if (document.activeElement === document.body || document.activeElement === null) buttonRef.current?.focus();
        });
      }
    }
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [open, items.length]);

  function openMenu(focus: "first" | "last") {
    pendingFocus.current = focus;
    setOpen(true);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function handleButtonKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMenu("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  }

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const count = items.length;
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const focusAt = (index: number) => itemRefs.current[(index + count) % count]?.focus();
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current < 0 ? count - 1 : current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(count - 1);
        break;
      case "Escape":
        // Dialog ichida bo'lsa ham faqat menyu yopilsin.
        event.preventDefault();
        event.stopPropagation();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={[styles.root, className ?? ""].filter(Boolean).join(" ")}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu("first"))}
        onKeyDown={handleButtonKey}
      >
        {icon ?? <KebabIcon />}
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className={styles.menu} onKeyDown={handleMenuKey}>
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={[styles.item, item.tone === "danger" ? styles.danger : ""].filter(Boolean).join(" ")}
              onClick={() => {
                close(true);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KebabIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
