import type { Transaction } from "../../shared/api/transactions";
import { formatMoney, formatSignedMoney } from "../../shared/lib/money";
import { uzMonthName } from "../../shared/lib/uzDate";

/** Ro'yxat, jadval va o'chirish dialogi uchun bir xil matnlar. */

export const TYPE_LABEL: Record<Transaction["type"], string> = {
  EXPENSE: "Xarajat",
  INCOME: "Daromad",
  TRANSFER: "O‘tkazma",
};

export function transactionTitle(tx: Transaction): string {
  return tx.type === "TRANSFER" ? "Hisoblararo o‘tkazma" : (tx.categoryName ?? TYPE_LABEL[tx.type]);
}

export function transactionAccountLabel(tx: Transaction): string {
  return tx.type === "TRANSFER"
    ? `${tx.fromAccountName ?? tx.accountName} → ${tx.toAccountName ?? "—"}`
    : tx.accountName;
}

/** Summa har doim belgi bilan (rangdan tashqari): +, − yoki o'tkazmada belgisiz. */
export function transactionAmount(tx: Transaction): string {
  return tx.type === "TRANSFER" ? formatMoney(tx.amount, tx.currency) : formatSignedMoney(tx.amount, tx.currency, tx.type);
}

/** "18-sentabr" (joriy yil) yoki "18-sentabr 2025". */
export function formatShortDate(isoDate: string, now: Date = new Date()): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const label = `${day}-${uzMonthName(month - 1).toLowerCase()}`;
  return year === now.getFullYear() ? label : `${label} ${year}`;
}

/** O'chirish dialogi: operatsiya o'chirilganda hisob(lar)ga nima bo'lishi — Design-05. */
export function deletionEffect(tx: Transaction): string {
  const amount = formatMoney(tx.amount, tx.currency);
  if (tx.type === "TRANSFER") {
    return `${tx.fromAccountName ?? tx.accountName} hisobiga ${amount} qaytadi, ${tx.toAccountName ?? "maqsad"} hisobidan shuncha ayriladi. Jami balans o‘zgarmaydi.`;
  }
  return tx.type === "EXPENSE"
    ? `${tx.accountName} qoldig‘i ${amount} ga oshadi.`
    : `${tx.accountName} qoldig‘i ${amount} ga kamayadi.`;
}
