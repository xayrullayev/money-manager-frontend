import type { CSSProperties, ReactNode } from "react";
import {
  DashboardIcon,
  AccountsIcon,
  TransactionsIcon,
  ReportsIcon,
  BudgetsIcon,
  SignOutIcon,
} from "../../../app/navIcons";
import { Bell, Search, Home, Kebab, Receipt, Coins } from "../sguiIcons";
import styles from "../StyleGuide.module.css";

const cardBox: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5)",
};

function Avatar({ initials, size = 36, tone = "green" }: { initials: string; size?: number; tone?: "green" | "light" }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone === "green" ? "var(--color-accent-light)" : "var(--color-primary-50)",
        color: "var(--color-primary-700)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

function TrendBadge({ text, up = true }: { text: string; up?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--color-primary-50)", color: "var(--color-primary-600)", fontSize: "var(--font-size-xs)", fontWeight: 700 }}>
      {up ? "↗" : "↘"} {text}
    </span>
  );
}

/* ---------- Card ---------- */
function CardSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Card</h2>
      <div className={styles.demoGrid}>
        {/* Stat — green bg */}
        <div style={{ background: "var(--color-primary-50)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>Total Savings</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 700 }}>$138,500</span>
              <TrendBadge text="8.20 %" />
            </div>
          </div>
          <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-surface)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Receipt size={20} />
          </span>
        </div>

        {/* Stat — white bordered */}
        <div style={cardBox}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
              <Coins size={18} /> Investment
            </span>
            <TrendBadge text="1.78 %" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>$78,000</div>
          <div style={{ color: "var(--color-income)", fontSize: "var(--font-size-xs)", marginTop: 2 }}>+$1.78 than last week</div>
        </div>

        {/* Bank card */}
        <div style={{ background: "var(--color-primary-500)", color: "#fff", borderRadius: "var(--radius-lg)", padding: "var(--space-5)", minHeight: 170, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: "var(--font-size-sm)", opacity: 0.9, maxWidth: 140 }}>Freedom Unlimited Mastercard</div>
            <span style={{ position: "relative", width: 40, height: 24 }}>
              <span style={{ position: "absolute", left: 0, width: 24, height: 24, borderRadius: "50%", background: "var(--color-accent-light)", opacity: 0.9 }} />
              <span style={{ position: "absolute", right: 0, width: 24, height: 24, borderRadius: "50%", background: "#fff", opacity: 0.55 }} />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>$532,000</span>
            <span style={{ opacity: 0.85, fontSize: "var(--font-size-sm)" }}>Debit</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", opacity: 0.85 }}>
            <span>
              <div style={{ opacity: 0.7 }}>Card Number</div>**** **** **** 3321
            </span>
            <span>
              <div style={{ opacity: 0.7 }}>EXP</div>05/25
            </span>
            <span>
              <div style={{ opacity: 0.7 }}>CVV</div>672
            </span>
          </div>
        </div>

        {/* Goal / progress */}
        <div style={cardBox}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "var(--color-primary-50)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary-600)" }}>
                <Home size={18} />
              </span>
              <strong>Get New Car</strong>
            </span>
            <button type="button" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-muted)" }} aria-label="Amallar">
              <Kebab size={18} />
            </button>
          </div>
          <div style={{ height: 8, borderRadius: "var(--radius-pill)", background: "var(--color-accent-light)", marginTop: 14, overflow: "hidden" }}>
            <div style={{ width: "25%", height: "100%", background: "var(--color-primary-500)", borderRadius: "var(--radius-pill)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "var(--font-size-sm)" }}>
            <span>$20,000.00 · 25%</span>
            <span style={{ color: "var(--color-text-muted)" }}>Target: $80,000.00</span>
          </div>
        </div>

        {/* Article */}
        <div style={{ ...cardBox, gridColumn: "span 2" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 120, height: 90, borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", flexShrink: 0 }} />
            <div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-xs)" }}>Investment Strategies · Sep 25, 2028</div>
              <div style={{ fontWeight: 700, fontSize: "var(--font-size-lg)", margin: "4px 0" }}>The Future of Cryptocurrency Investments</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>An in-depth look at the emerging trends and potential pitfalls in the market.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <Avatar initials="VR" size={28} /> <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Valentine Roze</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Item ---------- */
function ItemSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Item</h2>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Page header</span>
        <div style={{ ...cardBox, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <strong style={{ fontSize: "var(--font-size-lg)" }}>Dashboard</strong>
          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 40, borderRadius: "var(--radius-pill)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}>
              <span style={{ fontSize: "var(--font-size-sm)" }}>Search placeholder</span> <Search size={16} />
            </span>
            <span style={{ position: "relative" }}>
              <Bell size={22} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--color-danger)" }} />
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Khalil Bhatti</span>
              <Avatar initials="KB" size={36} />
            </span>
          </span>
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Chat</span>
        <div style={{ ...cardBox, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textAlign: "right", marginBottom: 4 }}>Name · 9:46 PM ✓✓</div>
            <div style={{ background: "var(--color-accent-light)", color: "var(--color-primary-700)", padding: "10px 14px", borderRadius: "16px 16px 4px 16px" }}>Can I request a late check-out for Room 305?</div>
          </div>
          <div style={{ alignSelf: "flex-start", maxWidth: "70%", display: "flex", gap: 8 }}>
            <Avatar initials="HM" size={28} />
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>Name · 9:46 PM</div>
              <div style={{ background: "var(--color-danger-bg)", color: "var(--color-text)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px" }}>Can I request a late check-out for Room 305?</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Message list</span>
        <div style={cardBox}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i === 1 ? "1px solid var(--color-border)" : "none" }}>
              <Avatar initials="HM" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: "var(--font-size-sm)" }}>Helen Martinez</strong>
                  <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", background: "var(--color-primary-50)", color: "var(--color-primary-600)", fontSize: 11, fontWeight: 700 }}>Trainer</span>
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Just confirming my booking for the Mazda 3 next…</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>09:15 AM</div>
                <span style={{ display: "inline-flex", minWidth: 18, height: 18, padding: "0 5px", borderRadius: "var(--radius-pill)", background: "var(--color-danger)", color: "#fff", fontSize: 11, fontWeight: 700, alignItems: "center", justifyContent: "center", marginTop: 4 }}>5</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Notification</span>
        <div style={cardBox}>
          <div style={{ display: "flex", gap: 12 }}>
            <Avatar initials="🏃" size={32} />
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>10:30 AM</div>
              <div style={{ fontSize: "var(--font-size-sm)" }}>
                <strong>Cardio progress updated</strong> – 7.5 km completed out of 10 km goal for endurance improvement
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Footer</span>
        <div style={{ ...cardBox, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: "var(--font-size-sm)" }}>
            <span style={{ fontWeight: 600 }}>Copyright © 2025 Khalil</span>
            <span style={{ color: "var(--color-text-muted)" }}>Privacy Policy</span>
            <span style={{ color: "var(--color-text-muted)" }}>Term and conditions</span>
            <span style={{ color: "var(--color-text-muted)" }}>Contact</span>
          </div>
          <div style={{ display: "flex", gap: 10, color: "var(--color-text-muted)" }}>
            {["f", "X", "◎", "▶", "in"].map((s) => (
              <span key={s} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--color-border)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Nav ---------- */
type NavRow = { label: string; icon: ReactNode; badge?: string };
function Envelope() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function Percent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M19 5 5 19" />
      <circle cx="7.5" cy="7.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}
function Diamond() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3 21 9l-9 12L3 9z" />
    </svg>
  );
}

const NAV: NavRow[] = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  { label: "Payments", icon: <AccountsIcon /> },
  { label: "Transactions", icon: <TransactionsIcon /> },
  { label: "Invoices", icon: <Receipt size={20} /> },
  { label: "Cards", icon: <AccountsIcon /> },
  { label: "Saving Plans", icon: <BudgetsIcon /> },
  { label: "Investments", icon: <Diamond /> },
  { label: "Inbox", icon: <Envelope />, badge: "99" },
  { label: "Promos", icon: <Percent /> },
  { label: "Insights", icon: <ReportsIcon /> },
  { label: "Sign out", icon: <SignOutIcon /> },
];

function NavSection() {
  const rowBase: CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: "var(--font-size-sm)" };
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Nav</h2>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Expanded */}
        <div style={{ background: "var(--color-primary-50)", borderRadius: "var(--radius-lg)", padding: 12, width: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontWeight: 800, color: "var(--color-primary-600)" }}>JD Funnel</div>
          {NAV.map((n, i) => (
            <div key={n.label} style={{ ...rowBase, color: i === 0 ? "var(--color-primary-600)" : "var(--color-text)", background: i === 0 ? "var(--color-surface)" : "transparent", fontWeight: i === 0 ? 700 : 500 }}>
              <span style={{ color: "var(--color-primary-600)", display: "inline-flex" }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: "var(--radius-pill)", background: "var(--color-danger)", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n.badge}</span>}
            </div>
          ))}
        </div>

        {/* Collapsed rail */}
        <div style={{ background: "var(--color-primary-50)", borderRadius: "var(--radius-lg)", padding: 12, width: 64, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <div style={{ padding: "8px 0", color: "var(--color-primary-600)" }}>
            <Diamond />
          </div>
          {NAV.map((n, i) => (
            <span key={n.label} style={{ position: "relative", width: 40, height: 40, borderRadius: "var(--radius-md)", background: i === 0 ? "var(--color-surface)" : "transparent", color: "var(--color-primary-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {n.icon}
              {n.badge && <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-danger)" }} />}
            </span>
          ))}
        </div>

        {/* Top header */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-primary-50)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
            <span style={{ fontWeight: 800, color: "var(--color-primary-600)" }}>JD Funnel</span>
            <strong style={{ color: "var(--color-primary-700)" }}>Dashboard</strong>
            <span style={{ position: "relative" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--color-danger)" }} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SurfacesSection() {
  return (
    <>
      <CardSection />
      <ItemSection />
      <NavSection />
    </>
  );
}
