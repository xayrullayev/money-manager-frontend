import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Button } from "../../../shared/ui";
import { Chevron, Chat, Coins, ChevronLeft, ChevronRight } from "../sguiIcons";
import styles from "../StyleGuide.module.css";

/* ---------- Badges ---------- */
type Tone = "solid" | "tonal" | "text";
function StatusBadge({ label, color, tone }: { label: string; color: "success" | "warning" | "danger" | "neutral"; tone: Tone }) {
  const fg = `var(--color-${color === "neutral" ? "text-muted" : color})`;
  const bg = color === "neutral" ? "var(--color-bg-subtle)" : `var(--color-${color}-bg)`;
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "var(--radius-pill)",
    fontSize: "var(--font-size-xs)",
    fontWeight: 700,
    lineHeight: 1.4,
  };
  if (tone === "text") return <span style={{ ...base, padding: "4px 0", color: fg }}>{label}</span>;
  if (tone === "solid")
    return (
      <span style={{ ...base, background: color === "success" ? "var(--color-primary-500)" : bg, color: color === "success" ? "#fff" : fg }}>
        {label}
      </span>
    );
  return <span style={{ ...base, background: bg, color: fg }}>{label}</span>;
}

function BadgesSection() {
  const redDot = (size: number): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: "50%",
    background: "var(--color-danger)",
    display: "inline-block",
  });
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Badges</h2>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Notification</span>
        <div className={styles.demoRow}>
          <span
            style={{
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: "var(--radius-pill)",
              background: "var(--color-danger)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            99
          </span>
          <span style={redDot(10)} />
          <span style={redDot(8)} />
          <span style={redDot(6)} />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Status — text / tonal / solid</span>
        <div className={styles.demoRow}>
          <StatusBadge label="Completed" color="success" tone="text" />
          <StatusBadge label="Pending" color="warning" tone="text" />
          <StatusBadge label="Failed" color="danger" tone="text" />
        </div>
        <div className={styles.demoRow}>
          <StatusBadge label="Completed" color="success" tone="tonal" />
          <StatusBadge label="Pending" color="warning" tone="tonal" />
          <StatusBadge label="Failed" color="danger" tone="tonal" />
        </div>
        <div className={styles.demoRow}>
          <StatusBadge label="Completed" color="success" tone="solid" />
          <StatusBadge label="Pending" color="success" tone="tonal" />
          <StatusBadge label="Failed" color="danger" tone="tonal" />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Invoice</span>
        <div className={styles.demoRow}>
          <StatusBadge label="Paid" color="success" tone="solid" />
          <StatusBadge label="Pending" color="success" tone="tonal" />
          <StatusBadge label="Overdue" color="danger" tone="tonal" />
          <StatusBadge label="Unpaid" color="neutral" tone="tonal" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Breadcrumb ---------- */
function Crumb({ items }: { items: string[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-size-sm)" }} aria-label="breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={it + i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: last ? "var(--color-text)" : "var(--color-text-muted)", fontWeight: last ? 700 : 500 }}>{it}</span>
            {!last && <span style={{ color: "var(--color-text-muted)" }}>/</span>}
          </span>
        );
      })}
    </nav>
  );
}

function BreadcrumbSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Breadcrumb</h2>
      <div className={styles.demoStack}>
        <Crumb items={["Link", "Page"]} />
        <Crumb items={["Link", "Link", "Page"]} />
      </div>
    </section>
  );
}

/* ---------- Button ---------- */
function IconButton({ children, variant = "solid", dot }: { children: ReactNode; variant?: "solid" | "tonal" | "ghost"; dot?: boolean }) {
  const map = {
    solid: { background: "var(--color-primary-500)", color: "#fff" },
    tonal: { background: "var(--color-primary-50)", color: "var(--color-primary-500)" },
    ghost: { background: "transparent", color: "var(--color-primary-500)" },
  } as const;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          border: variant === "ghost" ? "1px solid var(--color-border)" : "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          ...map[variant],
        }}
      >
        {children}
      </button>
      {dot && (
        <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "var(--color-danger)", border: "2px solid var(--color-surface)" }} />
      )}
    </span>
  );
}

function Segmented({ items }: { items: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display: "inline-flex", background: "var(--color-primary-50)", borderRadius: "var(--radius-md)", padding: 4, gap: 4 }}>
      {items.map((it, i) => (
        <button
          key={it}
          type="button"
          onClick={() => setActive(i)}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            background: i === active ? "var(--color-primary-500)" : "transparent",
            color: i === active ? "#fff" : "var(--color-text)",
          }}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

function ButtonSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Button</h2>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Variantlar</span>
        <div className={styles.demoRow}>
          <Button variant="primary">Button</Button>
          <Button variant="secondary">Button</Button>
          <Button variant="ghost">Button</Button>
          <Button variant="danger">Button</Button>
        </div>
        <div className={styles.demoRow}>
          <Button variant="primary">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              Button <Chevron size={16} />
            </span>
          </Button>
          <Button variant="primary">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Coins size={16} /> Button
            </span>
          </Button>
          <Button variant="secondary">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Coins size={16} /> Button <Chevron size={16} />
            </span>
          </Button>
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Icon button</span>
        <div className={styles.demoRow}>
          <IconButton variant="solid" dot>
            <Chat size={18} />
          </IconButton>
          <IconButton variant="tonal" dot>
            <Chat size={18} />
          </IconButton>
          <IconButton variant="ghost" dot>
            <Chat size={18} />
          </IconButton>
          <IconButton variant="solid">
            <Chat size={18} />
          </IconButton>
          <IconButton variant="tonal">
            <Chat size={18} />
          </IconButton>
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Segmented</span>
        <div className={styles.demoRow}>
          <Segmented items={["Button 1", "Button 2"]} />
        </div>
        <div className={styles.demoRow}>
          <Segmented items={["Button 1", "Button 2", "Button 3"]} />
        </div>
        <div className={styles.demoRow}>
          <Segmented items={["Button 1", "Button 2", "Button 3", "Button 4"]} />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Top Up (vertical)</span>
        <div className={styles.demoRow}>
          <button
            type="button"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
            }}
          >
            <Coins size={20} /> Top Up
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pagination ---------- */
function Pagination({ pages, current, size = "md" }: { pages: (number | "…")[]; current: number; size?: "sm" | "md" }) {
  const dim = size === "md" ? 44 : 36;
  const cell = (content: ReactNode, active = false, disabled = false, key?: string): ReactNode => (
    <button
      key={key ?? String(content)}
      type="button"
      disabled={disabled}
      style={{
        minWidth: dim,
        height: dim,
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontWeight: 700,
        fontSize: "var(--font-size-sm)",
        background: active ? "var(--color-primary-500)" : disabled ? "var(--color-bg-subtle)" : "var(--color-primary-50)",
        color: active ? "#fff" : disabled ? "var(--color-text-muted)" : "var(--color-text)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {content}
    </button>
  );
  return (
    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      {cell(<ChevronLeft size={16} />, false, current === 1, "prev")}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ minWidth: dim, textAlign: "center", color: "var(--color-text-muted)" }}>
            …
          </span>
        ) : (
          cell(p, p === current, false, `p${p}`)
        ),
      )}
      {cell(<ChevronRight size={16} />, false, false, "next")}
    </div>
  );
}

function PaginationSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Pagination</h2>
      <div className={styles.demoStack}>
        <Pagination pages={[1, 2, 3, "…", 16]} current={1} size="sm" />
        <Pagination pages={[1, 2, 3, "…", 15, 16]} current={1} size="md" />
      </div>
    </section>
  );
}

export function AtomsSection() {
  return (
    <>
      <BadgesSection />
      <BreadcrumbSection />
      <ButtonSection />
      <PaginationSection />
    </>
  );
}
