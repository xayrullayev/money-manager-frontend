import type { CSSProperties } from "react";
import { Sort } from "../sguiIcons";
import { CategoryIcon } from "../../../shared/ui";
import styles from "../StyleGuide.module.css";

/* ---------- Chart ---------- */
type Bar = { from: number; to: number; color: string; label?: string; highlight?: boolean };
const BARS: Bar[] = [
  { from: 20, to: 55, color: "var(--color-primary-500)" },
  { from: 15, to: 78, color: "var(--color-accent-light)" },
  { from: 40, to: 62, color: "var(--color-accent-light)" },
  { from: 18, to: 70, color: "var(--color-accent-light)", label: "110%", highlight: true },
  { from: 30, to: 82, color: "var(--color-primary-500)" },
  { from: 25, to: 80, color: "var(--color-accent-light)" },
];

function BarChart() {
  const H = 220;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: H, color: "var(--color-text-muted)", fontSize: 11 }}>
        {["8K", "6K", "4K", "2K", "0"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div style={{ position: "relative", flex: 1, height: H, borderLeft: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "0 8px" }}>
        {[0, 25, 50, 75, 100].map((g) => (
          <span key={g} style={{ position: "absolute", left: 0, right: 0, bottom: `${g}%`, borderTop: "1px dashed var(--color-border)", opacity: 0.5 }} />
        ))}
        {BARS.map((b, i) => (
          <div key={i} style={{ position: "relative", width: 26, height: "100%" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: `${b.from}%`,
                height: `${b.to - b.from}%`,
                background: b.highlight ? "var(--color-primary-50)" : b.color,
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
              }}
            >
              {b.highlight && <span style={{ position: "absolute", top: -20, fontSize: 11, fontWeight: 700 }}>{b.label}</span>}
              {b.highlight && <div style={{ position: "absolute", inset: 4, background: "var(--color-accent-light)", borderRadius: 6 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spark({ color, up }: { color: string; up: boolean }) {
  const d = up ? "M0 40 C 20 20, 40 30, 60 15 S 100 5, 120 12 L120 60 L0 60 Z" : "M0 20 C 20 30, 40 15, 60 35 S 100 45, 120 40 L120 60 L0 60 Z";
  const line = up ? "M0 40 C 20 20, 40 30, 60 15 S 100 5, 120 12" : "M0 20 C 20 30, 40 15, 60 35 S 100 45, 120 40";
  const id = up ? "spDark" : "spRed";
  return (
    <svg width="130" height="64" viewBox="0 0 120 60" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChartSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Chart</h2>
      <div className={styles.demoGrid}>
        <div style={cardBox}>
          <BarChart />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, color: "var(--color-text-muted)", fontSize: 11, paddingLeft: 28 }}>
            {BARS.map((_, i) => (
              <span key={i}>Jan</span>
            ))}
          </div>
        </div>
        <div style={cardBox}>
          <span className={styles.demoLabel}>Area / sparkline</span>
          <div className={styles.demoRow} style={{ marginTop: 8 }}>
            <Spark color="var(--color-primary-500)" up />
            <Spark color="var(--color-danger)" up={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Calendar ---------- */
function DayChip({ n, tone }: { n: number; tone: "default" | "muted" | "danger" | "success" }) {
  const map = {
    default: { bg: "transparent", fg: "var(--color-text)" },
    muted: { bg: "transparent", fg: "var(--color-text-muted)" },
    danger: { bg: "var(--color-danger-bg)", fg: "var(--color-danger)" },
    success: { bg: "var(--color-accent-light)", fg: "var(--color-primary-700)" },
  } as const;
  const s = map[tone];
  return (
    <span style={{ width: 34, height: 34, borderRadius: "50%", background: s.bg, color: s.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "var(--font-size-sm)" }}>
      {n}
    </span>
  );
}

function CalendarSection() {
  const hours = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"];
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Calendar</h2>
      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Kun holatlari</span>
        <div className={styles.demoRow}>
          <DayChip n={30} tone="default" />
          <DayChip n={30} tone="muted" />
          <DayChip n={30} tone="danger" />
          <DayChip n={30} tone="success" />
        </div>
      </div>
      <div style={{ ...cardBox, maxWidth: 420 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr" }}>
          <div style={{ color: "var(--color-text-muted)", fontSize: 12, padding: "8px 0" }}>UTC +1</div>
          <div style={{ background: "var(--color-danger-bg)", borderRadius: "var(--radius-md)", padding: "8px 0", textAlign: "center" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>Monday</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>18</div>
          </div>
          {hours.map((h) => (
            <div key={h} style={{ display: "contents" }}>
              <div style={{ color: "var(--color-text-muted)", fontSize: 12, padding: "16px 0", borderTop: "1px solid var(--color-border)" }}>{h}</div>
              <div style={{ borderTop: "1px solid var(--color-border)" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Table ---------- */
function Th({ children }: { children: string }) {
  return (
    <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", fontWeight: 600, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {children} <Sort size={14} />
      </span>
    </th>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{ padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "var(--color-primary-500)", color: "#fff", fontSize: "var(--font-size-xs)", fontWeight: 700 }}>{label}</span>
  );
}

function TableSection() {
  const rows = [
    { name: "Comcast Bill Payment", cat: "Food & Dining", icon: "housing", color: "orange", id: "4567890123", date: "2024-09-24", time: "14:30", amount: "-$350.00", note: "Monthly entertainment subscription" },
    { name: "Online Subscription", cat: "Health & Fitness", icon: "health", color: "red", id: "4567890124", date: "2024-09-24", time: "14:30", amount: "-$120.75", note: "Fitness app renewal" },
    { name: "Salary", cat: "Income", icon: "salary", color: "green", id: "4567890125", date: "2024-09-25", time: "09:00", amount: "+$4,800.00", note: "Monthly salary" },
  ];
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Table</h2>
      <div style={{ ...cardBox, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th style={{ padding: "12px 16px", width: 36 }}>
                <input type="checkbox" aria-label="Barchasi" />
              </th>
              <Th>Transaction Name</Th>
              <Th>Transaction ID</Th>
              <Th>Date &amp; Time</Th>
              <Th>Amount</Th>
              <Th>Note</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "14px 16px" }}>
                  <input type="checkbox" aria-label={r.name} />
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <CategoryIcon iconKey={r.icon} colorToken={r.color} size="sm" />
                    <span>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>{r.cat}</div>
                    </span>
                  </span>
                </td>
                <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>{r.id}</td>
                <td style={{ padding: "14px 16px" }}>
                  <div>{r.date}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>{r.time}</div>
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 700, color: r.amount.startsWith("+") ? "var(--color-income)" : "var(--color-expense)" }}>{r.amount}</td>
                <td style={{ padding: "14px 16px", color: "var(--color-text-muted)", maxWidth: 200 }}>{r.note}</td>
                <td style={{ padding: "14px 16px" }}>
                  <Badge label="Completed" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.sectionDesc}>&lt;768px da jadval stacked karta ko'rinishiga o'tadi (Design-Migrate-06).</p>
    </section>
  );
}

const cardBox: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5)",
};

export function DataSection() {
  return (
    <>
      <ChartSection />
      <CalendarSection />
      <TableSection />
    </>
  );
}
