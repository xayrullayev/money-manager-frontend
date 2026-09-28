import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  className?: string;
}

/** Design-02: bitta skelet bloki. Dekorativ — holat `SkeletonList` yoki chaqiruvchi tomonidan e'lon qilinadi. */
export function Skeleton({ width = "100%", height = 16, radius = "var(--radius-sm)", className }: SkeletonProps) {
  return (
    <span
      className={[styles.block, className ?? ""].filter(Boolean).join(" ")}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/**
 * Ro'yxat/karta yuklanishi uchun tayyor skelet: `rows` ta qator (belgi + ikki satr).
 * `role="status"` + ko'rinmas matn — ekran o'quvchi "… yuklanmoqda" deb eshitadi.
 */
export function SkeletonList({ rows = 3, label = "Yuklanmoqda…", variant = "row" }: { rows?: number; label?: string; variant?: "row" | "card" }) {
  return (
    <div className={variant === "card" ? styles.cards : styles.list} role="status" aria-busy="true">
      <span className={styles.srOnly}>{label}</span>
      {Array.from({ length: rows }, (_, i) =>
        variant === "card" ? (
          <div key={i} className={styles.card} aria-hidden="true">
            <Skeleton width="40%" height={12} />
            <Skeleton width="70%" height={20} />
            <Skeleton width="55%" height={24} />
          </div>
        ) : (
          <div key={i} className={styles.row} aria-hidden="true">
            <Skeleton width={36} height={36} radius="var(--radius-pill)" />
            <div className={styles.lines}>
              <Skeleton width={`${60 - (i % 3) * 12}%`} height={14} />
              <Skeleton width={`${35 + (i % 2) * 10}%`} height={12} />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
