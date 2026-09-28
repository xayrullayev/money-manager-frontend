import { useId } from "react";
import styles from "./PhoneInput.module.css";

interface PhoneInputProps {
  /** Faqat mamlakat kodisiz raqamlar, masalan "901234567" */
  value: string;
  onChange: (digits: string) => void;
  countryCode: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const NATIONAL_LENGTH = 9; // O'zbekiston: 9 xonali milliy raqam (901234567)

/** "901234567" -> "90 123 45 67" ko'rinishida formatlaydi */
function formatMasked(digits: string): string {
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return parts.join(" ");
}

/**
 * Telefon raqam input — Design-AUTH-01 spec: mask `__ ___ __ __`,
 * faqat raqam, numeric keypad, +998 mamlakat kodi (MVP uchun fiksirlangan).
 */
export function PhoneInput({
  value,
  onChange,
  countryCode,
  error,
  disabled,
  autoFocus,
}: PhoneInputProps) {
  const inputId = useId();
  const errorId = useId();

  function handleChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, NATIONAL_LENGTH);
    onChange(digitsOnly);
  }

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        Telefon raqami
      </label>
      <div
        className={[styles.wrapper, error ? styles.wrapperError : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <span className={styles.countryCode} aria-hidden="true">
          {countryCode}
        </span>
        <input
          id={inputId}
          className={styles.input}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="90 123 45 67"
          value={formatMasked(value)}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          maxLength={12}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export { NATIONAL_LENGTH };
