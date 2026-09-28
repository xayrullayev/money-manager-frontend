import { useRef, type KeyboardEvent } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Segmented tabs — Design-02 Tabs komponenti (WAI-ARIA APG: roving tabindex,
 * chap/o'ng strelka bilan navigatsiya). Operatsiya turi, davr filtri va h.k. uchun.
 */
export function Tabs({ items, value, onChange, ariaLabel, className }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusEnabled(fromIndex: number, direction: 1 | -1) {
    const count = items.length;
    for (let step = 1; step <= count; step += 1) {
      const index = (fromIndex + direction * step + count) % count;
      const candidate = items[index];
      if (!candidate.disabled) {
        refs.current[candidate.value]?.focus();
        onChange(candidate.value);
        return;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusEnabled(index, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusEnabled(index, -1);
    }
  }

  return (
    <div className={[styles.tablist, className ?? ""].filter(Boolean).join(" ")} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[item.value] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={[styles.tab, selected ? styles.tabActive : ""].filter(Boolean).join(" ")}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
