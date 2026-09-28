import type { ElementType, ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  variant?: "surface" | "subtle" | "outlined";
  padding?: "sm" | "md" | "lg";
  title?: ReactNode;
  action?: ReactNode;
  titleId?: string;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const PADDING_CLASS = { sm: styles.paddingSm, md: styles.paddingMd, lg: styles.paddingLg };
const VARIANT_CLASS = { surface: "", subtle: styles.subtle, outlined: styles.outlined };

/** Umumiy surface konteyner — Design-02 Card komponenti (dashboard/hisobot/sozlama bloklari uchun). */
export function Card({
  variant = "surface",
  padding = "lg",
  title,
  action,
  titleId,
  as: Component = "section",
  className,
  children,
}: CardProps) {
  return (
    <Component
      className={[styles.card, VARIANT_CLASS[variant], PADDING_CLASS[padding], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && (
        <div className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </Component>
  );
}
