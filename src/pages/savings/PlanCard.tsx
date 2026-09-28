import { planStatus } from "./planStatus";
import type { SavingPlan } from "../../shared/api/savings";
import { ProgressBar, SavingPlanIcon } from "../../shared/ui";
import { formatMoney } from "../../shared/lib/money";
import styles from "./SavingPlansPage.module.css";
export function PlanCard({
  plan,
  hidden,
  selected,
  onSelect,
}: {
  plan: SavingPlan;
  hidden: boolean;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.plan} ${selected ? styles.selected : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.planHeading}>
        <SavingPlanIcon iconKey={plan.iconKey} colorToken={plan.colorToken} />
        <strong>{plan.name}</strong>
      </span>
      <span className={styles.planAmounts}>
        {hidden
          ? "••••••"
          : `${formatMoney(plan.currentAmount, plan.currency)} / ${formatMoney(plan.targetAmount, plan.currency)}`}
      </span>
      <span className={styles.between}>
        <span>{planStatus(plan)}</span>
        <strong>{hidden ? "•••" : `${plan.progressPercent}%`}</strong>
      </span>
      {!hidden && (
        <ProgressBar
          value={plan.progressPercent}
          variant={plan.completed ? "success" : "default"}
          label={`${plan.name}: bajarilishi`}
        />
      )}
    </button>
  );
}
