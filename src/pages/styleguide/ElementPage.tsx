import type { CSSProperties, ComponentType, SVGProps } from "react";
import styles from "./StyleGuide.module.css";
import { CategoryIcon } from "../../shared/ui";
import { CATEGORY_ICON_KEYS, CATEGORY_COLOR_TOKENS } from "../../shared/lib/categoryTokens";
import {
  DashboardIcon,
  TransactionsIcon,
  AccountsIcon,
  BudgetsIcon,
  ReportsIcon,
  SettingsIcon,
  SignOutIcon,
  MenuIcon,
  CloseIcon,
} from "../../app/navIcons";

type IconEntry = { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> };

const NAV_ICONS: IconEntry[] = [
  { label: "Dashboard", Icon: DashboardIcon },
  { label: "Transactions", Icon: TransactionsIcon },
  { label: "Accounts", Icon: AccountsIcon },
  { label: "Budgets", Icon: BudgetsIcon },
  { label: "Reports", Icon: ReportsIcon },
  { label: "Settings", Icon: SettingsIcon },
  { label: "Sign out", Icon: SignOutIcon },
  { label: "Menu", Icon: MenuIcon },
  { label: "Close", Icon: CloseIcon },
];

const SPACING: { name: string; value: number }[] = [
  { name: "--space-1", value: 4 },
  { name: "--space-2", value: 8 },
  { name: "--space-3", value: 12 },
  { name: "--space-4", value: 16 },
  { name: "--space-5", value: 20 },
  { name: "--space-6", value: 24 },
  { name: "--space-8", value: 32 },
  { name: "--space-10", value: 40 },
  { name: "--space-12", value: 48 },
];

const RADIUS: { name: string; varName: string }[] = [
  { name: "sm — 8px", varName: "--radius-sm" },
  { name: "md — 12px", varName: "--radius-md" },
  { name: "lg — 16px", varName: "--radius-lg" },
  { name: "pill — 999px", varName: "--radius-pill" },
];

const SHADOW: { name: string; varName: string }[] = [
  { name: "shadow-sm", varName: "--shadow-sm" },
  { name: "shadow-md", varName: "--shadow-md" },
];

function Avatar({ initials, size }: { initials: string; size: number }) {
  const style: CSSProperties = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  return (
    <span className={styles.avatar} style={style} aria-hidden="true">
      {initials}
    </span>
  );
}

export function ElementPage() {
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Logo</h2>
        <div className={styles.demoRow}>
          <span style={{ fontSize: 24, fontWeight: 800, color: "var(--color-primary-500)", letterSpacing: "-0.02em" }}>
            JD Funnel
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "var(--color-text-inverse)",
              background: "var(--color-primary-500)",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
            }}
          >
            JD Funnel
          </span>
        </div>
        <p className={styles.sectionDesc}>Rasmiy logo SVG'si qo'shilgach almashtiriladi (Design-Migrate-04).</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ikonkalar — navigatsiya</h2>
        <p className={styles.sectionDesc}>20px line-icon, <code>stroke: currentColor</code> — rang meros orqali.</p>
        <div className={styles.iconGrid}>
          {NAV_ICONS.map(({ label, Icon }) => (
            <div key={label} className={styles.iconCell}>
              <Icon width={24} height={24} />
              <span className={styles.iconLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Ikonkalar — kategoriya</h2>
        <p className={styles.sectionDesc}>Rangli fon + glyph (CategoryIcon). Har biri backend allowlist bilan mos.</p>
        <div className={styles.iconGrid}>
          {CATEGORY_ICON_KEYS.map((iconKey, i) => (
            <div key={iconKey} className={styles.iconCell}>
              <CategoryIcon iconKey={iconKey} colorToken={CATEGORY_COLOR_TOKENS[i % CATEGORY_COLOR_TOKENS.length]} />
              <span className={styles.iconLabel}>{iconKey}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Avatarlar</h2>
        <div className={styles.avatarRow}>
          <Avatar initials="AB" size={28} />
          <Avatar initials="AB" size={36} />
          <Avatar initials="AB" size={44} />
          <Avatar initials="AB" size={56} />
          <span className={styles.avatarGroup}>
            <Avatar initials="AB" size={36} />
            <Avatar initials="CD" size={36} />
            <Avatar initials="EF" size={36} />
            <Avatar initials="+5" size={36} />
          </span>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing — 4px grid</h2>
        <div className={styles.stackList}>
          {SPACING.map((s) => (
            <div key={s.name} className={styles.spacingRow}>
              <span className={styles.spacingLabel}>
                {s.name} · {s.value}px
              </span>
              <span className={styles.spacingBar} style={{ width: `var(${s.name})` }} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Radius</h2>
        <div className={styles.tokenRowGrid}>
          {RADIUS.map((r) => (
            <div key={r.varName} className={styles.tokenTile}>
              <span className={styles.radiusBox} style={{ borderRadius: `var(${r.varName})` }} />
              <span className={styles.tokenName}>{r.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Soya (shadow)</h2>
        <div className={styles.tokenRowGrid}>
          {SHADOW.map((s) => (
            <div key={s.varName} className={styles.tokenTile}>
              <span className={styles.shadowBox} style={{ boxShadow: `var(${s.varName})` }} />
              <span className={styles.tokenName}>{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Focus ring</h2>
        <p className={styles.sectionDesc}>
          Tab bilan o'ting — ikki qavatli halqa (<code>--focus-ring</code>, WCAG 2.2 ≥3:1).
        </p>
        <div className={styles.demoRow}>
          <button
            type="button"
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontWeight: 600,
            }}
          >
            Fokuslash uchun bosing / Tab
          </button>
        </div>
      </section>
    </>
  );
}
