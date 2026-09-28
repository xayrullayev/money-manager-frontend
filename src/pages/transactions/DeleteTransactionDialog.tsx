import { Button } from "../../shared/ui/Button";
import { Dialog } from "../../shared/ui/Dialog";
import type { Transaction } from "../../shared/api/transactions";
import { deletionEffect, formatShortDate, transactionAccountLabel, transactionAmount, transactionTitle, TYPE_LABEL } from "./transactionView";
import styles from "./TransactionsPage.module.css";

interface Props {
  transaction: Transaction;
  hidden?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Design-05: "Delete confirm sana/kategoriya/hisob/summa va transfer ta'sirini ko'rsatadi."
 * Tasdiqlangach operatsiya darhol o'chmaydi — 6 soniyalik Undo toast beriladi (TransactionsPage).
 * Boshlang'ich fokus "Bekor qilish"da (xavfli harakat tasodifan tasdiqlanmasin).
 */
export function DeleteTransactionDialog({ transaction: tx, hidden = false, onCancel, onConfirm }: Props) {
  return (
    <Dialog title="Operatsiyani o‘chirish" onClose={onCancel}>
      <dl className={styles.deleteSummary}>
        <div>
          <dt>Turi</dt>
          <dd>{TYPE_LABEL[tx.type]}</dd>
        </div>
        <div>
          <dt>{tx.type === "TRANSFER" ? "Operatsiya" : "Kategoriya"}</dt>
          <dd>{transactionTitle(tx)}</dd>
        </div>
        <div>
          <dt>Hisob</dt>
          <dd>{transactionAccountLabel(tx)}</dd>
        </div>
        <div>
          <dt>Sana</dt>
          <dd>{formatShortDate(tx.transactionDate)}</dd>
        </div>
        <div>
          <dt>Summa</dt>
          <dd className={styles.deleteAmount}>{hidden ? "••••••" : transactionAmount(tx)}</dd>
        </div>
      </dl>
      <p className={styles.deleteEffect}>{hidden ? "O‘chirilganda ushbu operatsiyaning hisob qoldig‘iga ta’siri bekor qilinadi." : deletionEffect(tx)}</p>
      <div className={styles.dialogActions}>
        <Button variant="secondary" onClick={onCancel} data-autofocus>
          Bekor qilish
        </Button>
        <Button className={styles.dangerButton} onClick={onConfirm}>
          O‘chirish
        </Button>
      </div>
    </Dialog>
  );
}
