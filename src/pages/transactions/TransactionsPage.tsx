import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteTransaction, listTransactions, type Transaction } from "../../shared/api/transactions";
import { reportSummary, type ReportSummaryParams, type Summary } from "../../shared/api/reports";
import { listAccounts, type Account } from "../../shared/api/accounts";
import { listCategories, type Category } from "../../shared/api/categories";
import { ApiError } from "../../shared/api/client";
import { Button, Dialog, Input, Select } from "../../shared/ui";
import { EMPTY_FILTERS, parseFilters, filtersToSearchParams, toQuery, toSummaryQuery, countActiveFilters, removeFilter, SEARCH_MAX_LENGTH, type TransactionFilters } from "../../shared/lib/transactionFilters";
import { groupByDate } from "../../shared/lib/date";
import { mergePage } from "../../shared/lib/transactionList";
import { formatMoney, formatSignedMoney } from "../../shared/lib/money";
import { UZ_MONTHS } from "../../shared/lib/uzDate";
import styles from "./TransactionsPage.module.css";

import { AddTransactionDialog } from "../dashboard/AddTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { useToast } from "../../shared/ui/Toast";
import { registerLogoutHook } from "../../shared/lib/sessionCleanup";

const TYPES = { INCOME: "Daromad", EXPENSE: "Xarajat", TRANSFER: "O‘tkazma" };
function dateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${UZ_MONTHS[month - 1]?.toLowerCase()} ${year}`;
}
function accountLabel(row: Transaction) {
  return row.type === "TRANSFER" ? `${row.fromAccountName ?? "—"} → ${row.toAccountName ?? "—"}` : row.accountName;
}
function amountLabel(row: Transaction) {
  return (row.type === "TRANSFER" ? formatMoney(row.amount, row.currency) : formatSignedMoney(row.amount, row.currency, row.type)).replace(/\u00a0/g, " ");
}
function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Ma’lumot yuklanmadi. Qayta urinib ko‘ring.";
}

export function TransactionsPage() {
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem("mm.balanceHidden") === "1"; } catch { return false; } });
  function toggleHidden() {
    const next = !hidden; setHidden(next);
    try { localStorage.setItem("mm.balanceHidden", next ? "1" : "0"); } catch { /* The preference still works in memory. */ }
  }
  const displayAmount = (row: Transaction) => hidden ? "••••••" : amountLabel(row);
  const [params, setParams] = useSearchParams();
  const filters = parseFilters(params);
  const queryKey = filtersToSearchParams(filters).toString();
  const [draft, setDraft] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionsError, setOptionsError] = useState("");
  const [optionsReady, setOptionsReady] = useState(false);
  const [optionsRetry, setOptionsRetry] = useState(0);
  const [retry, setRetry] = useState(0);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [form, setForm] = useState<{ transaction?: Transaction } | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const pendingDeletes = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState(new Set<string>());
  const { showToast } = useToast();
  const generation = useRef(0);
  const moreLock = useRef(false);
  const currentQuery = useRef(queryKey);
  useLayoutEffect(() => { currentQuery.current = queryKey; }, [queryKey]);

  useEffect(() => {
    clearTimeout(timer.current);
    setDraft(parseFilters(new URLSearchParams(queryKey)).search);
    return () => clearTimeout(timer.current);
  }, [queryKey]);

  useEffect(() => {
    let active = true;
    setOptionsError("");
    setOptionsReady(false);
    Promise.all([listAccounts({ includeArchived: true }), listCategories({ includeArchived: true })])
      .then(([a, c]) => { if (active) { setAccounts(a); setCategories(c); setOptionsReady(true); } })
      .catch(cause => { if (active) setOptionsError(errorMessage(cause)); });
    return () => { active = false; };
  }, [optionsRetry]);

  useEffect(() => {
    const request = ++generation.current;
    setStatus("loading"); setError(""); setMoreError(""); setRows([]); setCursor(undefined);
    setLoadingMore(false); moreLock.current = false; setSelected(null);
    listTransactions({ ...toQuery(parseFilters(new URLSearchParams(queryKey))), limit: 20 })
      .then(result => {
        if (generation.current !== request || currentQuery.current !== queryKey) return;
        setRows(result.items); setCursor(result.nextCursor); setStatus("ready");
      })
      .catch(cause => {
        if (generation.current !== request || currentQuery.current !== queryKey) return;
        setError(errorMessage(cause)); setStatus("error");
      });
    return () => { generation.current = request + 1; };
  }, [queryKey, retry]);

  function saved() {
    setForm(null);
    setSelected(null);
    setRetry(value => value + 1);
    showToast("Operatsiya saqlandi", "success");
  }

  function confirmDelete() {
    if (!deleting || pendingDeletes.current.has(deleting.id)) return;
    const transaction = deleting;
    setDeleting(null);
    setSelected(null);
    pendingDeletes.current.add(transaction.id);
    setPendingIds(new Set(pendingDeletes.current));
    let cancelled = false;
    let request: Promise<void> | undefined;
    let unregister = () => {};
    const commit = () => {
      if (cancelled) return Promise.resolve();
      return request ??= (async () => {
        try {
          await deleteTransaction(transaction.id, transaction.version);
          showToast("Operatsiya o‘chirildi", "success");
        } catch (cause) {
          showToast(errorMessage(cause), "error", 8000);
        } finally {
          pendingDeletes.current.delete(transaction.id);
          setPendingIds(new Set(pendingDeletes.current));
          unregister();
          setRetry(value => value + 1);
        }
      })();
    };
    unregister = registerLogoutHook(commit);
    showToast("Operatsiya 6 soniyadan so‘ng o‘chiriladi", "info", 6000, {
      action: { label: "Bekor qilish", onClick: () => {
        if (request) return;
        cancelled = true;
        pendingDeletes.current.delete(transaction.id);
          setPendingIds(new Set(pendingDeletes.current));
        unregister();
        showToast("O‘chirish bekor qilindi", "info");
      } },
      onDismiss: reason => { if (reason !== "action") void commit(); },
    });
  }

  function change(next: TransactionFilters) {
    clearTimeout(timer.current);
    setParams(filtersToSearchParams(next));
  }
  function search(value: string) {
    setDraft(value); clearTimeout(timer.current);
    timer.current = setTimeout(() => setParams(filtersToSearchParams({ ...filters, search: value })), 300);
  }
  async function loadMore() {
    if (!cursor || moreLock.current) return;
    const request = generation.current;
    moreLock.current = true; setLoadingMore(true); setMoreError("");
    try {
      const result = await listTransactions({ ...toQuery(filters), cursor, limit: 20 });
      if (request !== generation.current || currentQuery.current !== queryKey) return;
      setRows(previous => mergePage(previous, result.items)); setCursor(result.nextCursor);
    } catch (cause) {
      if (request === generation.current && currentQuery.current === queryKey) setMoreError(errorMessage(cause));
    } finally {
      if (request === generation.current && currentQuery.current === queryKey) { moreLock.current = false; setLoadingMore(false); }
    }
  }
  const chips: {key: "search" | "type" | "accountId" | "categoryId" | "period"; label: string}[] = [];
  if (filters.search) chips.push({key:"search", label:`Qidiruv: ${filters.search}`});
  if (filters.type) chips.push({key:"type", label:TYPES[filters.type]});
  if (filters.accountId) chips.push({key:"accountId", label:accounts.find(a => a.id === filters.accountId)?.name ?? "Tanlangan hisob"});
  if (filters.categoryId) chips.push({key:"categoryId", label:categories.find(c => c.id === filters.categoryId)?.name ?? "Tanlangan kategoriya"});
  if (filters.from || filters.to) chips.push({key:"period",label:`${filters.from ? dateLabel(filters.from) : "Boshidan"} — ${filters.to ? dateLabel(filters.to) : "Hozirgacha"}`});

  return <div className={styles.page}>
    <header><h1>Operatsiyalar</h1><p>Daromad, xarajat va o‘tkazmalar tarixi.</p><div className={styles.headerActions}><Button onClick={() => setForm({})}>Operatsiya qo‘shish</Button><Button variant="secondary" onClick={toggleHidden} aria-pressed={hidden}>{hidden ? "Summalarni ko‘rsatish" : "Summalarni yashirish"}</Button></div></header>
    <section className={styles.filters} aria-label="Operatsiya filtrlari">
      <div className={styles.search}><Input label="Izoh bo‘yicha qidirish" type="search" value={draft} onChange={search} maxLength={SEARCH_MAX_LENGTH} placeholder="Masalan, bozor yoki taksi" /></div>
      <Select label="Operatsiya turi" value={filters.type} onChange={value => change({...filters, type:value as TransactionFilters["type"], categoryId:""})} options={[{value:"",label:"Barcha turlar"}, ...Object.entries(TYPES).map(([value,label]) => ({value,label}))]} />
      <Select label="Hisob" value={filters.accountId} disabled={!optionsReady} onChange={value => change({...filters,accountId:value})} options={[{value:"",label:"Barcha hisoblar"}, ...accounts.map(a => ({value:a.id,label:`${a.name}${a.archived ? " (arxiv)" : ""}`}))]} />
      <Select label="Kategoriya" value={filters.categoryId} disabled={!optionsReady || filters.type === "TRANSFER"} onChange={value => change({...filters,categoryId:value})} options={[{value:"",label:"Barcha kategoriyalar"}, ...categories.filter(c => !filters.type || c.type === filters.type).map(c => ({value:c.id,label:`${c.name}${c.archived ? " (arxiv)" : ""}`}))]} />
      <Input label="Boshlanish sanasi" type="date" value={filters.from} max={filters.to || undefined} onChange={value => change({...filters,from:value})} />
      <Input label="Tugash sanasi" type="date" value={filters.to} min={filters.from || undefined} onChange={value => change({...filters,to:value})} />
      {optionsError && <div className={styles.search} role="alert"><p>{optionsError}</p><Button variant="secondary" onClick={() => setOptionsRetry(x => x+1)}>Filtrlarni qayta yuklash</Button></div>}
    </section>
    {chips.length > 0 && <div className={styles.chips} aria-label="Faol filtrlar">{chips.map(chip => <button key={chip.key} onClick={() => change(removeFilter(filters,chip.key))} aria-label={`${chip.label} filtrini olib tashlash`}>{chip.label} ×</button>)}<Button variant="ghost" onClick={() => change({...EMPTY_FILTERS})}>Barchasini tozalash</Button></div>}
    <p className={styles.hint}>O‘tkazmalar daromad va xarajat yig‘indisiga kirmaydi.</p>
    <FilteredSummary key={`${queryKey}:${retry}`} filters={filters} hidden={hidden} />
    {status === "loading" && <div className={styles.state} role="status"><p>Operatsiyalar yuklanmoqda…</p>{[0,1,2].map(i => <div className={styles.skeleton} key={i} aria-hidden="true" />)}</div>}
    {status === "error" && <div className={styles.state} role="alert"><h2>Operatsiyalar yuklanmadi</h2><p>{error}</p><Button variant="secondary" onClick={() => setRetry(x => x+1)}>Qayta urinish</Button></div>}
    {status === "ready" && <>
      <p className={styles.hint} aria-live="polite">{rows.length} ta operatsiya ko‘rsatilmoqda{cursor ? " · Davomi bor" : ""}</p>
      {rows.length === 0 ? <div className={styles.state}><h2>{countActiveFilters(filters) ? "Mos operatsiya topilmadi" : "Hali operatsiya yo‘q"}</h2><p>{countActiveFilters(filters) ? "Qidiruv yoki filtrlarni o‘zgartirib ko‘ring." : "Birinchi daromad yoki xarajatingizni kiriting."}</p>{countActiveFilters(filters) > 0 && <Button variant="secondary" onClick={() => change({...EMPTY_FILTERS})}>Filtrlarni tozalash</Button>}</div> : <>
        <table className={styles.table}><caption className={styles.srOnly}>Operatsiyalar tarixi</caption><thead><tr><th scope="col">Sana</th><th scope="col">Operatsiya</th><th scope="col">Hisob</th><th scope="col">Summa</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{dateLabel(row.transactionDate)}</td><td><button className={styles.detailButton} onClick={() => setSelected(row)}>{row.categoryName ?? TYPES[row.type]}</button><small>{TYPES[row.type]}</small>{row.note && <span className={styles.note}>{row.note}</span>}</td><td>{accountLabel(row)}</td><td className={styles[row.type]}>{displayAmount(row)}</td></tr>)}</tbody></table>
        <div className={styles.mobile}>{groupByDate(rows).map(group => <section key={group.date}><h2>{dateLabel(group.date)}</h2>{group.items.map(row => <button className={styles.mobileRow} key={row.id} onClick={() => setSelected(row)}><span><strong>{row.categoryName ?? TYPES[row.type]}</strong><small>{TYPES[row.type]} · {accountLabel(row)}</small>{row.note && <span className={styles.note}>{row.note}</span>}</span><strong className={styles[row.type]}>{displayAmount(row)}</strong></button>)}</section>)}</div>
      </>}
      {moreError && <p role="alert">{moreError}</p>}
      {cursor && <Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>{moreError ? "Qayta urinish" : "Yana yuklash"}</Button>}
    </>}
    {selected && <Dialog title="Operatsiya tafsilotlari" onClose={() => setSelected(null)}><dl className={styles.details}><dt>Tur</dt><dd>{TYPES[selected.type]}</dd><dt>Summa</dt><dd className={styles[selected.type]}>{displayAmount(selected)}</dd><dt>Sana</dt><dd>{dateLabel(selected.transactionDate)}</dd><dt>Hisob</dt><dd>{accountLabel(selected)}</dd>{selected.categoryName && <><dt>Kategoriya</dt><dd>{selected.categoryName}</dd></>}<dt>Izoh</dt><dd>{selected.note || "Izoh kiritilmagan"}</dd></dl><div className={styles.dialogActions}><Button disabled={pendingIds.has(selected.id)} onClick={() => { setForm({ transaction: selected }); setSelected(null); }}>Tahrirlash</Button><Button variant="secondary" className={styles.dangerButton} disabled={pendingIds.has(selected.id)} onClick={() => { setDeleting(selected); setSelected(null); }}>O‘chirish</Button></div></Dialog>}
    {form && <AddTransactionDialog transaction={form.transaction} onClose={() => setForm(null)} onSaved={saved} />}
    {deleting && <DeleteTransactionDialog transaction={deleting} hidden={hidden} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
  </div>;
}

function FilteredSummary({ filters, hidden }: { filters: TransactionFilters; hidden: boolean }) {
  const plan = toSummaryQuery(filters);
  if (plan.state === "period_required") return <section className={styles.summaryNotice} aria-label="Filtrlangan jami"><p>Filtrlangan daromad va xarajat jamini ko‘rish uchun boshlanish va tugash sanasini tanlang. Bir davr ko‘pi bilan 366 kun.</p></section>;
  if (plan.state === "transfer_excluded") return <section className={styles.summaryNotice} aria-label="Filtrlangan jami"><p>O‘tkazmalar daromad va xarajat jamiga kirmaydi.</p></section>;
  return <SummaryResult {...plan.params} hidden={hidden} />;
}

function SummaryResult({ from, to, type, accountId, categoryId, search, hidden }: ReportSummaryParams & { hidden: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ status: "loading" | "ready" | "error"; summary?: Summary; error?: string }>({ status: "loading" });
  useEffect(() => {
    let active = true;
    reportSummary({ from, to, type, accountId, categoryId, search })
      .then(summary => { if (active) setResult({ status: "ready", summary }); })
      .catch(cause => { if (active) setResult({ status: "error", error: errorMessage(cause) }); });
    return () => { active = false; };
  }, [from, to, type, accountId, categoryId, search, attempt]);
  if (result.status === "loading") return <section className={styles.summaryNotice} role="status"><p>Filtrlangan jami yuklanmoqda…</p></section>;
  if (result.status === "error") return <section className={styles.summaryNotice} role="alert"><p>{result.error}</p><Button variant="secondary" onClick={() => { setResult({ status: "loading" }); setAttempt(value => value + 1); }}>Jamni qayta yuklash</Button></section>;
  const summary = result.summary!;
  const money = (value: string) => hidden ? "••••••" : formatMoney(value, summary.currency).replace(/\u00a0/g, " ");
  return <section className={styles.summaryGrid} aria-label="Filtrlangan jami">
    <div><span>Daromad</span><strong className={styles.INCOME}>{money(summary.income)}</strong></div>
    <div><span>Xarajat</span><strong className={styles.EXPENSE}>{money(summary.expense)}</strong></div>
    <div><span>Sof farq</span><strong>{money(summary.net)}</strong></div>
  </section>;
}
