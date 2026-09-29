import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteTransaction, getTransaction, type Transaction } from "../../shared/api/transactions";
import { ApiError } from "../../shared/api/client";
import { Button } from "../../shared/ui/Button";
import { useToast } from "../../shared/ui/Toast";
import { formatShortDate, transactionAccountLabel, transactionAmount, transactionTitle, TYPE_LABEL } from "./transactionView";
import { AddTransactionDialog } from "../dashboard/AddTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import styles from "./TransactionDetailPage.module.css";

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Ma’lumot yuklanmadi. Qayta urinib ko‘ring.";
}

const AMOUNT_CLASS: Record<Transaction["type"], string> = {
  INCOME: styles.income,
  EXPENSE: styles.expense,
  TRANSFER: styles.transfer,
};

/**
 * Frontend-check-03: Chek (operatsiya) tafsiloti ekrani.
 *
 * `/transactions/:id` — bitta operatsiyani chek (kvitansiya) ko'rinishida to'liq
 * ko'rsatadi: tur, summa, sana, hisob(lar), kategoriya, valyuta, izoh va ID.
 * Amallar: Tahrirlash, O'chirish va "Xarajatga saqlash" — shu operatsiyadan yangi
 * xarajat nusxasini oldindan to'ldirib yaratish (masalan takroriy xaridlar uchun).
 */
export function TransactionDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "not-found">("loading");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const [editing, setEditing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    document.title = tx ? `${transactionTitle(tx)} · Money Manager` : "Operatsiya tafsiloti · Money Manager";
  }, [tx]);

  const load = useCallback(() => {
    let active = true;
    setStatus("loading");
    setError("");
    getTransaction(id)
      .then((data) => {
        if (active) {
          setTx(data);
          setStatus("ready");
        }
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 404) {
          setStatus("not-found");
        } else {
          setError(errorMessage(cause));
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => load(), [load, retry]);

  function confirmDelete() {
    if (!tx || deletePending) return;
    setDeletePending(true);
    deleteTransaction(tx.id, tx.version)
      .then(() => {
        showToast("Operatsiya o‘chirildi", "success");
        navigate("/transactions", { replace: true });
      })
      .catch((cause) => {
        setDeletePending(false);
        setDeleting(false);
        showToast(errorMessage(cause), "error", 8000);
      });
  }

  if (status === "loading") {
    return (
      <div className={styles.page}>
        <BackLink />
        <div className={styles.receipt} role="status" aria-busy="true">
          <p>Operatsiya yuklanmoqda…</p>
          <div className={styles.skeleton} aria-hidden="true" />
          <div className={styles.skeleton} aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className={styles.page}>
        <BackLink />
        <div className={styles.state}>
          <h1>Operatsiya topilmadi</h1>
          <p>Ushbu operatsiya o‘chirilgan yoki manzil noto‘g‘ri bo‘lishi mumkin.</p>
          <Link to="/transactions" className={styles.stateLink}>Operatsiyalar ro‘yxatiga qaytish</Link>
        </div>
      </div>
    );
  }

  if (status === "error" || !tx) {
    return (
      <div className={styles.page}>
        <BackLink />
        <div className={styles.state} role="alert">
          <h1>Operatsiya yuklanmadi</h1>
          <p>{error}</p>
          <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>Qayta urinish</Button>
        </div>
      </div>
    );
  }

  const isTransfer = tx.type === "TRANSFER";

  return (
    <div className={styles.page}>
      <BackLink />
      <article className={styles.receipt} aria-label="Operatsiya cheki">
        <header className={styles.head}>
          <span className={`${styles.badge} ${AMOUNT_CLASS[tx.type]}`}>{TYPE_LABEL[tx.type]}</span>
          <h1 className={styles.title}>{transactionTitle(tx)}</h1>
          <p className={`${styles.amount} ${AMOUNT_CLASS[tx.type]}`}>
            {transactionAmount(tx).replace(/ /g, " ")}
          </p>
        </header>

        <div className={styles.perforation} aria-hidden="true" />

        <dl className={styles.rows}>
          <Row label="Sana" value={formatShortDate(tx.transactionDate)} />
          {isTransfer ? (
            <>
              <Row label="Qayerdan" value={tx.fromAccountName ?? tx.accountName} />
              <Row label="Qayerga" value={tx.toAccountName ?? "—"} />
            </>
          ) : (
            <>
              <Row label="Hisob" value={transactionAccountLabel(tx)} />
              {tx.categoryName && <Row label="Kategoriya" value={tx.categoryName} />}
            </>
          )}
          <Row label="Valyuta" value={tx.currency} />
          <Row label="Izoh" value={tx.note?.trim() || "Izoh kiritilmagan"} muted={!tx.note?.trim()} />
        </dl>

        <div className={styles.perforation} aria-hidden="true" />

        <p className={styles.meta}>
          Operatsiya ID: <code>{tx.id}</code>
        </p>
      </article>

      <div className={styles.actions}>
        <Button onClick={() => setEditing(true)} disabled={deletePending}>Tahrirlash</Button>
        <Button variant="secondary" onClick={() => setCopying(true)} disabled={deletePending}>
          Xarajatga saqlash
        </Button>
        <Button variant="danger" onClick={() => setDeleting(true)} disabled={deletePending}>
          O‘chirish
        </Button>
      </div>
      <p className={styles.hint}>
        “Xarajatga saqlash” shu operatsiyadan yangi xarajat nusxasini oldindan to‘ldirib ochadi — asl operatsiya o‘zgarmaydi.
      </p>

      {editing && (
        <AddTransactionDialog
          transaction={tx}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setEditing(false);
            setTx(updated);
            showToast("Operatsiya saqlandi", "success");
          }}
        />
      )}

      {copying && (
        <AddTransactionDialog
          initialType="EXPENSE"
          template={{
            amount: tx.amount,
            date: tx.transactionDate,
            note: tx.note ?? "",
            accountId: isTransfer ? "" : tx.accountId,
            categoryId: tx.type === "EXPENSE" ? (tx.categoryId ?? "") : "",
          }}
          onClose={() => setCopying(false)}
          onSaved={(saved) => {
            setCopying(false);
            showToast("Yangi xarajat saqlandi", "success");
            navigate(`/transactions/${saved.id}`);
          }}
        />
      )}

      {deleting && (
        <DeleteTransactionDialog
          transaction={tx}
          onCancel={() => setDeleting(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/transactions" className={styles.back}>
      <span aria-hidden="true">←</span> Operatsiyalar
    </Link>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={styles.rowItem}>
      <dt className={styles.rowLabel}>{label}</dt>
      <dd className={`${styles.rowValue} ${muted ? styles.rowMuted : ""}`}>{value}</dd>
    </div>
  );
}
