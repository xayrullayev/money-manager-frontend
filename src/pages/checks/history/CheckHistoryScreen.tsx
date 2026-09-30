import { Badge, Button, EmptyState, SkeletonList } from "../../../shared/ui";
import type { BadgeTone } from "../../../shared/ui";
import { formatMoney } from "../../../shared/lib/money";
import { useCheckHistory, type UseCheckHistoryOptions } from "./useCheckHistory";
import type { CheckStatus, CheckSummary } from "./checkTypes";
import styles from "./CheckHistoryScreen.module.css";

export interface CheckHistoryScreenProps {
  /** Chek tanlanganda (detalga o'tish) — navigatsiya callback orqali. */
  onSelectCheck?: (checkId: string) => void;
  /** Test uchun hook opsiyalari (inject qilinadigan listFn). */
  historyOptions?: UseCheckHistoryOptions;
}

const STATUS_LABEL: Record<CheckStatus, { label: string; tone: BadgeTone }> = {
  POSTED: { label: "Xarajatga qo'shilgan", tone: "success" },
  IMPORTED: { label: "Import qilingan", tone: "accent" },
  DRAFT: { label: "Qoralama", tone: "neutral" },
};

/**
 * Frontend-CHECK-04 — cheklar tarixi ro'yxati.
 * Sana, do'kon, total, status va pagination. Detalga o'tish callback orqali.
 */
export function CheckHistoryScreen({ onSelectCheck, historyOptions }: CheckHistoryScreenProps) {
  const { phase, items, hasMore, loadingMore, total, loadMore, reload } = useCheckHistory(historyOptions ?? {});

  return (
    <main className={styles.screen} aria-labelledby="check-history-title">
      <header className={styles.header}>
        <h1 id="check-history-title" className={styles.title}>
          Cheklar tarixi
        </h1>
        {phase === "ready" && total > 0 && (
          <p className={styles.subtitle}>{total} ta import qilingan chek</p>
        )}
      </header>

      {phase === "loading" && (
        <div aria-busy="true" aria-label="Yuklanmoqda">
          <SkeletonList rows={4} />
        </div>
      )}

      {phase === "error" && (
        <EmptyState
          tone="error"
          title="Tarixni yuklab bo'lmadi"
          description="Server bilan bog'lanishda xatolik yuz berdi."
          action={
            <Button type="button" onClick={reload}>
              Qayta urinish
            </Button>
          }
        />
      )}

      {phase === "ready" && items.length === 0 && (
        <EmptyState
          title="Hozircha chek yo'q"
          description="Import qilingan cheklar shu yerda ko'rinadi."
        />
      )}

      {phase === "ready" && items.length > 0 && (
        <>
          <ul className={styles.list}>
            {items.map((check) => (
              <li key={check.id}>
                <CheckRow check={check} onSelect={onSelectCheck} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className={styles.loadMore}>
              <Button variant="secondary" type="button" onClick={loadMore} loading={loadingMore}>
                Yana yuklash
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function CheckRow({ check, onSelect }: { check: CheckSummary; onSelect?: (id: string) => void }) {
  const status = STATUS_LABEL[check.status];
  const interactive = Boolean(onSelect);
  return (
    <button
      type="button"
      className={styles.row}
      onClick={interactive ? () => onSelect?.(check.id) : undefined}
      disabled={!interactive}
      aria-label={`${check.merchantName}, ${check.purchasedAt}, ${formatMoney(check.total, check.currency)}`}
    >
      <span className={styles.rowMain}>
        <span className={styles.merchant}>{check.merchantName}</span>
        <span className={styles.meta}>
          {check.purchasedAt} · {check.itemCount} ta mahsulot
        </span>
      </span>
      <span className={styles.rowSide}>
        <span className={styles.amount}>{formatMoney(check.total, check.currency)}</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </span>
    </button>
  );
}
