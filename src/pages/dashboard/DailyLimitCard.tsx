import { Fragment, useEffect, useRef, useState } from "react";
import { fetchDailyLimit, type DailyLimitStatus } from "../../shared/api/dailyLimit";
import { ApiError } from "../../shared/api/client";
import { Button, EmptyState, MenuButton, Skeleton, useToast } from "../../shared/ui";
import { formatMoney } from "../../shared/lib/money";
import { percentLabel, progressValue, progressValueText, statusMessage } from "../../shared/lib/dailyLimit";
import { DailyLimitDeleteDialog, DailyLimitEditor } from "./DailyLimitEditor";
import styles from "./DailyLimitCard.module.css";

type Dialog = "edit" | "delete" | null;

/**
 * Bosh sahifadagi "Kunlik limit" bloki (Frontend-05, docs/daily-limit-contract.md).
 * O'z ma'lumotini o'zi yuklaydi; `refreshKey` o'zgarsa (masalan operatsiya saqlangach)
 * qayta so'raydi, bunda eski raqamlar skeletga almashtirilmaydi.
 */
export function DailyLimitCard({ className, refreshKey = 0 }: { className?: string; refreshKey?: number }) {
  const [data, setData] = useState<DailyLimitStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const request = useRef(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();

  // Dialog yopilgach uni ochgan tugma yo'qolgan bo'lishi mumkin (NONE ⇄ limit) — fokus blokda qoladi.
  const hadDialog = useRef(false);
  useEffect(() => {
    if (dialog !== null) {
      hadDialog.current = true;
      return;
    }
    if (hadDialog.current && document.activeElement === document.body) (ctaRef.current ?? titleRef.current)?.focus();
    hadDialog.current = false;
  }, [dialog]);

  useEffect(() => {
    const id = ++request.current;
    fetchDailyLimit()
      .then((status) => {
        if (id !== request.current) return;
        setData(status);
        setError(null);
      })
      .catch((cause) => {
        if (id !== request.current) return;
        setError(cause instanceof ApiError ? cause.message : "Kunlik limitni yuklab bo‘lmadi.");
      });
  }, [refreshKey, reload]);

  function retry() {
    setError(null);
    setData(null);
    setReload((n) => n + 1);
  }

  const configured = Boolean(data?.configured && data.limit);

  function handleSaved(saved: DailyLimitStatus, created: boolean) {
    request.current++; // yo'ldagi eski GET javobi yangi holatni bosib ketmasin
    setData(saved);
    setDialog(null);
    showToast(created ? "Kunlik limit o‘rnatildi" : "Kunlik limit saqlandi", "success");
  }

  function handleDeleted() {
    setData((prev) => prev && { ...prev, configured: false, id: null, limit: null, remaining: null, percent: null, status: "NONE", version: null, updatedAt: null });
    setDialog(null);
    showToast("Kunlik limit olib tashlandi", "success");
    setReload((n) => n + 1);
  }

  return (
    <section className={className} aria-labelledby="daily-limit-title" aria-busy={!data && !error}>
      <div className={styles.head}>
        <h2 className={styles.title} id="daily-limit-title" ref={titleRef} tabIndex={-1}>Kunlik limit</h2>
        {configured && !error && (
          <MenuButton
            className={styles.menu}
            label="Kunlik limit amallari"
            items={[
              { id: "edit", label: "Tahrirlash", onSelect: () => setDialog("edit") },
              { id: "delete", label: "Limitni olib tashlash", tone: "danger", onSelect: () => setDialog("delete") },
            ]}
          />
        )}
      </div>

      {error ? (
        <EmptyState
          compact
          tone="error"
          headingLevel={3}
          title="Kunlik limit yuklanmadi"
          description={error}
          action={<Button variant="secondary" onClick={retry}>Qayta urinish</Button>}
        />
      ) : !data ? (
        <div className={styles.loading} role="status">
          <span className={styles.srOnly}>Kunlik limit yuklanmoqda…</span>
          <Skeleton width="70%" height={24} />
          <Skeleton height={12} radius="var(--radius-pill)" />
        </div>
      ) : configured ? (
        <LimitProgress status={data} />
      ) : (
        <div className={styles.none}>
          <p className={styles.noneTitle}>Kunlik limit o‘rnatilmagan</p>
          <p className={styles.noneText}>
            Bugun {formatMoney(data.spent, data.currency)} sarflandi. Limit qo‘ysangiz, kunlik xarajatni shu yerda kuzatasiz.
          </p>
          <Button ref={ctaRef} variant="secondary" className={styles.noneCta} onClick={() => setDialog("edit")}>Limit o‘rnatish</Button>
        </div>
      )}
      {dialog === "edit" && data && (
        <DailyLimitEditor
          status={data}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
          onStatusLoaded={(latest) => {
            request.current++;
            setData(latest);
          }}
        />
      )}
      {dialog === "delete" && <DailyLimitDeleteDialog onClose={() => setDialog(null)} onDeleted={handleDeleted} />}
    </section>
  );
}

function LimitProgress({ status }: { status: DailyLimitStatus }) {
  const limit = status.limit ?? "0";
  const danger = status.status === "REACHED" || status.status === "OVER";
  const message = statusMessage(status.status, status.remaining, status.currency);
  const value = progressValue(status.percent);
  return (
    <>
      <div className={styles.row}>
        <p className={styles.amounts}>
          <span className={styles.spent}><Money amount={status.spent} currency={status.currency} /></span>
          <span className={styles.of}>sarflandi / <Money amount={limit} currency={status.currency} /></span>
        </p>
        <span className={`${styles.percent} ${danger ? styles.percentDanger : ""}`}>{percentLabel(status.percent)}</span>
      </div>
      <div
        className={`${styles.track} ${danger ? styles.trackDanger : ""}`}
        role="progressbar"
        aria-label="Kunlik limit sarfi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={progressValueText(status.spent, limit, status.percent, status.currency)}
      >
        <div className={`${styles.fill} ${danger ? styles.fillDanger : ""}`} style={{ width: `${value}%` }} />
      </div>
      <p className={`${styles.message} ${message.tone === "warning" ? styles.warning : message.tone === "danger" ? styles.danger : ""}`} aria-live="polite">
        {message.text && (
          <>
            {message.tone === "warning" ? <WarningIcon /> : <AlertIcon />}
            <span>{message.text}</span>
          </>
        )}
      </p>
    </>
  );
}

/** Summa guruhlari bo'linmas (NBSP); juda uzun summa faqat guruhlar orasida qatorga o'tadi. */
function Money({ amount, currency }: { amount: string; currency: string }) {
  const parts = formatMoney(amount, currency).split("\u00A0");
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <wbr />}
          {part}
          {index < parts.length - 1 && "\u00A0"}
        </Fragment>
      ))}
    </>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}
