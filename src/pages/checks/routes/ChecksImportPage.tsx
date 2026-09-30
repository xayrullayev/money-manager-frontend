import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui";
import { ArrowLeftIcon } from "../../../app/navIcons";
import { ImportCheckScreen } from "../import";
import styles from "./ChecksSubPage.module.css";

/**
 * `/checks/import` — QR / havola orqali chek import qilish (alohida to'liq sahifa).
 * Muvaffaqiyatli importdan keyin ekran natija kartochkasini ko'rsatadi; foydalanuvchi
 * "Cheklar tarixiga" havolasi orqali ro'yxatga qaytadi.
 */
export function ChecksImportPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <Button variant="ghost" type="button" onClick={() => navigate("/checks")}>
        <span className={styles.back}>
          <ArrowLeftIcon /> Cheklar tarixiga
        </span>
      </Button>
      <ImportCheckScreen onCancel={() => navigate("/checks")} />
    </div>
  );
}
