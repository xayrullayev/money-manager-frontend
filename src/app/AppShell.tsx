import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useDocumentTitle } from "../shared/hooks/useDocumentTitle";
import {
  DashboardIcon,
  SavingsIcon,
  TransactionsIcon,
  AccountsIcon,
  BudgetsIcon,
  ReportsIcon,
  SettingsIcon,
  SignOutIcon,
  CloseIcon,
  StyleGuideIcon,
} from "./navIcons";
import { Navbar } from "./Navbar";
import styles from "./AppShell.module.css";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  to: string;
  label: string;
  icon: NavIcon;
}

/** Design-Migrate-03: desktop sidebar / tablet ikon-rail / mobil hamburger-drawer. */
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Bosh sahifa", icon: DashboardIcon },
  { to: "/transactions", label: "Operatsiyalar", icon: TransactionsIcon },
  { to: "/accounts", label: "Hisoblar", icon: AccountsIcon },
  { to: "/budgets", label: "Budjetlar", icon: BudgetsIcon },
  { to: "/savings", label: "Jamg‘arma", icon: SavingsIcon },
  { to: "/reports", label: "Hisobotlar", icon: ReportsIcon },
  { to: "/settings", label: "Sozlamalar", icon: SettingsIcon },
  // Dizayn tizimi ma'lumotnomasi (Design-Migrate). Route AppShell'dan tashqarida — jonli style guide.
  { to: "/style-guide", label: "Style & Component", icon: StyleGuideIcon },
];

const MAIN_ID = "main-content";
const DRAWER_ID = "mobile-nav-drawer";

function Diamond() {
  return <span className={styles.diamond} aria-hidden="true" />;
}

/** Himoyalangan sahifalar uchun layout route — sahifa `<Outlet />` orqali chiziladi. */
export function AppShell() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastPathname = useRef(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useDocumentTitle();

  // Sahifa almashganda: drawer yopiladi va fokus kontentga o'tadi (klaviatura/ekran o'quvchi
  // yangi sahifa boshidan davom etadi). Birinchi yuklashda emas; faqat pathname o'zgarganda.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    setMenuOpen(false);
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  // Drawer ochiq: Escape yopadi va fokus hamburger tugmasiga qaytadi.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Drawer ochilganda birinchi havolaga fokus.
  useEffect(() => {
    if (menuOpen) drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
  }, [menuOpen]);

  const linkClass =
    (active: string) =>
    ({ isActive }: { isActive: boolean }) =>
      [styles.sidebarLink, isActive ? active : ""].filter(Boolean).join(" ");

  const navLinks = (activeClass: string) =>
    NAV_ITEMS.map(({ to, label, icon: Icon }) => (
      <NavLink key={to} to={to} end={to === "/"} className={linkClass(activeClass)}>
        <Icon className={styles.sidebarIcon} />
        <span className={styles.linkLabel}>{label}</span>
      </NavLink>
    ));

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href={`#${MAIN_ID}`}>
        Asosiy kontentga o‘tish
      </a>

      {/* Desktop sidebar + tablet ikon-rail (CSS breakpoint bilan) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Diamond />
          <span className={styles.brandLabel}>Money Manager</span>
        </div>
        <div className={styles.sidebarSectionLabel}>Shaxsiy moliya</div>
        <nav className={styles.sidebarNav} aria-label="Asosiy navigatsiya">
          {navLinks(styles.sidebarLinkActive)}
        </nav>
        <div className={styles.logoutArea}>
          <button type="button" className={styles.logoutBtn} onClick={() => void logout()}>
            <SignOutIcon className={styles.sidebarIcon} />
            <span className={styles.linkLabel}>Chiqish</span>
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        {/* Yuqori header (navbar): sarlavha + qidiruv + qo'ng'iroq + profil.
            Mobil'da hamburger shu yerda — drawer'ni ochadi. */}
        <Navbar
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
          menuControls={DRAWER_ID}
          menuButtonRef={menuButtonRef}
        />

        <main id={MAIN_ID} ref={mainRef} tabIndex={-1} className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Mobil drawer (hamburger ochadi) */}
      {menuOpen && (
        <div className={styles.drawerOverlay} onClick={() => setMenuOpen(false)}>
          <div
            id={DRAWER_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Navigatsiya"
            ref={drawerRef}
            className={styles.drawer}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <span className={styles.brand}>
                <Diamond />
                <span className={styles.brandLabel}>Money Manager</span>
              </span>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Menyuni yopish"
                onClick={() => {
                  setMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
              >
                <CloseIcon className={styles.menuIcon} />
              </button>
            </div>
            <nav className={styles.drawerNav} aria-label="Asosiy navigatsiya">
              {navLinks(styles.sidebarLinkActive)}
            </nav>
            <div className={styles.logoutArea}>
              <button type="button" className={styles.logoutBtn} onClick={() => void logout()}>
                <SignOutIcon className={styles.sidebarIcon} />
                <span className={styles.linkLabel}>Chiqish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
