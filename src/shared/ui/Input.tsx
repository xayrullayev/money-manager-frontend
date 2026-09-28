import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Input.module.css";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "prefix" | "suffix"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Sarlavha yonida "(ixtiyoriy)" belgisi — Design-11 kabi ixtiyoriy qadamlar uchun */
  optional?: boolean;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/**
 * Umumiy matn input — Design-02 Input komponenti.
 * Label + xato/yordam matni + fokus holati (44px+ touch target, WCAG AA kontrast).
 */
export function Input({
  label,
  value,
  onChange,
  optional,
  error,
  hint,
  prefix,
  suffix,
  id,
  disabled,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, !error && hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (ixtiyoriy)</span>}
      </label>
      <div
        className={[
          styles.wrapper,
          error ? styles.wrapperError : "",
          disabled ? styles.wrapperDisabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          id={inputId}
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
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
