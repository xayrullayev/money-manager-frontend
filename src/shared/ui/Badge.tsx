import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "danger";

interface BadgeProps {
  children: ReactNode;
  /** neutral (meta chip), accent (rol/teg), success ("Bajarildi"), danger (o'qilmagan soni). */
  tone?: BadgeTone;
  /** Yumaloq son ko'rinishi (o'qilmagan hisoblagich) — min 18px, markazlangan. */
  count?: boolean;
  className?: string;
}

/**
 * Design-Migrate-07: kichik yorliq/hisoblagich (rol chipi "Trainer", o'qilmagan "5",
 * "Bajarildi"). Rang hech qachon yagona signal emas — matn doim yoniga yoziladi.
 */
export function Badge({ children, tone = "neutral", count, className }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[tone], count ? styles.count : "", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
