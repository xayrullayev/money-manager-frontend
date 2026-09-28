import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import styles from "./OtpInput.module.css";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * 6-box style OTP input — Design-AUTH-02 spec.
 * Auto-focus keyingi katakka, paste orqali to'liq kodni joylashtirish,
 * platforma SMS autofill (`autocomplete="one-time-code"`), xatoda shake.
 */
export function OtpInput({ length, value, onChange, error, disabled }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  function setDigit(index: number, char: string) {
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, char);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted.slice(0, length));
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div>
      <div
        className={[styles.row, error ? styles.rowError : ""].filter(Boolean).join(" ")}
        role="group"
        aria-label="SMS tasdiqlash kodi"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            className={styles.box}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={index === 0}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            aria-label={`Kod, ${index + 1}-xona`}
            aria-invalid={Boolean(error)}
          />
        ))}
      </div>
      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
