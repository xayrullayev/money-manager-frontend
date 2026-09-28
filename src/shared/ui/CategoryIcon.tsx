import { CATEGORY_ICONS, toCategoryTokens } from "../lib/categoryTokens";
import styles from "./CategoryIcon.module.css";

/**
 * Design-07: kategoriya belgisi — rangli fon + icon. Dekorativ (`aria-hidden`),
 * chunki yonida doim kategoriya nomi yoziladi.
 */
export function CategoryIcon({ iconKey, colorToken, size = "md" }: { iconKey: string; colorToken: string; size?: "sm" | "md" }) {
  const tokens = toCategoryTokens(iconKey, colorToken);
  return (
    <span
      className={`${styles.icon} ${size === "sm" ? styles.sm : ""}`}
      style={{ background: `var(--category-${tokens.colorToken}-bg)`, borderColor: `var(--category-${tokens.colorToken})` }}
      aria-hidden="true"
    >
      {CATEGORY_ICONS[tokens.iconKey].glyph}
    </span>
  );
}
