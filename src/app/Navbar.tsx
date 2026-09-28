import { useState, type ReactNode, type Ref } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Avatar } from "../shared/ui/Avatar";
import { pageLabel } from "../shared/lib/pageTitle";
import {
  SearchIcon,
  BellIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  MenuIcon,
} from "./navIcons";
import styles from "./Navbar.module.css";

export interface Crumb {
  label: string;
  /** Berilsa — havola; oxirgi (joriy) breadcrumb odatda `to` bermaydi. */
  to?: string;
}

export interface NavbarProps {
  /** Chapdagi sarlavha. Berilmasa — joriy route'dan (`pageLabel`) olinadi. */
  title?: string;
  /**
   * Breadcrumb ("Bosh sahifa / Sahifa ▾"). Berilsa `title` o'rniga chiziladi.
   * Oxirgi element joriy sahifa deb hisoblanadi.
   */
  crumbs?: Crumb[];
  /** Berilsa — sarlavha oldida orqaga (←) havolasi ko'rsatiladi. */
  backTo?: string;
  /** Qidiruv maydonini ko'rsatish (standart: true). */
  showSearch?: boolean;
  searchPlaceholder?: string;
  /**
   * Qidiruv yuborilganda chaqiriladi. Berilmasa maydon dizayn bo'yicha ko'rinadi,
   * lekin submit sahifani qayta yuklamaydi (global qidiruv keyin ulanadi).
   */
  onSearch?: (query: string) => void;
  /** Qo'ng'iroq ustidagi qizil nuqta (o'qilmagan bildirishnoma bor). */
  hasNotifications?: boolean;
  onBellClick?: () => void;
  /** O'ngdagi profil bloki uchun ixtiyoriy qo'shimcha (masalan menyu). */
  profileSlot?: ReactNode;

  /* --- Mobil hamburger integratsiyasi (AppShell drawer'i bilan) --- */
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  /** Hamburger `aria-controls` — drawer id'si. */
  menuControls?: string;
  menuButtonRef?: Ref<HTMLButtonElement>;
}

/** Telefon raqamidan avatar initials — oxirgi 2 raqam (ism hali yo'q, MVP). */
function phoneInitials(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 2 ? digits.slice(-2) : "MM";
}

/**
 * Yuqori header (navbar) — UI'ning eng tepasida, barcha ekranlarda sticky.
 * Chapda: (ixtiyoriy hamburger) + (ixtiyoriy ←) + sarlavha yoki breadcrumb.
 * O'ngda: qidiruv + bildirishnoma qo'ng'irog'i + profil.
 * Dizayn: Green-Dark sarlavha, soft-yashil pill tugmalar, Urbanist (tokens.css).
 */
export function Navbar({
  title,
  crumbs,
  backTo,
  showSearch = true,
  searchPlaceholder = "Qidirish…",
  onSearch,
  hasNotifications = false,
  onBellClick,
  profileSlot,
  menuOpen,
  onMenuToggle,
  menuControls,
  menuButtonRef,
}: NavbarProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const heading = title ?? pageLabel(pathname);
  const userLabel = user?.phone ?? "Foydalanuvchi";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        {/* Chap: hamburger (mobil) + orqaga + sarlavha/breadcrumb */}
        <div className={styles.left}>
          {onMenuToggle && (
            <button
              type="button"
              ref={menuButtonRef}
              className={styles.menuBtn}
              aria-label="Navigatsiya menyusi"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls={menuControls}
              onClick={onMenuToggle}
            >
              <MenuIcon />
            </button>
          )}

          {backTo && (
            <Link to={backTo} className={styles.backBtn} aria-label="Orqaga">
              <ArrowLeftIcon />
            </Link>
          )}

          {crumbs && crumbs.length > 0 ? (
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <ol className={styles.crumbList}>
                {crumbs.map((crumb, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <li key={`${crumb.label}-${i}`} className={styles.crumb}>
                      {crumb.to && !last ? (
                        <Link to={crumb.to} className={styles.crumbLink}>
                          {crumb.label}
                        </Link>
                      ) : (
                        <span
                          className={last ? styles.crumbCurrent : styles.crumbLink}
                          aria-current={last ? "page" : undefined}
                        >
                          {crumb.label}
                        </span>
                      )}
                      {!last && <span className={styles.crumbSep} aria-hidden="true">/</span>}
                      {last && <ChevronDownIcon className={styles.crumbChevron} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : (
            <span className={styles.title}>{heading}</span>
          )}
        </div>

        {/* O'ng: qidiruv + qo'ng'iroq + profil */}
        <div className={styles.right}>
          {showSearch && (
            <>
              <form className={styles.search} role="search" onSubmit={handleSubmit}>
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className={styles.searchBtn} aria-label="Qidirish">
                  <SearchIcon />
                </button>
              </form>
              {/* Tor ekranda qidiruv maydoni o'rniga ikon-tugma (CSS bilan almashadi). */}
              <button type="button" className={`${styles.iconAction} ${styles.searchToggle}`} aria-label="Qidirish">
                <SearchIcon />
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.iconAction}
            aria-label={hasNotifications ? "Bildirishnomalar (yangi bor)" : "Bildirishnomalar"}
            onClick={onBellClick}
          >
            <BellIcon />
            {hasNotifications && <span className={styles.dot} aria-hidden="true" />}
          </button>

          {profileSlot ?? (
            <div className={styles.profile}>
              <Avatar
                initials={phoneInitials(user?.phone)}
                name={userLabel}
                presence="online"
                size={36}
              />
              <span className={styles.userName}>{userLabel}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
