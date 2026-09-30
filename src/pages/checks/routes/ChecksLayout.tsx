import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui";
import styles from "./ChecksLayout.module.css";

/**
 * Cheklar bo'limi layout'i — "Cheklar tarixi" va "Xaridlar tahlili" sahifalari
 * ustidagi umumiy sarlavha, bo'lim tab-navigatsiyasi va asosiy amal tugmasi.
 *
 * Tarix va tahlil endi alohida route (`/checks`, `/checks/analytics`) — deep-link
 * va brauzer "orqaga" tugmasi ishlaydi. Chek qo'shish alohida sahifada
 * (`/checks/import`). Chek tafsiloti (`/checks/:id`) va import sahifasi bu
 * layout'dan tashqarida — ular o'z "orqaga" havolasiga ega.
 */
export function ChecksLayout() {
  const navigate = useNavigate();

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [styles.tab, isActive ? styles.tabActive : ""].filter(Boolean).join(" ");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <p className={styles.eyebrow}>Xarajatlaringiz, tafsilotlari bilan</p>
          <h1 className={styles.title}>Cheklar</h1>
          <p className={styles.subtitle}>
            Xaridlaringizni saqlang va pulingiz nimalarga ketayotganini bilib boring.
          </p>
        </div>
        <Button type="button" onClick={() => navigate("/checks/import")}>
          <span aria-hidden="true">＋</span> Chek qo‘shish
        </Button>
      </header>

      <nav className={styles.tabs} aria-label="Cheklar bo‘limi">
        <NavLink to="/checks" end className={tabClass}>
          Cheklar tarixi
        </NavLink>
        <NavLink to="/checks/analytics" className={tabClass}>
          Xaridlar tahlili
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
