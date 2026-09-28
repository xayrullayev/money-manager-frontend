import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Button } from "../../shared/ui/Button";
import { ApiError } from "../../shared/api/client";
import { listAccounts, type Account } from "../../shared/api/accounts";
import { fetchCashflow, type Cashflow, type CashflowRange } from "../../shared/api/dashboard";
import { formatMoney } from "../../shared/lib/money";
import { compactAmount, niceCeil } from "../../shared/lib/chartScale";
import { UZ_MONTHS } from "../../shared/lib/uzDate";
import styles from "./CashflowCard.module.css";

const RANGE_OPTIONS: { value: CashflowRange; label: string }[] = [
  { value: "THIS_YEAR", label: "Shu yil" },
  { value: "LAST_YEAR", label: "O‘tgan yil" },
  { value: "LAST_12_MONTHS", label: "Oxirgi 12 oy" },
];
const SHORT_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

/* Grafik geometriyasi (px). Kenglik konteynerdan o'lchanadi — matn cho'zilmaydi. */
const HEIGHT = 280;
const PAD = { top: 12, right: 8, bottom: 32, left: 56 };
const PAD_LEFT_COMPACT = 44; // <480px: o'q yorliqlari uchun kamroq joy
const TOOLTIP_W = 240; // joylashtirish uchun taxminiy kenglik; haqiqiy kenglik — max-content
const BAR_MAX = 40;
const BASELINE_GAP = 1; // nol chizig'ida daromad va xarajat orasida 2px surface bo'shliq
const RADIUS = 4;

interface Props {
  balanceHidden: boolean;
  /** Operatsiya qo'shilganda qoldiqni yangilash uchun */
  reloadToken: number;
}

/**
 * Bosh sahifa "Pul oqimi" (Figma: Cashflow) — oylar bo'yicha daromad (yuqoriga)
 * va xarajat (pastga) diverging bar grafigi. Ma'lumot `GET /dashboard/cashflow`;
 * backend hozircha oylik summalarni soxta beradi (`dataSource: "MOCK"`) — buni
 * foydalanuvchiga "Namuna ma'lumot" belgisi bilan ochiq aytamiz.
 */
export function CashflowCard({ balanceHidden, reloadToken }: Props) {
  const titleId = useId();
  const [range, setRange] = useState<CashflowRange>("THIS_YEAR");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [data, setData] = useState<Cashflow | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    listAccounts().then((list) => { if (active) setAccounts(list); }).catch(() => { /* filtrsiz ham ishlaydi */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Filtr almashganda eski grafik xira holda qoladi — layout "sakramaydi".
    setStatus((prev) => (prev === "ready" ? "ready" : "loading"));
    setRefreshing(true);
    fetchCashflow({ range, accountId: accountId || undefined }, controller.signal)
      .then((result) => { setData(result); setStatus("ready"); setRefreshing(false); })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setRefreshing(false);
        setError(cause instanceof ApiError ? cause.message : "Pul oqimi ma’lumotini yuklab bo‘lmadi.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [range, accountId, retry, reloadToken]);

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.head}>
        <h2 className={styles.title} id={titleId}>
          Pul oqimi
          {data?.dataSource === "MOCK" && (
            <span className={styles.mockBadge} title="Oylik summalar hozircha backend tomonidan generatsiya qilingan namuna ma’lumot">
              Namuna ma’lumot
            </span>
          )}
        </h2>
        <div className={styles.filters}>
          {accounts.length > 1 && (
            <select className={styles.select} value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Hisob filtri">
              <option value="">Barcha hisoblar</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <select className={styles.select} value={range} onChange={(e) => setRange(e.target.value as CashflowRange)} aria-label="Pul oqimi davri">
            {RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {status === "loading" && <div className={styles.skeleton} role="status" aria-label="Pul oqimi yuklanmoqda" />}
      {status === "error" && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <Button variant="secondary" onClick={() => setRetry((x) => x + 1)}>Qayta urinish</Button>
        </div>
      )}
      {status === "ready" && data && (
        <div className={refreshing ? styles.refreshing : undefined} aria-busy={refreshing}>
          <CashflowBody data={data} balanceHidden={balanceHidden} />
        </div>
      )}
    </section>
  );
}

function CashflowBody({ data, balanceHidden }: { data: Cashflow; balanceHidden: boolean }) {
  const allZero = data.months.every((m) => Number(m.income) === 0 && Number(m.expense) === 0);
  return (
    <>
      <div className={styles.summaryRow}>
        <div>
          <span className={styles.balanceLabel}>Jami qoldiq</span>
          <span className={styles.balanceValue}>{balanceHidden ? "•••• •••" : formatMoney(data.totalBalance, data.currency)}</span>
        </div>
        <ul className={styles.legend} aria-label="Grafik belgilari">
          <li><span className={`${styles.swatch} ${styles.swatchIncome}`} aria-hidden="true" />Daromad</li>
          <li><span className={`${styles.swatch} ${styles.swatchExpense}`} aria-hidden="true" />Xarajat</li>
        </ul>
      </div>
      {allZero ? (
        <p className={styles.empty}>Bu davr uchun daromad yoki xarajat yo‘q.</p>
      ) : (
        <CashflowChart data={data} hidden={balanceHidden} />
      )}
      <table className="sr-only">
        <caption>Oylar bo‘yicha daromad va xarajat, {data.currency}</caption>
        <thead><tr><th scope="col">Oy</th><th scope="col">Daromad</th><th scope="col">Xarajat</th><th scope="col">Sof</th></tr></thead>
        <tbody>
          {data.months.filter((m) => !m.future).map((m) => (
            <tr key={m.month}>
              <th scope="row">{monthLong(m.month)}</th>
              <td>{formatMoney(m.income, data.currency)}</td>
              <td>{formatMoney(m.expense, data.currency)}</td>
              <td>{formatMoney(m.net, data.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CashflowChart({ data, hidden }: { data: Cashflow; hidden: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapRef);
  const [active, setActive] = useState<number | null>(null);

  const months = data.months;
  const scaleMax = useMemo(
    () => niceCeil(Math.max(...months.map((m) => Math.max(Number(m.income), Number(m.expense))))),
    [months],
  );

  const padLeft = width < 480 ? PAD_LEFT_COMPACT : PAD.left;
  const plotW = Math.max(0, width - padLeft - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const zeroY = PAD.top + plotH / 2;
  const half = plotH / 2 - BASELINE_GAP;
  const slot = plotW / months.length;
  const barW = Math.max(6, Math.min(BAR_MAX, slot * 0.6));
  // Tor ekranda (slot < 30px) 3 harfli yorliqlar to'qnashadi — har ikkinchi oy + aktiv oy ko'rsatiladi.
  const sparseLabels = slot < 30;
  const showMonthLabel = (i: number) => {
    if (!sparseLabels) return true;
    if (active !== null && active % 2 === 1) return i === active || (i % 2 === 0 && Math.abs(i - active) > 1);
    return i % 2 === 0;
  };
  const ticks = [scaleMax, scaleMax / 2, 0, -scaleMax / 2, -scaleMax];
  const yOf = (v: number) => zeroY - (v / scaleMax) * (plotH / 2);

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const last = months.length - 1;
    const map: Record<string, number> = {
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      ArrowLeft: Math.max(0, (active ?? months.length) - 1),
      Home: 0,
      End: last,
    };
    if (event.key in map) { event.preventDefault(); setActive(map[event.key]); }
    if (event.key === "Escape") setActive(null);
  }

  const activeMonth = active === null ? null : months[active];
  // Tooltip aktiv ustunning YONIDA (chap yarmida — o'ngda, o'ng yarmida — chapda), grafik ichida:
  // ustunni ham, karta sarlavhasidagi filtrlarni ham yopmaydi.
  const tooltipLeft = (() => {
    if (active === null) return 0;
    const cx = padLeft + slot * (active + 0.5);
    const right = cx + barW / 2 + 12;
    const left = cx - barW / 2 - 12 - TOOLTIP_W;
    const preferRight = active < months.length / 2;
    const x = preferRight ? (right + TOOLTIP_W <= width ? right : left) : (left >= 0 ? left : right);
    return Math.min(Math.max(0, x), Math.max(0, width - TOOLTIP_W));
  })();

  return (
    <div className={styles.chartWrap} ref={wrapRef} onMouseLeave={() => setActive(null)}>
      {width > 0 && (
        <svg
          className={styles.chart}
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Pul oqimi grafigi: ${months.length} oy. Oylar orasida strelka tugmalari bilan yuring.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((a) => a ?? lastPastIndex(months))}
          onBlur={() => setActive(null)}
        >
          {/* Recessive grid + o'q yorliqlari */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padLeft} x2={width - PAD.right} y1={yOf(t)} y2={yOf(t)}
                className={t === 0 ? styles.zeroLine : styles.gridLine} />
              <text x={padLeft - 8} y={yOf(t)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">
                {hidden && t !== 0 ? "•••" : compactAmount(t)}
              </text>
            </g>
          ))}

          {months.map((m, i) => {
            const cx = padLeft + slot * (i + 0.5);
            const x = cx - barW / 2;
            const incomeH = (Number(m.income) / scaleMax) * half;
            const expenseH = (Number(m.expense) / scaleMax) * half;
            const isActive = active === i;
            return (
              <g key={m.month}>
                {isActive && !m.future && (
                  <rect className={styles.halo} x={x - 6} y={zeroY - incomeH - BASELINE_GAP - 6}
                    width={barW + 12} height={incomeH + expenseH + BASELINE_GAP * 2 + 12} rx={10} />
                )}
                {incomeH > 0 && <path className={styles.barIncome} d={roundedBar(x, zeroY - BASELINE_GAP, barW, incomeH, "up")} />}
                {expenseH > 0 && <path className={styles.barExpense} d={roundedBar(x, zeroY + BASELINE_GAP, barW, expenseH, "down")} />}
                {showMonthLabel(i) && <text x={cx} y={HEIGHT - 8} textAnchor="middle"
                  className={`${styles.monthLabel} ${m.future ? styles.monthFuture : ""} ${isActive ? styles.monthActive : ""}`}>
                  {SHORT_MONTHS[Number(m.month.slice(5, 7)) - 1]}
                </text>}
                {/* Hit-target: butun ustun balandligi, belgidan kattaroq */}
                <rect x={padLeft + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent"
                  onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} />
              </g>
            );
          })}
        </svg>
      )}

      {activeMonth && (
        <div className={styles.tooltip} style={{ left: tooltipLeft, top: PAD.top, maxWidth: TOOLTIP_W }} role="status" aria-live="polite">
          <span className={styles.tooltipTitle}>{monthLong(activeMonth.month)}</span>
          {activeMonth.future ? (
            <span className={styles.tooltipMuted}>Hali boshlanmagan oy</span>
          ) : (
            <dl className={styles.tooltipRows}>
              <dt><span className={`${styles.swatch} ${styles.swatchIncome}`} aria-hidden="true" />Daromad</dt>
              <dd>{hidden ? "••••" : formatMoney(activeMonth.income, data.currency)}</dd>
              <dt><span className={`${styles.swatch} ${styles.swatchExpense}`} aria-hidden="true" />Xarajat</dt>
              <dd>{hidden ? "••••" : formatMoney(activeMonth.expense, data.currency)}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Yordamchilar --- */

/** Faqat uchi (data-end) yumaloq, baseline tomoni to'g'ri burchakli ustun. */
function roundedBar(x: number, baseY: number, w: number, h: number, dir: "up" | "down"): string {
  const r = Math.min(RADIUS, h, w / 2);
  if (dir === "up") {
    const top = baseY - h;
    return `M${x},${baseY} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${baseY} Z`;
  }
  const bottom = baseY + h;
  return `M${x},${baseY} V${bottom - r} Q${x},${bottom} ${x + r},${bottom} H${x + w - r} Q${x + w},${bottom} ${x + w},${bottom - r} V${baseY} Z`;
}

function monthLong(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${UZ_MONTHS[m - 1] ?? ym} ${y}`;
}

function lastPastIndex(months: Cashflow["months"]): number {
  for (let i = months.length - 1; i >= 0; i--) if (!months[i].future) return i;
  return 0;
}

function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
