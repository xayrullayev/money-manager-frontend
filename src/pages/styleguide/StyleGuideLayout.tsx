import { NavLink, Outlet } from "react-router-dom";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import "./styleguide-tokens.css";
import styles from "./StyleGuide.module.css";

/**
 * Style & Component — IZOLYATSIYA qilingan dizayn namunasi (reference).
 *
 * Bu modul asosiy app'dan AJRATILGAN: butun style guide `.sgui-root` scope ostida
 * render bo'ladi va barcha token qiymatlari `styleguide-tokens.css`da QOTIRILGAN.
 * Shu sabab asosiy app'ning `styles/tokens.css` yoki komponent CSS'idagi o'zgarishlar
 * bu sahifaga TA'SIR QILMAYDI — u faqat namuna sifatida turadi.
 *
 * Etalon o'zgarganda qiymatlar SHU modulning `styleguide-tokens.css` faylida qo'lda
 * yangilanadi (app tokenlari avtomatik tarqalmaydi).
 */
const PAGES: { to: string; label: string }[] = [
  { to: "/style-guide/colors", label: "Color" },
  { to: "/style-guide/typography", label: "Typography" },
  { to: "/style-guide/elements", label: "Element" },
  { to: "/style-guide/components", label: "Component" },
];

export function StyleGuideLayout() {
  useDocumentTitle();
  return (
    <div className={`sgui-root ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.brand}>Style &amp; Component</h1>
          <p className={styles.subtitle}>
            Money Manager dizayn tizimi — ranglar, tipografiya, elementlar va komponentlar.
            Izolyatsiya qilingan namuna: qiymatlar shu modulda qotirilgan, asosiy app
            o‘zgarishlari bu yerga ta’sir qilmaydi.
          </p>
          <nav className={styles.nav} aria-label="Style guide bo'limlari">
            {PAGES.map((page) => (
              <NavLink
                key={page.to}
                to={page.to}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                {page.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
