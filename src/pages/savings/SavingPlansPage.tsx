import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchSavingPlans,
  fetchSavingsSummary,
  archiveSavingPlan,
  unarchiveSavingPlan,
  type SavingPlan,
  type SavingsSummary,
} from "../../shared/api/savings";
import { fetchProfile, type Profile } from "../../shared/api/profile";
import {
  Button,
  ProgressBar,
  SavingPlanIcon,
  Skeleton,
  useToast,
} from "../../shared/ui";
import { formatMoney } from "../../shared/lib/money";
import { savingToday } from "../../shared/lib/savings";
import { PlanCard } from "./PlanCard";
import { planStatus } from "./planStatus";
import { SavingPlanFormDialog } from "./SavingPlanFormDialog";
import { ContributionDialog } from "./ContributionDialog";
import { ContributionHistory } from "./ContributionHistory";
import { BalanceChart } from "./BalanceChart";
import { savingError } from "./errors";
import styles from "./SavingPlansPage.module.css";
export function SavingPlansPage() {
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState<SavingPlan[]>([]);
  const [summary, setSummary] = useState<SavingsSummary>();
  const [profile, setProfile] = useState<Profile>();
  const [archived, setArchived] = useState(false);
  const [busy, setBusy] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("mm.balanceHidden") === "1";
    } catch {
      return false;
    }
  });
  const [dialog, setDialog] = useState<"new" | "edit" | "contribution" | null>(
    params.get("new") === "1" ? "new" : null,
  );
  const [year, setYear] = useState<number>();
  const { showToast } = useToast();
  const selected = plans.find((p) => p.id === params.get("plan")) ?? plans[0];
  const reload = () => setRevision((v) => v + 1);
  useEffect(() => {
    const changed = () => setRevision((v) => v + 1);
    window.addEventListener("mm:savings-changed", changed);
    return () => window.removeEventListener("mm:savings-changed", changed);
  }, []);
  // Reset request state when the resource changes; stale responses are ignored.
  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react/set-state-in-effect -- reset state for the new request
    setBusy(true);
    setError("");
    Promise.all([
      fetchSavingPlans(archived, controller.signal),
      fetchSavingsSummary(controller.signal),
      fetchProfile(),
    ])
      .then(([items, total, user]) => {
        if (controller.signal.aborted) return;
        setPlans(items);
        setSummary(total);
        setProfile(user);
        setYear((y) => y ?? Number(savingToday(user.timezone).slice(0, 4)));
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(savingError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [archived, revision]);
  function close() {
    setDialog(null);
    if (params.has("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  }
  function saved(plan?: SavingPlan) {
    close();
    if (plan) setParams({ plan: plan.id }, { replace: true });
    showToast("Saqlandi.", "success");
    reload();
  }
  async function archive() {
    if (!selected || mutating) return;
    setMutating(true);
    try {
      await (selected.archived
        ? unarchiveSavingPlan(selected.id)
        : archiveSavingPlan(selected.id));
      showToast(
        selected.archived ? "Reja tiklandi." : "Reja arxivlandi.",
        "success",
      );
      reload();
    } catch (e) {
      showToast(savingError(e), "error");
    } finally {
      setMutating(false);
    }
  }
  function toggle() {
    setHidden((value) => {
      try {
        localStorage.setItem("mm.balanceHidden", value ? "0" : "1");
      } catch {
        /* preference is optional */
      }
      return !value;
    });
  }
  const money = (amount: string, currency: string) =>
    hidden ? "••••••" : formatMoney(amount, currency);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>MAQSADLARINGIZ SARI</p>
          <h1>Jamg‘arma rejalari</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={toggle} aria-pressed={hidden}>
            {hidden ? "Summalarni ko‘rsatish" : "Summalarni yashirish"}
          </Button>
          <Button onClick={() => setDialog("new")} disabled={!profile}>
            + Reja qo‘shish
          </Button>
        </div>
      </header>
      {busy && (
        <div className={styles.summary} aria-label="Yuklanmoqda" role="status">
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeleton}>
              <Skeleton width="50%" />
              <Skeleton height="var(--space-8)" />
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className={styles.panel} role="alert">
          <p>{error}</p>
          <Button onClick={reload}>Qayta urinish</Button>
        </div>
      )}
      {!busy && !error && summary && (
        <>
          <div className={styles.summary}>
            {[
              ["Jami jamg‘arma", money(summary.totalSavings, summary.currency)],
              ["Jami maqsad", money(summary.totalTarget, summary.currency)],
              ["Faol rejalar", String(summary.planCount)],
            ].map(([label, value]) => (
              <section className={styles.stat} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <span className={styles.statIcon}>
                  <SavingPlanIcon iconKey="other" />
                </span>
              </section>
            ))}
          </div>
          <div className={styles.layout}>
            <section className={styles.panel}>
              <div className={styles.between}>
                <h2>Rejalar</h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setArchived((v) => !v);
                    setParams({});
                  }}
                  aria-pressed={archived}
                >
                  {archived ? "Faol rejalar" : "Arxiv"}
                </Button>
              </div>
              {plans.length === 0 ? (
                <div className={styles.empty}>
                  <SavingPlanIcon iconKey="other" />
                  <h3>
                    {archived
                      ? "Arxiv bo‘sh"
                      : "Birinchi maqsadingizdan boshlang"}
                  </h3>
                  <p>
                    {archived
                      ? "Arxivlangan rejalar shu yerda ko‘rinadi."
                      : "Katta maqsadlar kichik qadamlardan boshlanadi."}
                  </p>
                  {!archived && (
                    <Button onClick={() => setDialog("new")}>
                      Reja yaratish
                    </Button>
                  )}
                </div>
              ) : (
                <div className={styles.planList}>
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      hidden={hidden}
                      selected={plan.id === selected?.id}
                      onSelect={() =>
                        setParams({ plan: plan.id }, { replace: true })
                      }
                    />
                  ))}
                </div>
              )}
            </section>
            {selected && profile && year && (
              <div className={styles.detailColumn}>
                <div className={styles.detailTop}>
                  <section className={styles.detail}>
                    <div className={styles.planHeading}>
                      <SavingPlanIcon
                        iconKey={selected.iconKey}
                        colorToken={selected.colorToken}
                      />
                      <h2>{selected.name}</h2>
                    </div>
                    <p className={styles.heroMoney}>
                      {money(selected.currentAmount, selected.currency)}
                    </p>
                    <p className={styles.muted}>
                      Maqsad: {money(selected.targetAmount, selected.currency)}
                    </p>
                    {!hidden && (
                      <ProgressBar
                        value={selected.progressPercent}
                        label={`${selected.name}: bajarilishi`}
                      />
                    )}
                    <div className={styles.between}>
                      <span>{planStatus(selected)}</span>
                      <strong>
                        {hidden ? "•••" : `${selected.progressPercent}%`}
                      </strong>
                    </div>
                    <dl className={styles.metadata}>
                      <div>
                        <dt>Muddat</dt>
                        <dd>{selected.dueDate ?? "Belgilanmagan"}</dd>
                      </div>
                      <div>
                        <dt>Qolgan vaqt</dt>
                        <dd>
                          {selected.completed
                            ? "Yakunlangan"
                            : selected.remainingDays === undefined
                              ? "—"
                              : selected.remainingDays < 0
                                ? `${-selected.remainingDays} kun o‘tgan`
                                : `${selected.remainingDays} kun`}
                        </dd>
                      </div>
                      <div>
                        <dt>Qolgan summa</dt>
                        <dd>{money(selected.remaining, selected.currency)}</dd>
                      </div>
                    </dl>
                    <div className={styles.actions}>
                      {!selected.archived && (
                        <Button onClick={() => setDialog("contribution")}>
                          Hissa / yechish
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => setDialog("edit")}
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        variant="ghost"
                        loading={mutating}
                        onClick={() => void archive()}
                      >
                        {selected.archived ? "Tiklash" : "Arxivlash"}
                      </Button>
                    </div>
                  </section>
                  <section className={styles.panel}>
                    <div className={styles.between}>
                      <h2>Balans</h2>
                      <label className={styles.year}>
                        Yil
                        <select
                          aria-label="Grafik yili"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                        >
                          {Array.from(
                            {
                              length:
                                Number(
                                  savingToday(profile.timezone).slice(0, 4),
                                ) - 1899,
                            },
                            (_, i) =>
                              Number(
                                savingToday(profile.timezone).slice(0, 4),
                              ) - i,
                          ).map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <BalanceChart
                      key={`${selected.id}-${year}-${revision}`}
                      planId={selected.id}
                      year={year}
                      hidden={hidden}
                    />
                  </section>
                </div>
                <ContributionHistory
                  key={`${selected.id}-${revision}`}
                  plan={selected}
                  hidden={hidden}
                />
              </div>
            )}
          </div>
        </>
      )}
      {dialog &&
        profile &&
        (dialog === "new" || selected) &&
        (dialog === "contribution" ? (
          <ContributionDialog
            plan={selected!}
            today={savingToday(profile.timezone)}
            hidden={hidden}
            onClose={close}
            onSaved={() => saved()}
          />
        ) : (
          <SavingPlanFormDialog
            plan={dialog === "edit" ? selected : undefined}
            currency={profile.baseCurrency}
            today={savingToday(profile.timezone)}
            onClose={close}
            onSaved={saved}
            onReload={() => {
              close();
              reload();
            }}
          />
        ))}
    </div>
  );
}
