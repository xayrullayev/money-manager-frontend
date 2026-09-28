import { useState } from "react";
import type { Transaction } from "../../shared/api/transactions";
import { formatDateGroupLabel, groupByDate } from "../../shared/lib/date";
import { formatShortDate, transactionAccountLabel, transactionAmount, transactionTitle } from "./transactionView";
import styles from "./TransactionsPage.module.css";

interface Props {
  items: Transaction[];
  layout: "list" | "table";
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

const AMOUNT_CLASS: Record<Transaction["type"], string> = {
  INCOME: styles.income,
  EXPENSE: styles.expense,
  TRANSFER: styles.transfer,
};

/** Design-06: <768 — sana bo'yicha guruhlangan ro'yxat; ≥768 — jadval. */
export function TransactionList(props: Props) {
  return props.layout === "table" ? <TransactionTable {...props} /> : <GroupedList {...props} />;
}

function GroupedList({ items, onEdit, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const groups = groupByDate(items);

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.date} className={styles.group} aria-labelledby={`group-${group.date}`}>
          <h2 id={`group-${group.date}`} className={styles.groupLabel}>
            {formatDateGroupLabel(group.date).toLowerCase()}
          </h2>
          <ul className={styles.rows}>
            {group.items.map((tx) => {
              const expanded = expandedId === tx.id;
              const title = transactionTitle(tx);
              const amount = transactionAmount(tx);
              return (
                <li key={tx.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowText}>
                      <div className={styles.rowTitle}>{title}</div>
                      <div className={styles.rowMeta} title={tx.note}>
                        {transactionAccountLabel(tx)}
                        {tx.note ? ` • ${tx.note}` : ""}
                      </div>
                    </div>
                    <span className={`${styles.rowAmount} ${AMOUNT_CLASS[tx.type]}`}>{amount}</span>
                    <button
                      type="button"
                      className={styles.moreBtn}
                      aria-expanded={expanded}
                      aria-controls={`actions-${tx.id}`}
                      aria-label={`Amallar: ${title}, ${amount}`}
                      onClick={() => setExpandedId(expanded ? null : tx.id)}
                    >
                      <span aria-hidden="true">⋯</span>
                    </button>
                  </div>
                  {expanded && (
                    <div id={`actions-${tx.id}`} className={styles.rowActions}>
                      <button type="button" className={styles.actionBtn} onClick={() => onEdit(tx)}>
                        Tahrirlash
                      </button>
                      <button type="button" className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => onDelete(tx)}>
                        O‘chirish
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TransactionTable({ items, onEdit, onDelete }: Props) {
  return (
    <div className={styles.tableCard}>
      <table className={styles.table}>
        <caption className="sr-only">Operatsiyalar ro‘yxati</caption>
        <colgroup>
          <col className={styles.colDate} />
          <col />
          <col className={`${styles.colAccount} ${styles.accountColumn}`} />
          <col className={styles.colAmount} />
          <col className={styles.colActions} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Sana</th>
            <th scope="col">Operatsiya</th>
            <th scope="col" className={styles.accountColumn}>Hisob</th>
            <th scope="col" className={styles.numeric}>Summa</th>
            <th scope="col">
              <span className="sr-only">Amallar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => {
            const title = transactionTitle(tx);
            return (
              <tr key={tx.id}>
                <td className={styles.cellMuted}>{formatShortDate(tx.transactionDate)}</td>
                <td>
                  <div className={styles.cellTitle}>{title}</div>
                  <div className={styles.cellAccountInline}>{transactionAccountLabel(tx)}</div>
                  {tx.note && (
                    <div className={styles.cellNote} title={tx.note}>
                      {tx.note}
                    </div>
                  )}
                </td>
                <td className={`${styles.cellMuted} ${styles.accountColumn}`}>
                  <span className={styles.ellipsis} title={transactionAccountLabel(tx)}>
                    {transactionAccountLabel(tx)}
                  </span>
                </td>
                <td className={`${styles.numeric} ${styles.cellAmount} ${AMOUNT_CLASS[tx.type]}`}>{transactionAmount(tx)}</td>
                <td>
                  <div className={styles.tableActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => onEdit(tx)}
                      aria-label={`Tahrirlash: ${title}, ${formatShortDate(tx.transactionDate)}`}
                    >
                      Tahrirlash
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionDanger}`}
                      onClick={() => onDelete(tx)}
                      aria-label={`O‘chirish: ${title}, ${formatShortDate(tx.transactionDate)}`}
                    >
                      O‘chirish
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
