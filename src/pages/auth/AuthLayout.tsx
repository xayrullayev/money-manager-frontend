import type { ReactNode } from "react";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Auth ekranlari uchun umumiy shell — logo, sarlavha, orqaga tugma, footer. */
export function AuthLayout({ title, subtitle, onBack, children, footer }: AuthLayoutProps) {
  useDocumentTitle();
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        {onBack && (
          <button type="button" className={styles.backButton} onClick={onBack} aria-label="Orqaga">
            ← Orqaga
          </button>
        )}
        <div className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">
            M
          </div>
          <span className={styles.brandName}>Money Manager</span>
        </div>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
