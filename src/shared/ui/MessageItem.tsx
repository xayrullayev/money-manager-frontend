import type { ReactNode } from "react";
import styles from "./MessageItem.module.css";
import { Badge } from "./Badge";

interface MessageItemProps {
  /** Yuboruvchi ismi. */
  name: ReactNode;
  /** Oxirgi xabar matni — bir qatorga qisqartiriladi (ellipsis). */
  preview?: ReactNode;
  /** Vaqt (masalan "09:15 AM"). */
  time?: string;
  /** Avatar tuguni (odatda <Avatar presence=… />). */
  avatar?: ReactNode;
  /** Ixtiyoriy rol chipi (masalan "Trainer"). */
  role?: string;
  /** O'qilmagan xabarlar soni — >0 bo'lsa danger hisoblagich ko'rsatiladi. */
  unreadCount?: number;
  /** Tanlangan (ochiq) suhbat — yashil chegara + soft fon. */
  selected?: boolean;
  /** Bosilganda — berilса qator tugmaga aylanadi (klaviatura bilan fokuslanadi). */
  onClick?: () => void;
}

/**
 * Design-Migrate-07 (Item): Inbox suhbat qatori — avatar + presence, ism, rol,
 * vaqt, qisqartirilgan preview va o'qilmagan hisoblagich. Ro'yxat ichida `<li>`.
 */
export function MessageItem({ name, preview, time, avatar, role, unreadCount, selected, onClick }: MessageItemProps) {
  const inner = (
    <>
      {avatar && <span className={styles.media}>{avatar}</span>}
      <span className={styles.content}>
        <span className={styles.topRow}>
          <span className={styles.name}>{name}</span>
          {role && <Badge tone="accent">{role}</Badge>}
          {time && <span className={styles.time}>{time}</span>}
        </span>
        {preview && <span className={styles.preview}>{preview}</span>}
      </span>
      {unreadCount != null && unreadCount > 0 && (
        <span className={styles.unread}>
          <Badge tone="danger" count>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        </span>
      )}
    </>
  );

  const className = [styles.item, selected ? styles.selected : "", onClick ? styles.clickable : ""].filter(Boolean).join(" ");

  return (
    <li className={styles.row}>
      {onClick ? (
        <button type="button" className={className} onClick={onClick} aria-current={selected || undefined}>
          {inner}
        </button>
      ) : (
        <div className={className} aria-current={selected || undefined}>
          {inner}
        </div>
      )}
    </li>
  );
}
