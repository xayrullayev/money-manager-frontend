import { useRef, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogCancelButton,
  Input,
  Select,
} from "../../shared/ui";
import {
  addContribution,
  type SavingPlan,
  type CreateContributionInput,
} from "../../shared/api/savings";
import { ApiError } from "../../shared/api/client";
import {
  contributionPreview,
  createSavingRetry,
} from "../../shared/lib/savings";
import { savingError } from "./errors";
import styles from "./SavingPlansPage.module.css";
export function ContributionDialog({
  plan,
  today,
  hidden,
  onClose,
  onSaved,
}: {
  plan: SavingPlan;
  today: string;
  hidden: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [kind, setKind] =
    useState<CreateContributionInput["kind"]>("CONTRIBUTION");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const retry = useRef(createSavingRetry());
  const lock = useRef(false);
  const preview = contributionPreview(
    plan.currentAmount,
    plan.targetAmount,
    amount,
    kind,
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (!preview) {
      setFields({
        amount:
          "Summani tekshiring. Qoldiq manfiy yoki limitdan katta bo‘la olmaydi.",
      });
      return;
    }
    if (!date || date > today) {
      setFields({ occurredOn: "Bugungi yoki oldingi sanani tanlang." });
      return;
    }
    const input = {
      amount,
      kind,
      occurredOn: date,
      note: note.trim() || undefined,
    };
    lock.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      await addContribution(
        plan.id,
        input,
        retry.current(JSON.stringify(input)),
      );
      onSaved();
    } catch (e) {
      setError(savingError(e));
      if (e instanceof ApiError) setFields(e.fieldErrors ?? {});
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={plan.name}
      onClose={onClose}
      dirty={!!amount || !!note || kind !== "CONTRIBUTION" || date !== today}
      preventClose={busy}
    >
      <form className={styles.form} onSubmit={submit}>
        <Select
          label="Amal"
          value={kind}
          onChange={(v) => setKind(v as CreateContributionInput["kind"])}
          options={[
            { value: "CONTRIBUTION", label: "Hissa qo‘shish" },
            { value: "WITHDRAWAL", label: "Pul yechish" },
          ]}
          disabled={busy}
        />
        <Input
          label={`Summa (${plan.currency})`}
          value={amount}
          onChange={setAmount}
          inputMode="decimal"
          error={fields.amount}
          disabled={busy}
        />
        <Input
          label="Sana"
          type="date"
          value={date}
          onChange={setDate}
          max={today}
          error={fields.occurredOn}
          disabled={busy}
        />
        <Input
          label="Izoh"
          value={note}
          onChange={setNote}
          maxLength={500}
          optional
          error={fields.note}
          disabled={busy}
        />
        {preview && !hidden && (
          <p role="status">Reja {preview.percent}% ga yetadi.</p>
        )}
        <p className={styles.muted}>
          Bu yozuv hisoblaringizdagi pulni avtomatik ko‘chirmaydi.
        </p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <DialogCancelButton disabled={busy} />
          <Button type="submit" loading={busy}>
            Saqlash
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
