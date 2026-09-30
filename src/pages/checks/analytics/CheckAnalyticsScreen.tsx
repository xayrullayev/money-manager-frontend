import { Button, EmptyState, Skeleton, Tabs } from "../../../shared/ui";
import { formatMoney } from "../../../shared/lib/money";
import { useCheckAnalytics, type UseCheckAnalyticsOptions } from "./useCheckAnalytics";
import type { AnalyticsMetric, AnalyticsPeriod, CategoryGroup, ProductRank } from "./checkAnalytics";
import styles from "./CheckAnalyticsScreen.module.css";

export interface CheckAnalyticsScreenProps {
  /** Test uchun hook opsiyalari. */
  analyticsOptions?: UseCheckAnalyticsOptions;
}

const CURRENCY = "UZS";

/**
 * Frontend-CHECK-04 — haftalik/oylik chek reytingi.
 * Summa / Xaridlar soni; kategoriya va MXIK bo'yicha guruhlash. Grafik o'rniga
 * matnli ro'yxat (nisbat bar bilan). Faqat import qilingan (posted) cheklar.
 */
export function CheckAnalyticsScreen({ analyticsOptions }: CheckAnalyticsScreenProps) {
  const { phase, period, metric, result, setPeriod, setMetric, reload } = useCheckAnalytics(analyticsOptions ?? {});

  const analytics = result?.analytics;
  const isEmpty = phase === "ready" && analytics != null && analytics.purchaseCount === 0;

  return (
    <div className={styles.screen} aria-labelledby="check-analytics-title">
      <header className={styles.header}>
        <h2 id="check-analytics-title" className={styles.title}>
          Xarid reytingi
        </h2>
        <p className={styles.coverage}>Faqat import qilingan cheklar bo'yicha hisoblanadi.</p>
      </header>

      <Tabs
        ariaLabel="Davr"
        value={period}
        onChange={(v) => setPeriod(v as AnalyticsPeriod)}
        items={[
          { value: "week", label: "Hafta" },
          { value: "month", label: "Oy" },
        ]}
      />

      {phase === "loading" && (
        <div aria-busy="true" aria-label="Yuklanmoqda" className={styles.tiles}>
          <Skeleton height={72} />
          <Skeleton height={72} />
        </div>
      )}

      {phase === "error" && (
        <EmptyState
          tone="error"
          title="Reytingni yuklab bo'lmadi"
          description="Server bilan bog'lanishda xatolik yuz berdi."
          action={
            <Button type="button" onClick={reload}>
              Qayta urinish
            </Button>
          }
        />
      )}

      {isEmpty && (
        <EmptyState
          title="Bu davrda chek yo'q"
          description="Tanlangan davr uchun import qilingan (tasdiqlangan) chek topilmadi."
        />
      )}

      {phase === "ready" && analytics != null && !isEmpty && (
        <>
          {result?.partial && (
            <p className={styles.partial} role="status">
              Bu davrda hali tasdiqlanmagan cheklar bor — reyting to'liq bo'lmasligi mumkin.
            </p>
          )}

          <div className={styles.tiles}>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>Summa</span>
              <span className={styles.tileValue}>{formatMoney(analytics.totalAmount, CURRENCY)}</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>Xaridlar soni</span>
              <span className={styles.tileValue}>{analytics.purchaseCount} ta</span>
            </div>
          </div>

          <section className={styles.section} aria-labelledby="cat-heading">
            <h2 id="cat-heading" className={styles.sectionTitle}>
              Kategoriyalar bo'yicha
            </h2>
            <ul className={styles.rankList}>
              {analytics.categories.map((group) => (
                <CategoryRow key={group.category} group={group} max={analytics.categories[0]?.amount ?? 0} />
              ))}
            </ul>
          </section>

          <section className={styles.section} aria-labelledby="prod-heading">
            <div className={styles.sectionHead}>
              <h2 id="prod-heading" className={styles.sectionTitle}>
                Mahsulotlar (MXIK) bo'yicha
              </h2>
              <Tabs
                ariaLabel="Reyting ko'rsatkichi"
                value={metric}
                onChange={(v) => setMetric(v as AnalyticsMetric)}
                items={[
                  { value: "amount", label: "Summa" },
                  { value: "frequency", label: "Soni" },
                ]}
              />
            </div>
            <ul className={styles.rankList}>
              {analytics.products.map((product) => (
                <ProductRow
                  key={product.code}
                  product={product}
                  max={analytics.products.reduce((m, p) => Math.max(m, p.amount), 0)}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function CategoryRow({ group, max }: { group: CategoryGroup; max: number }) {
  const pct = max > 0 ? Math.round((group.amount / max) * 100) : 0;
  return (
    <li className={styles.rankRow}>
      <span className={styles.rankHead}>
        <span className={styles.rankName}>{group.category}</span>
        <span className={styles.rankAmount}>{formatMoney(group.amount, CURRENCY)}</span>
      </span>
      <span className={styles.bar} aria-hidden="true">
        <span className={styles.barFill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.rankMeta}>{group.itemCount} ta qator</span>
    </li>
  );
}

function ProductRow({ product, max }: { product: ProductRank; max: number }) {
  const pct = max > 0 ? Math.round((product.amount / max) * 100) : 0;
  return (
    <li className={styles.rankRow}>
      <span className={styles.rankHead}>
        <span className={styles.rankName}>{product.name}</span>
        <span className={styles.rankAmount}>{formatMoney(product.amount, CURRENCY)}</span>
      </span>
      <span className={styles.bar} aria-hidden="true">
        <span className={styles.barFill} style={{ width: `${pct}%` }} />
      </span>
      <span className={styles.rankMeta}>{product.frequency} marta xarid</span>
    </li>
  );
}
