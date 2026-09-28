import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useDocumentTitle } from "../shared/hooks/useDocumentTitle";
import styles from "./AppShell.module.css";

interface NavItem {
  to: string;
  label: string;
}

/** Frontend-01: sidebar (desktop) / bottom nav (mobile) — Figma dizayniga mos, matn-only nav. */
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Bosh sahifa" },
  { to: "/transactions", label: "Operatsiyalar" },
  { to: "/accounts", label: "Hisoblar" },
  { to: "/budgets", label: "Budjetlar" },
  { to: "/reports", label: "Hisobotlar" },
  { to: "/settings", label: "Sozlamalar" },
];

/** Mobil "Yana" menyusi ichidagi sahifalar — shu sahifalardan birida "Yana" faol ko'rinadi. */
const MORE_ITEMS: NavItem[] = [
  { to: "/accounts", label: "Hisoblar" },
  { to: "/reports", label: "Hisobotlar" },
  { to: "/settings", label: "Sozlamalar" },
];

const MAIN_ID = "main-content";

function Diamond() {
  return <span className={styles.diamond} aria-hidden="true" />;
}

/** Himoyalangan sahifalar uchun layout route — sahifa `<Outlet />` orqali chiziladi. */
export function AppShell() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  const lastPathname = useRef(pathname);

  useDocumentTitle();

  // Sahifa almashganda fokus kontentga o'tadi (klaviatura va ekran o'quvchi foydalanuvchisi
  // yangi sahifa boshidan davom etadi). Birinchi yuklashda emas; faqat pathname o'zgarganda —
  // filtr/query o'zgarishi (masalan qidiruv maydoniga yozish) fokusni o'g'irlamasin.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    moreRef.current?.removeAttribute("open");
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  // "Yana" menyusi: Escape yoki tashqariga bosish yopadi; Escape'da fokus tugmaga qaytadi.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const menu = moreRef.current;
      if (event.key === "Escape" && menu?.open) {
        menu.removeAttribute("open");
        menu.querySelector("summary")?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const menu = moreRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.removeAttribute("open");
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const moreActive = MORE_ITEMS.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
  const mobileLink = ({ isActive }: { isActive: boolean }) =>
    [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ");

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_ID}`}>
        Asosiy kontentga o‘tish
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Diamond />
          Money Manager
        </div>
        <div className={styles.sidebarSectionLabel}>Shaxsiy moliya</div>
        <nav className={styles.sidebarNav} aria-label="Asosiy navigatsiya">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [styles.sidebarLink, isActive ? styles.sidebarLinkActive : ""].filter(Boolean).join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.logoutArea}>
          <button type="button" className={styles.logoutBtn} onClick={() => void logout()}>
            Chiqish
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            <Diamond />
            Money Manager
          </span>
        </header>

        <main id={MAIN_ID} ref={mainRef} tabIndex={-1} className={styles.content}>
          <Outlet />
        </main>

        <nav className={styles.bottomNav} aria-label="Mobil navigatsiya">
          <div className={styles.mobileNavBar}>
            <NavLink to="/" end className={mobileLink}>Asosiy</NavLink>
            <NavLink to="/transactions" className={mobileLink}>Tarix</NavLink>
            <NavLink to="/budgets" className={mobileLink}>Budjet</NavLink>
            <details ref={moreRef} className={styles.moreMenu}>
              <summary className={[styles.navItem, moreActive ? styles.navItemActive : ""].filter(Boolean).join(" ")}>
                Yana
              </summary>
              <div className={styles.moreMenuContent}>
                {MORE_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} onClick={() => moreRef.current?.removeAttribute("open")} className={({ isActive }) => (isActive ? styles.moreLinkActive : styles.moreLink)}>
                    {item.label}
                  </NavLink>
                ))}
                <button type="button" className={styles.logoutBtn} onClick={() => void logout()}>Chiqish</button>
              </div>
            </details>
          </div>
        </nav>
      </div>
    </div>
  );
}
