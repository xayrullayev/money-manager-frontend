import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogCancelButton,
  Input,
  SavingPlanIcon,
} from "../../shared/ui";
import {
  createSavingPlan,
  updateSavingPlan,
  type SavingPlan,
} from "../../shared/api/savings";
import { ApiError } from "../../shared/api/client";
import { SAVING_ICONS, validSavingAmount } from "../../shared/lib/savings";
import {
  CATEGORY_COLOR_TOKENS,
  CATEGORY_COLORS,
} from "../../shared/lib/categoryTokens";
import { savingError } from "./errors";
import styles from "./SavingPlansPage.module.css";
export function SavingPlanFormDialog({
  plan,
  currency,
  today,
  onClose,
  onSaved,
  onReload,
}: {
  plan?: SavingPlan;
  currency: string;
  today: string;
  onClose: () => void;
  onSaved: (plan: SavingPlan) => void;
  onReload: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [target, setTarget] = useState(plan?.targetAmount ?? "");
  const [icon, setIcon] = useState(plan?.iconKey ?? "other");
  const [color, setColor] = useState(plan?.colorToken ?? "green");
  const [due, setDue] = useState(plan?.dueDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [stale, setStale] = useState(false);
  const dirty =
    name !== (plan?.name ?? "") ||
    target !== (plan?.targetAmount ?? "") ||
    icon !== (plan?.iconKey ?? "other") ||
    color !== (plan?.colorToken ?? "green") ||
    due !== (plan?.dueDate ?? "");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const validation: Record<string, string> = {};
    if (!name.trim()) validation.name = "Reja nomini kiriting.";
    if (!validSavingAmount(target))
      validation.targetAmount =
        "Musbat summa kiriting (17 ta raqam, 2 ta kasr xonasigacha).";
    if (due && due !== plan?.dueDate && due < today)
      validation.dueDate = "Muddat bugundan oldin bo‘lmasin.";
    setFields(validation);
    if (Object.keys(validation).length) return;
    setBusy(true);
    setError("");
    try {
      const common = {
        name: name.trim(),
        iconKey: icon,
        colorToken: color,
        targetAmount: target,
      };
      const saved = plan
        ? await updateSavingPlan(plan.id, {
            ...common,
            expectedVersion: plan.version,
            ...(due !== plan.dueDate
              ? due
                ? { dueDate: due }
                : { clearDueDate: true }
              : {}),
          })
        : await createSavingPlan({
            ...common,
            currency,
            dueDate: due || undefined,
          });
      onSaved(saved);
    } catch (e) {
      setError(savingError(e));
      if (e instanceof ApiError) {
        setFields(e.fieldErrors ?? {});
        setStale(e.code === "STALE_VERSION");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={plan ? "Rejani tahrirlash" : "Yangi jamg‘arma rejasi"}
      onClose={onClose}
      dirty={dirty}
      preventClose={busy}
    >
      <form className={styles.form} onSubmit={submit}>
        <Input
          label="Reja nomi"
          value={name}
          onChange={setName}
          maxLength={100}
          error={fields.name}
          disabled={busy}
          data-autofocus
        />
        <Input
          label="Maqsad summasi"
          value={target}
          onChange={setTarget}
          inputMode="decimal"
          error={fields.targetAmount}
          disabled={busy}
        />
        <Input
          label="Valyuta"
          value={plan?.currency ?? currency}
          onChange={() => {}}
          readOnly
          hint="Profilingizning asosiy valyutasi."
        />
        <Input
          label="Maqsad muddati"
          type="date"
          value={due}
          onChange={setDue}
          optional
          error={fields.dueDate}
          disabled={busy}
        />
        <fieldset disabled={busy} className={styles.picker}>
          <legend>Reja belgisi</legend>
          <div className={styles.icons}>
            {Object.entries(SAVING_ICONS).map(([key, label]) => (
              <label key={key} className={styles.choice}>
                <input
                  type="radio"
                  name="saving-icon"
                  value={key}
                  checked={key === icon}
                  onChange={() => setIcon(key)}
                />
                <SavingPlanIcon iconKey={key} colorToken={color} size="sm" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={busy} className={styles.picker}>
          <legend>Rang</legend>
          <div className={styles.icons}>
            {CATEGORY_COLOR_TOKENS.map((key) => (
              <label key={key} className={styles.choice}>
                <input
                  type="radio"
                  name="saving-color"
                  checked={key === color}
                  onChange={() => setColor(key)}
                />
                <span
                  className={styles.swatch}
                  style={{ background: `var(--category-${key})` }}
                />
                {CATEGORY_COLORS[key]}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <DialogCancelButton disabled={busy} />
          {stale ? (
            <Button type="button" onClick={onReload}>
              Yangi holatni yuklash
            </Button>
          ) : (
            <Button type="submit" loading={busy}>
              Saqlash
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
