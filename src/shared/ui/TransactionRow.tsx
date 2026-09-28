import { formatMoney, formatSignedMoney } from "../lib/money";
import styles from "./TransactionRow.module.css";

interface TransactionRowProps {
  title: string;
  subtitle?: string;
  amount: string | number;
  currency: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  onClick?: () => void;
}

/**
 * Ro'yxat qatori — Design-02 Transaction row komponenti (Dashboard so'nggi
 * operatsiyalar va kelgusi Operatsiyalar ro'yxati, Design-06, uchun umumiy).
 * Summa ma'nosi rangdan tashqari +/− belgi bilan ham beriladi (rang-ko'r-friendly).
 */
export function TransactionRow({ title, subtitle, amount, currency, type, onClick }: TransactionRowProps) {
  const amountClass = type === "INCOME" ? styles.income : type === "EXPENSE" ? styles.expense : styles.transfer;
  const formatted = type === "TRANSFER" ? formatMoney(amount, currency) : formatSignedMoney(amount, currency, type);

  const content = (
    <div className={styles.row}>
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      <span className={[styles.amount, amountClass].join(" ")}>{formatted}</span>
    </div>
  );

  if (!onClick) return content;

  return (
    <button type="button" className={styles.rowButton} onClick={onClick}>
      {content}
    </button>
  );
}
