import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { filterOptions, nextEnabledIndex } from "../lib/optionSearch";
import type { SelectOption } from "./Select";
import styles from "./Combobox.module.css";

export interface ComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Design-02: qidiriladigan Combobox (WAI-ARIA 1.2 "combobox + listbox").
 * 10+ variantli ro‘yxatlar uchun — `Select` o‘zi shu komponentga o‘tadi.
 *
 * Klaviatura: ↓/↑ ochadi va variantlar bo‘ylab yuradi (disabled o‘tkaziladi),
 * Home/End, Enter tanlaydi, Esc yopadi (Dialog'ni yopmaydi), Tab yopib keyingi
 * elementga o‘tadi. Fokus doim inputda qoladi — `aria-activedescendant`.
 */
export function Combobox({ label, value, onChange, options, placeholder, optional, error, hint, id, disabled, className }: ComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);

  const selected = options.find((option) => option.value === value);
  const visible = useMemo(() => filterOptions(options, query), [options, query]);
  const activeOption = active >= 0 ? visible[active] : undefined;

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.value === value);
    setQuery("");
    setActive(selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : nextEnabledIndex(options, -1, 1));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  function choose(option: SelectOption | undefined) {
    if (!option || option.disabled) return;
    if (option.value !== value) onChange(option.value);
    close();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) return openList();
        setActive((current) => nextEnabledIndex(visible, current < 0 && event.key === "ArrowUp" ? 0 : current, event.key === "ArrowDown" ? 1 : -1));
        return;
      }
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActive(event.key === "Home" ? nextEnabledIndex(visible, -1, 1) : nextEnabledIndex(visible, 0, -1));
        return;
      case "Enter":
        if (!open) return;
        event.preventDefault(); // formani yubormaydi, faqat tanlaydi
        choose(activeOption);
        return;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        event.stopPropagation(); // Dialog ESC bilan yopilmasin — avval ro‘yxat yopiladi
        close();
        return;
      case "Tab":
        if (open) close();
        return;
    }
  }

  const describedBy = [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (ixtiyoriy)</span>}
      </label>
      <div className={styles.wrapper}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && activeOption ? `${listId}-${activeOption.value}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={[styles.input, error ? styles.inputError : ""].filter(Boolean).join(" ")}
          value={open ? query : (selected?.label ?? "")}
          placeholder={open ? (selected?.label ?? "Qidirish…") : placeholder}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            if (!open) setOpen(true);
            setQuery(next);
            setActive(nextEnabledIndex(filterOptions(options, next), -1, 1));
          }}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKeyDown}
          onBlur={close}
        />
        <span className={styles.chevron} aria-hidden="true">▾</span>
        <ul ref={listRef} id={listId} role="listbox" aria-label={label} className={styles.list} hidden={!open}>
          {visible.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${option.value}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              className={[styles.option, index === active ? styles.optionActive : ""].filter(Boolean).join(" ")}
              // mousedown'da blur bo‘lmasin, aks holda ro‘yxat click'dan oldin yopiladi
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => !option.disabled && setActive(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className={styles.check} aria-hidden="true">✓</span>}
            </li>
          ))}
          {open && visible.length === 0 && (
            <li className={styles.empty} role="presentation">“{query.trim()}” bo‘yicha hech narsa topilmadi</li>
          )}
        </ul>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {open ? (visible.length ? `${visible.length} ta variant` : "Hech narsa topilmadi") : ""}
      </span>
      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">{error}</p>
      ) : hint ? (
        <p id={hintId} className={styles.hintText}>{hint}</p>
      ) : null}
    </div>
  );
}
