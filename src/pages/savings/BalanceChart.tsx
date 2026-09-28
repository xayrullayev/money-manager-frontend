import { useEffect, useId, useState } from "react";
import {
  fetchSavingBalance,
  type BalanceHistory,
} from "../../shared/api/savings";
import { Button } from "../../shared/ui";
import { formatMoney } from "../../shared/lib/money";
import { uzMonthName } from "../../shared/lib/uzDate";
import { savingError } from "./errors";
import styles from "./SavingPlansPage.module.css";
export function BalanceChart({
  planId,
  year,
  hidden,
}: {
  planId: string;
  year: number;
  hidden: boolean;
}) {
  const [data, setData] = useState<BalanceHistory | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const gradient = useId().replace(/:/g, "");
  // Reset request state when the resource changes; stale responses are ignored.
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect -- reset state for the new request
    setData(null);
    setError("");
    fetchSavingBalance(planId, year, controller.signal)
      .then((v) => {
        if (!controller.signal.aborted) setData(v);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(savingError(e));
      });
    return () => controller.abort();
  }, [planId, year, retry]);
  if (hidden) return <p className={styles.chartHidden}>Balans yashirilgan</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <Button variant="secondary" onClick={() => setRetry((v) => v + 1)}>
          Qayta urinish
        </Button>
      </div>
    );
  if (!data)
    return (
      <div className={styles.skeleton} role="status">
        Grafik yuklanmoqda…
      </div>
    );
  const past = data.months.filter((m) => !m.future && m.balance !== undefined);
  // Number is used only for SVG coordinates; labels retain exact API decimal strings.
  const maximum = Math.max(1, ...past.map((m) => Number(m.balance)));
  const points = data.months.flatMap((m, i) =>
    m.future || m.balance === undefined
      ? []
      : [
          {
            ...m,
            x: 28 + i * 44,
            y: 170 - (Number(m.balance) / maximum) * 135,
          },
        ],
  );
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  return (
    <>
      <svg
        className={styles.chart}
        viewBox="0 0 540 210"
        role="img"
        aria-label={`${year}-yil oylik balans grafigi. Aniq qiymatlar quyidagi ro‘yxatda.`}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity=".2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[35, 80, 125, 170].map((y) => (
          <line
            key={y}
            x1="28"
            x2="512"
            y1={y}
            y2={y}
            stroke="currentColor"
            opacity=".12"
          />
        ))}
        {points.length > 0 && (
          <>
            <path
              d={`${line} L${points.at(-1)!.x},170 L28,170Z`}
              fill={`url(#${gradient})`}
            />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            {points.map((p) => (
              <circle key={p.month} cx={p.x} cy={p.y} r="3" fill="currentColor">
                <title>
                  {p.month}: {formatMoney(p.balance!, data.currency)}
                </title>
              </circle>
            ))}
          </>
        )}
        {data.months.map((m, i) => (
          <text
            key={m.month}
            x={28 + i * 44}
            y="197"
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
          >
            {uzMonthName(i).slice(0, 3)}
          </text>
        ))}
      </svg>
      <details className={styles.chartValues}>
        <summary>Oylik qiymatlarni ko‘rish</summary>
        <dl>
          {data.months.map((m) => (
            <div key={m.month} className={styles.between}>
              <dt>{m.month}</dt>
              <dd>
                {m.future
                  ? "Hali kelmagan"
                  : formatMoney(m.balance ?? "0", data.currency)}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}
