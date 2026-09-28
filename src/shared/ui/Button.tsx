import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** React 19: ref oddiy prop sifatida uzatiladi (masalan Dialog tasdig'ida fokus uchun). */
  ref?: Ref<HTMLButtonElement>;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/** Primary CTA komponenti — Design-02 Button/Primary spec. 44px+ touch target. */
export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={loading ? styles.hiddenLabel : undefined}>{children}</span>
    </button>
  );
}
