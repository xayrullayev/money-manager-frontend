import styles from "./StyleGuide.module.css";

/**
 * Color — tokens.css dagi rang palitrasi (Design-Migrate-01).
 * Har swatch fonini jonli CSS o'zgaruvchisi bilan bo'yaydi; yonida token nomi + hex.
 * Eslatma: `docs/design-images/Style & Component/Color.png` community shablonining
 * eski KO'K swatchini ko'rsatadi; tasdiqlangan brand palitra — YASHIL (ekranlar + Figma).
 */
type Swatch = { name: string; varName: string; hex: string; onDark?: boolean };
type Group = { title: string; desc?: string; items: Swatch[] };

const GROUPS: Group[] = [
  {
    title: "Brand — Green",
    desc: "Asosiy brand rang. Green-Dark (accent) CTA, sarlavha va grafik urg'ular uchun.",
    items: [
      { name: "Primary 50 / Green-BG", varName: "--color-primary-50", hex: "#ECF4E9" },
      { name: "Primary 100", varName: "--color-primary-100", hex: "#CBE2D8" },
      { name: "Primary 300", varName: "--color-primary-300", hex: "#5B8378" },
      { name: "Primary 500 / Green-Dark", varName: "--color-primary-500", hex: "#1E4841", onDark: true },
      { name: "Primary 600", varName: "--color-primary-600", hex: "#173A34", onDark: true },
      { name: "Primary 700", varName: "--color-primary-700", hex: "#102923", onDark: true },
      { name: "Accent Light / Green-Light", varName: "--color-accent-light", hex: "#BBF49C" },
    ],
  },
  {
    title: "Neutral",
    desc: "Fon, surface, chegara va matn ranglari.",
    items: [
      { name: "Background", varName: "--color-bg", hex: "#FBFBFC" },
      { name: "Background Subtle", varName: "--color-bg-subtle", hex: "#F6F8F7" },
      { name: "Surface", varName: "--color-surface", hex: "#FBFBFC" },
      { name: "Border", varName: "--color-border", hex: "#BCBEBD" },
      { name: "Border Strong", varName: "--color-border-strong", hex: "#9FA3A1" },
      { name: "Text / Ink", varName: "--color-text", hex: "#242E2C", onDark: true },
      { name: "Text Muted", varName: "--color-text-muted", hex: "#6B7271", onDark: true },
      { name: "Text Inverse", varName: "--color-text-inverse", hex: "#FFFFFF" },
    ],
  },
  {
    title: "Semantik",
    desc: "Holat va moliyaviy semantika: kirim (income) va chiqim (expense).",
    items: [
      { name: "Success", varName: "--color-success", hex: "#1E4841", onDark: true },
      { name: "Success BG", varName: "--color-success-bg", hex: "#ECF4E9" },
      { name: "Danger / Expense", varName: "--color-danger", hex: "#A43D32", onDark: true },
      { name: "Danger BG", varName: "--color-danger-bg", hex: "#F7E9E7" },
      { name: "Warning", varName: "--color-warning", hex: "#B9762A", onDark: true },
      { name: "Warning BG", varName: "--color-warning-bg", hex: "#FAF1E6" },
      { name: "Income", varName: "--color-income", hex: "#1E4841", onDark: true },
      { name: "Expense", varName: "--color-expense", hex: "#A43D32", onDark: true },
    ],
  },
];

const CATEGORY_COLORS: { token: string; hex: string }[] = [
  { token: "green", hex: "#2E7D4F" },
  { token: "teal", hex: "#1B7F80" },
  { token: "blue", hex: "#2D65A8" },
  { token: "purple", hex: "#7250A8" },
  { token: "pink", hex: "#B3486F" },
  { token: "orange", hex: "#C0621F" },
  { token: "yellow", hex: "#A07A12" },
  { token: "red", hex: "#B23C32" },
  { token: "gray", hex: "#6B7370" },
  { token: "brown", hex: "#85563A" },
];

function SwatchCard({ item }: { item: Swatch }) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchBox} style={{ background: `var(${item.varName})` }} />
      <div className={styles.swatchMeta}>
        <span className={styles.swatchName}>{item.name}</span>
        <span className={styles.swatchVar}>{item.varName}</span>
        <span className={styles.swatchHex}>{item.hex}</span>
      </div>
    </div>
  );
}

export function ColorPage() {
  return (
    <>
      <p className={styles.note}>
        Palitra <strong>yashil</strong> (Green-Dark #1E4841) — ekranlar va Figma bilan tasdiqlangan.
        Papkadagi <code>Color.png</code> eski community shablonining ko'k swatchi bo'lib, u eskirgan.
      </p>

      {GROUPS.map((group) => (
        <section key={group.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{group.title}</h2>
          {group.desc && <p className={styles.sectionDesc}>{group.desc}</p>}
          <div className={styles.swatchGrid}>
            {group.items.map((item) => (
              <SwatchCard key={item.varName} item={item} />
            ))}
          </div>
        </section>
      ))}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Kategoriya ranglari</h2>
        <p className={styles.sectionDesc}>
          Operatsiya kategoriyalari uchun 10 ta rang (backend allowlist bilan 1:1). Har biri oq fonda ≥3:1.
        </p>
        <div className={styles.swatchGrid}>
          {CATEGORY_COLORS.map((c) => (
            <SwatchCard
              key={c.token}
              item={{ name: `Category ${c.token}`, varName: `--category-${c.token}`, hex: c.hex, onDark: true }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
