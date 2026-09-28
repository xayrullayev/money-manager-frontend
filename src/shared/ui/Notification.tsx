import type { ReactNode } from "react";
import styles from "./Notification.module.css";
import { Badge } from "./Badge";

/* ---------------- NotificationItem ---------------- */

interface NotificationItemProps {
  /** Sarlavha (odatda ism yoki hodisa nomi). */
  title: ReactNode;
  /** Tavsif matni. */
  body?: ReactNode;
  /** Vaqt (masalan "2h ago"). */
  time?: string;
  /** Toifa (masalan "Offers"). */
  category?: string;
  /** Avatar/ikon tuguni. */
  media?: ReactNode;
  /** O'qilmagan — soft fon + boshida nuqta bilan ajratiladi. */
  unread?: boolean;
  /** Ixtiyoriy amal tugmalari (masalan Accept / Decline). */
  actions?: ReactNode;
  /** Berilsa — o'qilgan/o'qilmagan holatini almashtiruvchi belgi tugmasi. */
  onToggleRead?: () => void;
}

/**
 * Design-Migrate-07 (Item / notification.png): bitta bildirishnoma —
 * media + sarlavha + matn + (vaqt • toifa) + ixtiyoriy amallar. `<li>` sifatida.
 */
export function NotificationItem({ title, body, time, category, media, unread, actions, onToggleRead }: NotificationItemProps) {
  return (
    <li className={[styles.item, unread ? styles.unread : ""].filter(Boolean).join(" ")}>
      {unread && <span className={styles.dot} aria-hidden="true" />}
      {media && <span className={styles.media}>{media}</span>}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {onToggleRead && (
            <button
              type="button"
              className={styles.readToggle}
              aria-pressed={!unread}
              aria-label={unread ? "O'qilgan deb belgilash" : "O'qilmagan deb belgilash"}
              onClick={onToggleRead}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <path d="M5 12l5 5L20 6" />
              </svg>
            </button>
          )}
        </div>
        {body && <p className={styles.body}>{body}</p>}
        {(time || category) && (
          <div className={styles.meta}>
            {time && <span>{time}</span>}
            {time && category && <span aria-hidden="true">•</span>}
            {category && <span>{category}</span>}
          </div>
        )}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </li>
  );
}

/* ---------------- NotificationPanel ---------------- */

export interface NotificationTab {
  value: string;
  label: string;
  count?: number;
}

interface NotificationPanelProps {
  /** Panel sarlavhasi. Standart "Bildirishnomalar". */
  title?: string;
  /** Ixtiyoriy filtr tablari (All / Following / Orders …). */
  tabs?: NotificationTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  /** Berilsa — "hammasini o'qilgan deb belgilash" tugmasi ko'rsatiladi. */
  onMarkAllRead?: () => void;
  /** NotificationItem lar. */
  children: ReactNode;
  className?: string;
}

/**
 * Design-Migrate-07: bildirishnoma paneli (bell dropdown) — sarlavha + "hammasini
 * o'qilgan", ixtiyoriy tablar (soni bilan) va bildirishnomalar ro'yxati.
 * Ilova ichida och surface dropdown sifatida ishlatiladi (etalondagi quyuq-yashil
 * taqdimot shu token tizimiga moslashtirilgan).
 */
export function NotificationPanel({
  title = "Bildirishnomalar",
  tabs,
  activeTab,
  onTabChange,
  onMarkAllRead,
  children,
  className,
}: NotificationPanelProps) {
  return (
    <section className={[styles.panel, className ?? ""].filter(Boolean).join(" ")} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.panelTitle}>{title}</h2>
        {onMarkAllRead && (
          <button type="button" className={styles.markAll} onClick={onMarkAllRead}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d="M5 12l5 5L20 6" />
            </svg>
            Hammasini o'qilgan
          </button>
        )}
      </header>

      {tabs && tabs.length > 0 && (
        <div className={styles.tabs} role="tablist" aria-label={`${title} — filtrlar`}>
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[styles.tab, isActive ? styles.tabActive : ""].filter(Boolean).join(" ")}
                onClick={() => onTabChange?.(tab.value)}
              >
                {tab.label}
                {tab.count != null && (
                  <Badge tone={isActive ? "accent" : "neutral"}>{tab.count.toLocaleString("en-US")}</Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ul className={styles.list}>{children}</ul>
    </section>
  );
}
