import { useState } from "react";
import type { CSSProperties } from "react";
import { Search, Smiley, Attach } from "../sguiIcons";
import styles from "../StyleGuide.module.css";

function SearchInput({ variant }: { variant: "subtle" | "bordered" }) {
  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    height: "var(--control-height)",
    borderRadius: "var(--radius-pill)",
    background: variant === "subtle" ? "var(--color-bg-subtle)" : "var(--color-surface)",
    border: variant === "bordered" ? "1px solid var(--color-border)" : "1px solid transparent",
    color: "var(--color-text-muted)",
    flex: 1,
  };
  return (
    <div style={style}>
      <input
        placeholder="Search placeholder"
        style={{ border: "none", background: "transparent", outline: "none", flex: 1, color: "var(--color-text)", fontSize: "var(--font-size-sm)" }}
      />
      <Search size={18} />
    </div>
  );
}

function TextField({ tone = "bordered", label }: { tone?: "bordered" | "subtle"; label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{label}</span>}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          height: "var(--control-height)",
          borderRadius: "var(--radius-md)",
          background: tone === "subtle" ? "var(--color-bg-subtle)" : "var(--color-surface)",
          border: tone === "bordered" ? "1px solid var(--color-border)" : "1px solid transparent",
          color: "var(--color-text-muted)",
        }}
      >
        <Smiley size={18} />
        <span style={{ flex: 1, color: "var(--color-text-muted)" }}>Placeholder</span>
        <Attach size={18} />
      </div>
    </div>
  );
}

type CheckState = "off" | "on" | "indeterminate";
function Checkbox({ state, tint }: { state: CheckState; tint: "green" | "soft" | "white" }) {
  const bg = state === "off" ? (tint === "soft" ? "var(--color-danger-bg)" : "var(--color-surface)") : tint === "green" ? "var(--color-accent-light)" : "var(--color-primary-50)";
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        border: state === "off" ? "1.5px solid var(--color-border)" : "1.5px solid transparent",
        background: state === "off" ? "var(--color-surface)" : bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text)",
      }}
    >
      {state === "on" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {state === "indeterminate" && <span style={{ width: 12, height: 2.5, background: "var(--color-text)", borderRadius: 2 }} />}
    </span>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      style={{
        width: 44,
        height: 26,
        borderRadius: "var(--radius-pill)",
        background: on ? "var(--color-accent-light)" : "var(--color-border)",
        display: "inline-flex",
        alignItems: "center",
        padding: 3,
        justifyContent: on ? "flex-end" : "flex-start",
        cursor: "pointer",
      }}
    >
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-surface)", boxShadow: "var(--shadow-sm)" }} />
    </span>
  );
}

export function FormsSection() {
  const [, setNoop] = useState(0);
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Forms</h2>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Search</span>
        <div className={styles.demoRow} style={{ gap: 16 }}>
          <SearchInput variant="subtle" />
          <SearchInput variant="subtle" />
          <SearchInput variant="bordered" />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Input (prefix + attach)</span>
        <div className={styles.demoGrid}>
          <TextField tone="bordered" label="Label" />
          <TextField tone="subtle" />
          <TextField tone="subtle" label="Label" />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Checkbox</span>
        <div className={styles.demoRow} onClick={() => setNoop((n) => n + 1)}>
          <Checkbox state="off" tint="white" />
          <Checkbox state="on" tint="green" />
          <Checkbox state="indeterminate" tint="green" />
          <Checkbox state="off" tint="soft" />
          <Checkbox state="on" tint="soft" />
          <Checkbox state="on" tint="white" />
        </div>
      </div>

      <div className={styles.demoStack}>
        <span className={styles.demoLabel}>Toggle</span>
        <div className={styles.demoRow}>
          <Toggle on={false} />
          <Toggle on={true} />
        </div>
      </div>
    </section>
  );
}
