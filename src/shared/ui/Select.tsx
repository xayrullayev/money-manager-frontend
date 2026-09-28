import { useId, type SelectHTMLAttributes } from "react";
import { shouldUseCombobox } from "../lib/optionSearch";
import { Combobox } from "./Combobox";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  /**
   * Qidiriladigan Combobox'ga o‘tish. Berilmasa avtomatik: 10+ variant → Combobox,
   * kichik ro‘yxat → native select (Design-02). `false` — doim native.
   */
  searchable?: boolean;
}

/**
 * Umumiy select — Design-02 Select komponenti.
 * Native <select> (mobil klaviatura/accessibility uchun eng ishonchli),
 * label/xato/yordam matni bilan o'raladi. 10+ variantda qidiriladigan
 * Combobox'ga o'tadi — chaqiruvchi kod o'zgarmaydi.
 */
export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
  error,
  hint,
  id,
  disabled,
  className,
  searchable,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  if (shouldUseCombobox(options.length, searchable)) {
    return (
      <Combobox
        label={label} value={value} onChange={onChange} options={options} placeholder={placeholder}
        optional={optional} error={error} hint={hint} id={id} disabled={disabled} className={className}
      />
    );
  }
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;
  const describedBy = [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (ixtiyoriy)</span>}
      </label>
      <div className={styles.wrapper}>
        <select
          id={selectId}
          className={[styles.select, error ? styles.selectError : ""].filter(Boolean).join(" ")}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </div>
      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hintText}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
