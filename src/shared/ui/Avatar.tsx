import type { CSSProperties, ReactNode } from "react";
import styles from "./Avatar.module.css";

export type AvatarPresence = "online" | "away" | "busy" | "offline";

interface AvatarProps {
  /** To'liq ism — initials avtomatik olinadi va (dekorativ bo'lmasa) `aria-label` bo'ladi. */
  name?: string;
  /** Qo'lda initials (masalan "AB" yoki "+5"). `name` berilmaganda yoki uni bekor qilish uchun. */
  initials?: string;
  /** Rasm manzili — bo'lsa initials o'rniga ko'rsatiladi. */
  src?: string;
  /** Piksel o'lchami (kvadrat). Standart 36. */
  size?: number;
  /** `light` — Green-Light fon + quyuq matn (standart); `solid` — accent fon + oq matn. */
  variant?: "light" | "solid";
  /** Presence (onlayn holati) nuqtasi — pastki o'ng burchakda. */
  presence?: AvatarPresence;
  /** Ro'yxatda ism yonida bo'lsa dekorativ qilib, ekran o'quvchidan yashiring. */
  decorative?: boolean;
  className?: string;
}

const PRESENCE_LABEL: Record<AvatarPresence, string> = {
  online: "Onlayn",
  away: "Uzoqda",
  busy: "Band",
  offline: "Oflayn",
};

/** Ism ichidan initials: bitta so'z → 2 harf; ko'p so'z → birinchi+oxirgi bosh harflari. */
function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Design-Migrate-07: yagona Avatar (Element/Item bo'limlari). Initials yoki rasm,
 * ixtiyoriy presence nuqtasi. Dekorativ emas holatda `role="img"` + ism `aria-label`.
 */
export function Avatar({ name, initials, src, size = 36, variant = "light", presence, decorative, className }: AvatarProps) {
  const text = initials ?? (name ? initialsFrom(name) : "?");
  const label = decorative ? undefined : name;
  const style: CSSProperties = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  return (
    <span
      className={[styles.root, styles[variant], className ?? ""].filter(Boolean).join(" ")}
      style={style}
      role={!decorative && label ? "img" : undefined}
      aria-label={label}
      aria-hidden={decorative || undefined}
      title={label}
    >
      {src ? (
        <img className={styles.img} src={src} alt="" />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {text}
        </span>
      )}
      {presence && (
        <span
          className={[styles.presence, styles[`presence_${presence}`]].join(" ")}
          role={decorative ? undefined : "status"}
          aria-label={decorative ? undefined : PRESENCE_LABEL[presence]}
          title={PRESENCE_LABEL[presence]}
        />
      )}
    </span>
  );
}

/** Ustma-ust turadigan avatarlar guruhi (masalan a'zolar ro'yxati + "+5"). */
export function AvatarGroup({ children, ariaLabel }: { children: ReactNode; ariaLabel?: string }) {
  return (
    <span className={styles.group} role={ariaLabel ? "group" : undefined} aria-label={ariaLabel}>
      {children}
    </span>
  );
}
