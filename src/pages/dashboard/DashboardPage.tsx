import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/ui/Button";
import { useToast } from "../../shared/ui/Toast";
import { fetchDashboardSummary, type DashboardSummary, type BudgetProgress } from "../../shared/api/dashboard";
import type { Transaction } from "../../shared/api/transactions";
import { ApiError } from "../../shared/api/client";
import { formatMoney, formatSignedMoney } from "../../shared/lib/money";
import { getPeriodDisplayLabel, getShortDateCaption, resolvePeriod, type PeriodPreset } from "../../shared/lib/period";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { CashflowCard } from "./CashflowCard";
import { DailyLimitCard } from "./DailyLimitCard";
import { TotalSavingsBlock } from "./TotalSavingsBlock";
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
 * Design-Migrate-04: Bosh sahifa — Figma "Animated Dashboard" layoutiga moslangan
 * BOY ko'rinish, lekin FAQAT haqiqiy API ma'lumoti bilan (backend o'zgarmaydi):
 * balans hero, kirim/chiqim/sof kartalari, kategoriya donut (budjetlardan),
 * so'nggi operatsiyalar jadvali, kunlik limit (Frontend-05, /daily-limit API). Ma'lumot bo'lmagan
 * maket bloklari (karta raqami/CVV, Saving Plans, Recent Activity) qo'shilmadi — uydirma yo'q.
 * Cashflow grafigi — `CashflowCard` (`GET /dashboard/cashflow`; oylik summalar hozircha MOCK,
 * kartada "Namuna ma'lumot" belgisi bilan).
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

  const periodLabel = period === "last_30_days" ? "Shu davrdagi" : "Shu oydagi";

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
          <section className={styles.topGrid} aria-label="Moliyaviy xulosa">
            <div className={styles.balanceCard}>
              <div className={styles.balanceTop}>
                <span className={styles.balanceBrand} aria-hidden="true"><span className={styles.diamond} /></span>
                <ContactlessIcon />
              </div>
              <span className={styles.balanceLabel}>Jami qoldiq</span>
              <span className={styles.balanceValue} aria-live="polite">
                {balanceHidden ? "•••• •••" : formatMoney(summary.totalBalance, summary.currency)}
              </span>
              <div className={styles.balanceFoot}>
                <span className={styles.balanceMeta}>{summary.accountsCount} ta hisob</span>
                <button type="button" className={styles.balanceToggle} onClick={toggleBalanceHidden} aria-pressed={balanceHidden}>
                  {balanceHidden ? "Ko‘rsatish" : "Yashirish"}
                </button>
              </div>
            </div>

            <StatCard variant="income" label={`${periodLabel} daromad`} value={formatMoney(summary.income, summary.currency)} />
            <StatCard variant="expense" label={`${periodLabel} xarajat`} value={formatMoney(summary.expense, summary.currency)} />
            <StatCard variant="net" label="Sof oqim" value={formatMoney(summary.net, summary.currency)} />
          </section>

          <Button className={styles.mobileCta} onClick={() => setDialogOpen(true)}>+ Xarajat qo‘shish</Button>

          <TotalSavingsBlock summary={summary.savings} balanceHidden={balanceHidden} />

          <div className={styles.mainGrid}>
            {/* Desktopda yon ustun tepasida, mobil/planshetda asosiy ustundan (Cashflow, So‘nggi operatsiyalar) oldin (grid-area). */}
            <DailyLimitCard className={`${styles.card} ${styles.dailyLimitCard}`} refreshKey={reloadToken} />
            <div className={styles.mainColumn}>
            <CashflowCard balanceHidden={balanceHidden} reloadToken={reloadToken} />
            <section className={`${styles.card} ${styles.transactionsCard}`} aria-labelledby="transactions-title">
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle} id="transactions-title">So‘nggi operatsiyalar</h2>
                <button type="button" className={styles.cardLink} onClick={() => navigate("/transactions")}>Barchasi →</button>
              </div>
              {summary.recentTransactions.length === 0 ? (
                <p className={styles.emptyState}>Hali operatsiya yo‘q. Birinchi xarajatingizni qo‘shing.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.txTable}>
                    <thead>
                      <tr>
                        <th scope="col">Operatsiya</th>
                        <th scope="col">Sana</th>
                        <th scope="col" className={styles.right}>Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>
                            <span className={styles.txTitle}>{txTitle(tx)}</span>
                            <span className={styles.txSub}>{txSubtitle(tx)}</span>
                          </td>
                          <td className={styles.txDate}>{formatRowDate(tx.transactionDate)}</td>
                          <td className={`${styles.right} ${styles.txAmount} ${amountClass(tx.type)}`}>{txAmount(tx)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            </div>

            <div className={styles.sideColumn}>
              <section className={`${styles.card} ${styles.statisticCard}`} aria-labelledby="statistic-title">
                <h2 className={styles.cardTitle} id="statistic-title">Statistika<span className={styles.cardTitleMeta}> · xarajat kategoriyalari</span></h2>
                <CategoryDonut budgets={summary.budgets} currency={summary.currency} />
              </section>

              <section className={`${styles.card} ${styles.budgetCard}`} aria-labelledby="budget-title">
                <h2 className={styles.cardTitle} id="budget-title">Oylik budjet</h2>
                <BudgetSummary budgets={summary.budgets} currency={summary.currency} />
                <button type="button" className={styles.cardLink} onClick={() => navigate("/budgets")}>Budjetlarni ko‘rish →</button>
              </section>
            </div>
          </div>
          <p className={styles.footerNote}>Barcha qiymatlar {summary.currency}. O‘tkazmalar daromad va xarajat yig‘indisiga kirmaydi.</p>
        </>
      )}
      {dialogOpen && <AddTransactionDialog onClose={() => setDialogOpen(false)} onSaved={handleTransactionCreated} />}
    </div>
  );
}

/* --- Kichik komponentlar --- */

function StatCard({ variant, label, value }: { variant: "income" | "expense" | "net"; label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <span className={`${styles.statChip} ${styles[variant]}`} aria-hidden="true">
        {variant === "income" ? <ArrowDownIcon /> : variant === "expense" ? <ArrowUpIcon /> : <WalletIcon />}
      </span>
      <div className={styles.statText}>
        <span className={`${styles.statValue} ${variant === "income" ? styles.incomeText : variant === "expense" ? styles.expenseText : ""}`}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

function CategoryDonut({ budgets, currency }: { budgets: BudgetProgress[]; currency: string }) {
  const segments = budgets
    .map((b) => ({ name: b.categoryName, token: b.colorToken, value: Number(b.spent) || 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0) {
    return <p className={styles.emptyState}>Xarajat kategoriyalari bo‘yicha ma’lumot yo‘q.</p>;
  }

  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className={styles.donutWrap}>
      <svg className={styles.donut} viewBox="0 0 120 120" role="img" aria-label="Xarajat kategoriyalari ulushi">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-primary-50)" strokeWidth="16" />
        {segments.map((s) => {
          const frac = s.value / total;
          const dash = frac * C;
          const el = (
            <circle
              key={s.name}
              cx="60" cy="60" r={R} fill="none"
              stroke={`var(--category-${s.token})`}
              strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={`${-acc * C}`}
              transform="rotate(-90 60 60)"
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutCaption}>Jami xarajat</span>
        <span className={styles.donutTotal}>{formatMoney(total, currency)}</span>
      </div>
      <ul className={styles.legend}>
        {segments.map((s) => (
          <li key={s.name} className={styles.legendRow}>
            <span className={styles.legendDot} style={{ background: `var(--category-${s.token})` }} aria-hidden="true" />
            <span className={styles.legendName}>{s.name}</span>
            <span className={styles.legendPct}>{Math.round((s.value / total) * 100)}%</span>
            <span className={styles.legendAmount}>{formatMoney(s.value, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BudgetSummary({ budgets, currency }: { budgets: BudgetProgress[]; currency: string }) {
  if (budgets.length === 0) {
    return <p className={styles.emptyState}>Hali budjet belgilanmagan.</p>;
  }
  const totals = budgets.reduce(
    (acc, b) => {
      acc.spent += Number(b.spent) || 0;
      acc.limit += Number(b.limit) || 0;
      return acc;
    },
    { spent: 0, limit: 0 },
  );
  const percent = totals.limit > 0 ? (totals.spent / totals.limit) * 100 : 0;
  const remaining = totals.limit - totals.spent;
  const exceeded = remaining < 0;
  return (
    <>
      <div className={styles.budgetTotal}>{formatMoney(totals.spent, currency)} / {formatMoney(totals.limit, currency)}</div>
      <div className={exceeded ? styles.budgetMetaExceeded : styles.budgetMeta}>
        {Math.round(percent)}% sarflandi • {formatMoney(Math.abs(remaining), currency)} {exceeded ? "oshib ketdi" : "qoldi"}
      </div>
      <div className={styles.progressTrack} role="progressbar"
        aria-valuenow={Math.min(100, Math.max(0, Math.round(percent)))} aria-valuemin={0} aria-valuemax={100}
        aria-valuetext={`${Math.round(percent)}% sarflandi`} aria-label="Umumiy budjet sarfi">
        <div className={`${styles.progressFill} ${exceeded ? styles.progressFillExceeded : ""}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </>
  );
}

/* --- Yordamchilar --- */

function txTitle(tx: Transaction): string {
  if (tx.type === "TRANSFER") return "Hisoblararo o‘tkazma";
  return tx.categoryName ?? (tx.type === "INCOME" ? "Daromad" : "Xarajat");
}
function txSubtitle(tx: Transaction): string {
  if (tx.type === "TRANSFER") return `${tx.fromAccountName ?? ""} → ${tx.toAccountName ?? ""}`;
  return tx.note ? `${tx.note} • ${tx.accountName}` : tx.accountName;
}
function txAmount(tx: Transaction): string {
  if (tx.type === "TRANSFER") return formatMoney(tx.amount, tx.currency);
  return formatSignedMoney(tx.amount, tx.currency, tx.type);
}
function amountClass(type: Transaction["type"]): string {
  return type === "INCOME" ? styles.incomeText : type === "EXPENSE" ? styles.expenseText : styles.transferText;
}
function formatRowDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

/* --- Ikonkalar (inline, dekorativ) --- */

function ContactlessIcon() {
  return (
    <svg className={styles.contactless} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M8 8a6 6 0 0 1 0 8" />
      <path d="M11 6a9 9 0 0 1 0 12" />
      <path d="M14 4a12 12 0 0 1 0 16" />
    </svg>
  );
}
function ArrowDownIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></svg>;
}
function ArrowUpIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></svg>;
}
function WalletIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M16 14h2" /></svg>;
}

function DashboardSkeleton() {
  return (
    <div className={styles.loadingState} aria-busy="true" role="status" aria-label="Bosh sahifa yuklanmoqda">
      <span className="sr-only">Ma’lumotlar yuklanmoqda…</span>
      <div className={styles.topGrid}>{[0, 1, 2, 3].map((item) => <div key={item} className={`${styles.skeleton} ${styles.skeletonSummary}`} />)}</div>
      <div className={styles.mainGrid}><div className={`${styles.skeleton} ${styles.skeletonDetail}`} /><div className={`${styles.skeleton} ${styles.skeletonDetail}`} /></div>
    </div>
  );
}
