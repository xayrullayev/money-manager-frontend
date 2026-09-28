import type { CSSProperties } from "react";
import styles from "./StyleGuide.module.css";

/**
 * Typography — Urbanist shrift shkalasi (Figma "Style & Component / Typography").
 * Har qator haqiqiy px/weight bilan render qilinadi.
 */
type Row = { sample: string; size: number; weight: number; label: string };
type Scale = { title: string; rows: Row[] };

const SCALES: Scale[] = [
  {
    title: "Heading",
    rows: [
      { sample: "H1 · SemiBold", size: 32, weight: 600, label: "32px / 600" },
      { sample: "H1 · Bold", size: 32, weight: 700, label: "32px / 700" },
      { sample: "H2 · SemiBold", size: 28, weight: 600, label: "28px / 600" },
      { sample: "H2 · Bold", size: 28, weight: 700, label: "28px / 700" },
      { sample: "H3 · SemiBold", size: 26, weight: 600, label: "26px / 600" },
      { sample: "H4 · SemiBold", size: 24, weight: 600, label: "24px / 600" },
      { sample: "H5 · Bold", size: 22, weight: 700, label: "22px / 700" },
      { sample: "H5 · ExtraBold", size: 22, weight: 800, label: "22px / 800" },
      { sample: "H6 · Bold", size: 20, weight: 700, label: "20px / 700" },
    ],
  },
  {
    title: "Title",
    rows: [
      { sample: "Title 18 · SemiBold", size: 18, weight: 600, label: "18px / 600" },
      { sample: "Title 16 · Regular", size: 16, weight: 400, label: "16px / 400" },
      { sample: "Title 14 · SemiBold", size: 14, weight: 600, label: "14px / 600" },
      { sample: "Title 12 · Bold", size: 12, weight: 700, label: "12px / 700" },
      { sample: "Title 10 · SemiBold", size: 10, weight: 600, label: "10px / 600" },
    ],
  },
  {
    title: "Button",
    rows: [
      { sample: "Button 14 · SemiBold", size: 14, weight: 600, label: "14px / 600" },
      { sample: "Button 12 · Medium", size: 12, weight: 500, label: "12px / 500" },
      { sample: "Button 10 · SemiBold", size: 10, weight: 600, label: "10px / 600" },
    ],
  },
  {
    title: "Body",
    rows: [
      { sample: "Body 16 · Regular — tez qoramtir tulki", size: 16, weight: 400, label: "16px / 400" },
      { sample: "Body 14 · Regular — tez qoramtir tulki", size: 14, weight: 400, label: "14px / 400" },
      { sample: "Body 12 · Regular — tez qoramtir tulki", size: 12, weight: 400, label: "12px / 400" },
      { sample: "Body 10 · Regular — tez qoramtir tulki", size: 10, weight: 400, label: "10px / 400" },
    ],
  },
];

export function TypographyPage() {
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shrift oilasi</h2>
        <p className={styles.sectionDesc}>
          <code>--font-family-base</code> — <strong>Urbanist</strong> (mahalliy woff2, weight 400/500/600/700/800).
          Barcha darajalar quyida haqiqiy o'lchamda ko'rsatilgan.
        </p>
      </section>

      {SCALES.map((scale) => (
        <section key={scale.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{scale.title}</h2>
          <div>
            {scale.rows.map((row) => {
              const sampleStyle: CSSProperties = {
                fontSize: row.size,
                fontWeight: row.weight,
                fontFamily: "var(--font-family-base)",
              };
              return (
                <div key={row.sample} className={styles.typeRow}>
                  <span className={styles.typeSample} style={sampleStyle}>
                    {row.sample}
                  </span>
                  <span className={styles.typeSpec}>{row.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
