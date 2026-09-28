import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Asosiy CTA (odatda bitta Button) */
  action?: ReactNode;
  /** Dekorativ belgi (emoji yoki kichik ikonka) — ekran o'quvchidan yashiriladi */
  icon?: ReactNode;
  /** Sahifa ierarxiyasiga mos sarlavha darajasi; standart h2 */
  headingLevel?: 2 | 3;
  /** "error" — role=alert va xato rangi (masalan "Yuklab bo'lmadi" + Qayta urinish) */
  tone?: "neutral" | "error";
  compact?: boolean;
}

/**
 * Design-02: bo'sh / xato holat bloki — sarlavha, izoh va bitta CTA.
 * Har sahifa o'z variantini yozmasligi uchun umumiy komponent.
 */
export function EmptyState({ title, description, action, icon, headingLevel = 2, tone = "neutral", compact }: EmptyStateProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <section
      className={[styles.root, compact ? styles.compact : "", tone === "error" ? styles.error : ""].filter(Boolean).join(" ")}
      role={tone === "error" ? "alert" : undefined}
    >
      {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
      <Heading className={styles.title}>{title}</Heading>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}
