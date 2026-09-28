import type { CSSProperties } from "react";
import { isCategoryColorToken } from "../lib/categoryTokens";
import styles from "./SavingPlanIcon.module.css";
const paths: Record<string, string> = {
  emergency: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1",
  travel: "m21 3-7 8-8-3-2 2 7 5-3 4 2 2 4-3 5 3 2-2-3-8 3-7Z",
  home: "m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8",
  car: "m4 10 2-6h12l2 6M3 10h18v9H3Zm2 9v2m14-2v2M6 14h2m8 0h2",
  education: "m2 8 10-5 10 5-10 5-10-5Zm4 3v7l6 3 6-3v-7m4-3v9",
  wedding: "M14 14a6 6 0 1 1-6-6m2-4 3-2 3 2-3 5-3-5Zm3 5a6 6 0 1 1-3 5",
  gadget: "M6 2h12v20H6ZM10 18h4",
  health: "M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z",
  gift: "M3 8h18v4H3Zm2 4v9h14v-9M12 8v13m0-13C2 8 5 0 9 4l3 4Zm0 0c10 0 7-8 3-4l-3 4Z",
  business: "M8 7V3h8v4M3 7h18v14H3ZM3 12l9 3 9-3M12 12v5",
  retirement: "M6 11V5h12v6M3 10h4v6h10v-6h4v10H3Zm2 10v2m14-2v2",
  other:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
};
export function SavingPlanIcon({
  iconKey = "other",
  colorToken = "green",
  size = "md",
}: {
  iconKey?: string;
  colorToken?: string;
  size?: "sm" | "md";
}) {
  const color = isCategoryColorToken(colorToken) ? colorToken : "gray";
  return (
    <span
      aria-hidden="true"
      className={`${styles.icon} ${styles[size]}`}
      style={
        { "--saving-icon-color": `var(--category-${color})` } as CSSProperties
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={paths[iconKey] ?? paths.other} />
      </svg>
    </span>
  );
}
