import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/ui/Button";
import { useToast } from "../../shared/ui/Toast";
import { fetchDashboardSummary, type DashboardSummary } from "../../shared/api/dashboard";
import { ApiError } from "../../shared/api/client";
import { getPeriodDisplayLabel, getShortDateCaption, resolvePeriod, type PeriodPreset } from "../../shared/lib/period";
import { formatDateGroupLabel, groupByDate } from "../../shared/lib/date";
import { AddTransactionDialog } from "./AddTransactionDialog";
import styles from "./DashboardPage.module.css";

const BALANCE_HIDDEN_KEY = "mm.balanceHidden";
const PERIOD_PRESETS: PeriodPreset[] = ["this_month", "last_month", "last_30_days"];

function readBalanceHiddenPref(): boolean {
  try {
    return localStorage.getItem(BALANCE_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Design-04: Dashboard — moliyaviy holat.
 * Figma (Bosh sahifa, desktop 1440) asosida: sarlavha+CTA, davr filtri,
 * 3 ta xulosa kartasi, qoldiqni yashirish, so'nggi operatsiyalar (sana bo'yicha
 * guruhlangan) va umumiy oylik budjet holati ikki ustunli grid'da.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<PeriodPreset>("this_month");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [balanceHidden, setBalanceHidden] = useState(readBalanceHiddenPref);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const range = useMemo(() => resolvePeriod(period), [period]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchDashboardSummary(range)
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setErrorMessage(error instanceof ApiError ? error.message : "Ma'lumotlarni yuklab bo'lmadi.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, reloadToken]);

  function toggleBalanceHidden() {
    setBalanceHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(BALANCE_HIDDEN_KEY, next ? "1" : "0");
      } catch {
        // localStorage yo'q bo'lsa ham UI davom etadi — faqat pref saqlanmaydi
      }
      return next;
    });
  }

  function handleTransactionCreated() {
    setDialogOpen(false);
    showToast("Operatsiya saqlandi", "success");
    setReloadToken((token) => token + 1);
  }

  const transactionGroups = summary ? groupByDate(summary.recentTransactions) : [];

  const budgetTotals = summary
    ? summary.budgets.reduce(
        (acc, b) => {
          acc.spent += Number(b.spent) || 0;
          acc.limit += Number(b.limit) || 0;
          return acc;
        },
        { spent: 0, limit: 0 },
      )
    : { spent: 0, limit: 0 };
  const budgetPercent = budgetTotals.limit > 0 ? (budgetTotals.spent / budgetTotals.limit) * 100 : 0;
  const budgetRemaining = budgetTotals.limit - budgetTotals.spent;
  const budgetExceeded = budgetRemaining < 0;

  const hideBalanceButton = (
    <Button variant="secondary" className={styles.balanceToggle} onClick={toggleBalanceHidden} aria-pressed={balanceHidden}>
      {balanceHidden ? "Qoldiqni ko‘rsatish" : "Qoldiqni yashirish"}
    </Button>
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Bosh sahifa</h1>
          <p className={styles.pageSubtitle}>Pul oqimingiz bir qarashda. Har bir qaror — aniqroq.</p>
        </div>
        <Button className={styles.desktopCta} onClick={() => setDialogOpen(true)}>+ Xarajat qo‘shish</Button>
      </div>

      <div className={styles.periodRow}>
        <select className={styles.periodSelect} value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodPreset)} aria-label="Davr filtri">
          {PERIOD_PRESETS.map((preset) => <option key={preset} value={preset}>{getPeriodDisplayLabel(preset)}</option>)}
        </select>
        <span className={styles.periodCaption}>Yangilandi • {getShortDateCaption().toLowerCase()}</span>
      </div>

      {status === "loading" && <DashboardSkeleton />}
      {status === "error" && (
        <div className={styles.errorState} role="alert">
          <h2>Ma’lumotlarni yuklab bo‘lmadi</h2>
          <p>{errorMessage}</p>
          <Button variant="secondary" onClick={() => setReloadToken((token) => token + 1)}>Qayta urinish</Button>
        </div>
      )}

      {status === "ready" && summary && (
        <>
          <section className={styles.summaryGrid} aria-label="Moliyaviy xulosa">
            <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
              <span className={styles.summaryLabel}>Jami qoldiq</span>
              <span className={styles.summaryValue} aria-live="polite">
                {balanceHidden ? "•••• •••" : <Amount amount={summary.totalBalance} currency={summary.currency} />}
              </span>
              <span className={styles.summaryMeta}>{summary.currency} · {summary.accountsCount} ta hisob</span>
              <div className={styles.mobileBalanceToggle}>{hideBalanceButton}</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.incomeCard}`}>
              <span className={styles.summaryLabel}><span className={styles.desktopOnly}>{period === "last_30_days" ? "Shu davrdagi" : "Shu oydagi"} </span>daromad</span>
              <span className={`${styles.summaryValue} ${styles.income}`}><Amount amount={summary.income} currency={summary.currency} sign="+" /></span>
              <span className={styles.summaryMeta}>{summary.currency} · barcha hisoblar</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.expenseCard}`}>
              <span className={styles.summaryLabel}><span className={styles.desktopOnly}>{period === "last_30_days" ? "Shu davrdagi" : "Shu oydagi"} </span>xarajat</span>
              <span className={`${styles.summaryValue} ${styles.expense}`}><Amount amount={summary.expense} currency={summary.currency} sign="−" /></span>
              <span className={styles.summaryMeta}>{summary.currency} · o‘tkazmalarsiz</span>
            </div>
          </section>
          <div className={styles.desktopBalanceToggle}>{hideBalanceButton}</div>
          <Button className={styles.mobileCta} onClick={() => setDialogOpen(true)}>+ Xarajat qo‘shish</Button>

          <div className={styles.detailGrid}>
            <section className={`${styles.card} ${styles.transactionsCard}`} aria-labelledby="transactions-title">
              <h2 className={styles.cardTitle} id="transactions-title">So‘nggi operatsiyalar</h2>
              {transactionGroups.length === 0 ? (
                <p className={styles.emptyState}>Hali operatsiya yo‘q. Birinchi xarajatingizni qo‘shing.</p>
              ) : (
                <div className={styles.transactionGroups}>
                  {transactionGroups.map((group) => (
                    <div key={group.date} className={styles.dateGroup}>
                      <div className={styles.dateGroupLabel}>{formatDateGroupLabel(group.date).toLowerCase()}</div>
                      {group.items.map((tx) => (
                        <div key={tx.id} className={styles.transactionRow}>
                          <div className={styles.transactionText}>
                            <div className={styles.transactionTitle}>{tx.type === "TRANSFER" ? "Hisoblararo o‘tkazma" : tx.categoryName}</div>
                            <div className={styles.transactionSubtitle}>
                              {tx.type === "TRANSFER" ? `${tx.fromAccountName} → ${tx.toAccountName}` : tx.note ? `${tx.note} • ${tx.accountName}` : `${tx.type === "INCOME" ? "Daromad" : "Xarajat"} • ${tx.accountName}`}
                            </div>
                          </div>
                          <span className={`${styles.transactionAmount} ${tx.type === "INCOME" ? styles.income : tx.type === "EXPENSE" ? styles.expense : styles.transfer}`}>
                            <Amount amount={tx.amount} currency={tx.currency} sign={tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : undefined} />
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" className={styles.transactionsLink} onClick={() => navigate("/transactions")}>Barcha operatsiyalar →</Button>
            </section>

            <section className={`${styles.card} ${styles.budgetCard}`} aria-labelledby="budget-title">
              <h2 className={styles.cardTitle} id="budget-title">Oylik budjet<span className={styles.mobileOnly}> · {Math.round(budgetPercent)}%</span></h2>
              {summary.budgets.length === 0 ? (
                <p className={styles.emptyState}>Hali budjet belgilanmagan.</p>
              ) : (
                <>
                  <div className={styles.budgetTotal}>{formatAmount(budgetTotals.spent, summary.currency)} / {`${formatAmount(budgetTotals.limit, summary.currency)} ${summary.currency}`}</div>
                  <div className={budgetExceeded ? styles.budgetMetaExceeded : styles.budgetMeta}>
                    <span className={styles.desktopOnly}>{Math.round(budgetPercent)}% sarflandi • </span>
                    {`${formatAmount(Math.abs(budgetRemaining), summary.currency)} ${summary.currency}`} {budgetExceeded ? "oshib ketdi" : "qoldi"}
                  </div>
                  <div className={styles.progressTrack} role="progressbar"
                    aria-valuenow={Math.min(100, Math.max(0, Math.round(budgetPercent)))} aria-valuemin={0} aria-valuemax={100}
                    aria-valuetext={`${Math.round(budgetPercent)}% sarflandi`} aria-label="Umumiy budjet sarfi">
                    <div className={`${styles.progressFill} ${budgetExceeded ? styles.progressFillExceeded : ""}`} style={{ width: `${Math.min(100, Math.max(0, budgetPercent))}%` }} />
                  </div>
                  <ul className={styles.budgetCategoryList}>
                    {summary.budgets.map((budget) => <li key={budget.categoryId} className={styles.budgetCategoryRow}>{budget.categoryName} · {`${formatAmount(budget.spent, summary.currency)} ${summary.currency}`}</li>)}
                  </ul>
                </>
              )}
              <Button variant="secondary" className={styles.budgetLink} disabled title="Budjetlar sahifasi hali tayyor emas">Budjetlarni ko‘rish</Button>
            </section>
          </div>
          <p className={styles.footerNote}>Barcha qiymatlar {summary.currency}. O‘tkazmalar daromad va xarajat yig‘indisiga kirmaydi.</p>
        </>
      )}
      {dialogOpen && <AddTransactionDialog onClose={() => setDialogOpen(false)} onSaved={handleTransactionCreated} />}
    </div>
  );
}

function formatAmount(amount: string | number, currency: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "—";
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: currency === "UZS" ? 0 : 2 }).formatToParts(numeric).map((part) => part.type === "group" ? " " : part.value).join("");
}

function Amount({ amount, currency, sign }: { amount: string | number; currency: string; sign?: string }) {
  return <>{sign && `${sign} `}{formatAmount(sign ? Math.abs(Number(amount)) : amount, currency)}<span className={styles.amountCurrency}> {currency}</span></>;
}

function DashboardSkeleton() {
  return (
    <div className={styles.loadingState} aria-busy="true" role="status" aria-label="Bosh sahifa yuklanmoqda">
      <span className="sr-only">Ma’lumotlar yuklanmoqda…</span>
      <div className={styles.summaryGrid}>{[0, 1, 2].map((item) => <div key={item} className={`${styles.skeleton} ${styles.skeletonSummary}`} />)}</div>
      <div className={styles.detailGrid}><div className={`${styles.skeleton} ${styles.skeletonDetail}`} /><div className={`${styles.skeleton} ${styles.skeletonDetail}`} /></div>
    </div>
  );
}
