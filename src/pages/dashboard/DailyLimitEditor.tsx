import { useEffect, useRef, useState, type FormEvent } from "react";
import { createDailyLimit, deleteDailyLimit, fetchDailyLimit, updateDailyLimit, type DailyLimitStatus } from "../../shared/api/dailyLimit";
import { ApiError } from "../../shared/api/client";
import { Button, Dialog, DialogCancelButton, Input } from "../../shared/ui";
import { limitInputValue, normalizeLimitInput, validateLimitInput } from "../../shared/lib/dailyLimit";
import { formatMoney } from "../../shared/lib/money";
import styles from "./DailyLimitCard.module.css";

type Problem = { kind: "stale" | "network" | "generic"; text: string } | null;

function isEditable(status: DailyLimitStatus): boolean {
  return status.configured && status.version !== null;
}

/**
 * Kunlik limit o'rnatish / tahrirlash (Frontend-06). Rejim serverdagi holatdan kelib chiqadi:
 * limit bor bo'lsa PATCH (`expectedVersion` bilan), yo'q bo'lsa POST. Konfliktlar jim
 * overwrite qilinmaydi: DAILY_LIMIT_EXISTS → holat qayta yuklanib tahrirlash rejimiga o'tiladi,
 * STALE_VERSION → "So‘nggi holatni yuklash". Tarmoq xatosida kiritilgan qiymat saqlanadi.
 */
export function DailyLimitEditor({ status, onClose, onSaved, onStatusLoaded }: {
  status: DailyLimitStatus;
  onClose: () => void;
  onSaved: (status: DailyLimitStatus, created: boolean) => void;
  /** Konflikt paytida qayta yuklangan holat — blok ham yangilanadi */
  onStatusLoaded: (status: DailyLimitStatus) => void;
}) {
  const [base, setBase] = useState(status);
  const [value, setValue] = useState(() => limitInputValue(status.limit));
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [problem, setProblem] = useState<Problem>(null);
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const editing = isEditable(base);
  const dirty = value !== limitInputValue(base.limit);

  async function withLock(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setSlow(false);
    const timer = setTimeout(() => {
      if (mounted.current) setSlow(true);
    }, 5000);
    try {
      await task();
    } finally {
      clearTimeout(timer);
      lock.current = false;
      if (mounted.current) {
        setBusy(false);
        setSlow(false);
      }
    }
  }

  function adopt(latest: DailyLimitStatus) {
    setBase(latest);
    onStatusLoaded(latest);
  }

  async function save() {
    const invalid = validateLimitInput(value);
    setFieldError(invalid ?? undefined);
    setProblem(null);
    setInfo("");
    if (invalid) return;
    if (!navigator.onLine) {
      setProblem({ kind: "network", text: "Internetga ulaning. Kiritilgan qiymat saqlanib turibdi." });
      return;
    }
    const limit = normalizeLimitInput(value);
    await withLock(async () => {
      try {
        const saved = editing ? await updateDailyLimit(limit, base.version as number) : await createDailyLimit(limit);
        if (mounted.current) onSaved(saved, !editing);
      } catch (cause) {
        if (mounted.current) await handleError(cause);
      }
    });
  }

  async function handleError(cause: unknown) {
    if (!(cause instanceof ApiError)) {
      setProblem({ kind: "generic", text: "Limit saqlanmadi. Qayta urinib ko‘ring." });
      return;
    }
    switch (cause.code) {
      case "VALIDATION_FAILED":
        setFieldError(cause.fieldErrors?.limit ?? cause.message);
        return;
      case "STALE_VERSION":
        setProblem({ kind: "stale", text: "Limit boshqa joyda o‘zgargan. So‘nggi holatni yuklab, qayta saqlang." });
        return;
      case "DAILY_LIMIT_EXISTS":
      case "DAILY_LIMIT_NOT_FOUND":
        try {
          const latest = await fetchDailyLimit();
          if (!mounted.current) return;
          adopt(latest);
          setInfo(
            isEditable(latest) && latest.limit
              ? `Kunlik limit allaqachon o‘rnatilgan: ${formatMoney(latest.limit, latest.currency)}. Tahrirlash rejimiga o‘tildi — qiymatni tekshirib, qayta saqlang.`
              : "Limit boshqa joyda olib tashlangan. Saqlasangiz, yangi limit o‘rnatiladi.",
          );
        } catch {
          if (mounted.current) setProblem({ kind: "stale", text: "Limit boshqa joyda o‘zgargan. So‘nggi holatni yuklab, qayta saqlang." });
        }
        return;
      default:
        if (cause.code === "NETWORK_ERROR" || cause.status === 0) {
          setProblem({ kind: "network", text: "Server bilan bog‘lanib bo‘lmadi. Kiritilgan qiymat saqlanib turibdi — qayta urinib ko‘ring." });
        } else {
          setProblem({ kind: "generic", text: cause.message });
        }
    }
  }

  async function loadLatest() {
    await withLock(async () => {
      try {
        const latest = await fetchDailyLimit();
        if (!mounted.current) return;
        adopt(latest);
        setValue(limitInputValue(latest.limit));
        setProblem(null);
        setFieldError(undefined);
        setInfo(
          isEditable(latest) && latest.limit
            ? `So‘nggi holat yuklandi: joriy limit ${formatMoney(latest.limit, latest.currency)}. Kerak bo‘lsa o‘zgartirib, qayta saqlang.`
            : "Limit boshqa joyda olib tashlangan. Saqlasangiz, yangi limit o‘rnatiladi.",
        );
      } catch (cause) {
        if (mounted.current) setProblem({ kind: "generic", text: cause instanceof ApiError ? cause.message : "Holatni yuklab bo‘lmadi. Qayta urinib ko‘ring." });
      }
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void save();
  }

  return (
    <Dialog
      title={editing ? "Kunlik limitni tahrirlash" : "Kunlik limit o‘rnatish"}
      onClose={onClose}
      preventClose={busy}
      dirty={dirty}
      discardMessage="Saqlanmagan o‘zgarishlarni bekor qilasizmi?"
    >
      <form onSubmit={submit} className={styles.form} noValidate>
        <Input
          label="Kunlik limit summasi"
          value={value}
          onChange={(next) => {
            setValue(next);
            if (fieldError) setFieldError(undefined);
          }}
          inputMode="decimal"
          autoComplete="off"
          maxLength={24}
          disabled={busy}
          error={fieldError}
          hint="Masalan, 500000 yoki 500000.50"
          suffix={base.currency}
          data-autofocus
        />
        <p className={styles.formHint}>Limit faqat xarajatlarni kuzatadi, hisobdagi pulni o‘zgartirmaydi. Transferlar hisoblanmaydi.</p>
        {info && <p className={styles.formInfo} role="status">{info}</p>}
        {problem && (
          <div className={styles.formProblem} role="alert">
            <p>{problem.text}</p>
            {problem.kind === "stale" && (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void loadLatest()}>So‘nggi holatni yuklash</Button>
            )}
            {problem.kind === "network" && (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void save()}>Qayta urinish</Button>
            )}
          </div>
        )}
        {slow && <p className={styles.formInfo} role="status">Saqlash biroz vaqt olmoqda…</p>}
        <div className={styles.formActions}>
          <DialogCancelButton disabled={busy} />
          <Button type="submit" loading={busy}>Saqlash</Button>
        </div>
      </form>
    </Dialog>
  );
}

/** "Limitni olib tashlash" tasdig'i: fokus "Bekor qilish"da, DELETE idempotent. */
export function DailyLimitDeleteDialog({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteDailyLimit();
      onDeleted();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Limit olib tashlanmadi. Qayta urinib ko‘ring.");
      setBusy(false);
    } finally {
      lock.current = false;
    }
  }

  return (
    <Dialog title="Kunlik limitni olib tashlash" onClose={onClose} preventClose={busy}>
      <div className={styles.form}>
        <p className={styles.formText}>Kunlik limit olib tashlanadi. Xarajatlar va hisob qoldig‘i o‘zgarmaydi.</p>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
          <Button type="button" variant="secondary" data-autofocus disabled={busy} onClick={onClose}>Bekor qilish</Button>
          <Button type="button" variant="danger" loading={busy} onClick={() => void remove()}>Limitni olib tashlash</Button>
        </div>
      </div>
    </Dialog>
  );
}
