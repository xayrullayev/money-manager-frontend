import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "../../shared/ui/Button";
import { Dialog, DialogCancelButton } from "../../shared/ui/Dialog";
import { Select } from "../../shared/ui/Select";
import { listAccounts, type Account } from "../../shared/api/accounts";
import { listCategories, type Category, type CategoryType } from "../../shared/api/categories";
import {
  createTransaction,
  getTransaction,
  updateTransaction,
  type CreateTransactionPayload,
  type Transaction,
} from "../../shared/api/transactions";
import { ApiError } from "../../shared/api/client";
import { createIdempotencyKey, isValidPositiveAmount, sanitizeAmountInput } from "../../shared/lib/money";
import { toLocalDate } from "../../shared/lib/period";
import styles from "./AddTransactionDialog.module.css";

type FormType = "EXPENSE" | "INCOME" | "TRANSFER";

const TYPE_LABELS: Record<FormType, string> = {
  EXPENSE: "Xarajat",
  INCOME: "Daromad",
  TRANSFER: "O‘tkazma",
};

/** Backend `note` limiti 500 (UpdateTransactionRequest/CreateTransactionRequest @Size). */
const NOTE_MAX_LENGTH = 500;
/** Design-05: "Savingda close blok; 5sdan keyin slow message". */
const SLOW_REQUEST_MS = 5000;

interface FormValues {
  amount: string;
  accountId: string;
  fromAccountId: string;
  toAccountId: string;
  categoryId: string;
  date: string;
  note: string;
}

interface Props {
  onClose: () => void;
  /** Muvaffaqiyatli saqlangandan keyin (yaratish yoki tahrirlash) — dialog yopiladi. */
  onSaved: (transaction: Transaction) => void;
  /** Boshlang'ich tur — Dashboard'dagi "Xarajat qo'shish" CTA doim EXPENSE bilan ochadi */
  initialType?: FormType;
  /** Berilsa — tahrirlash rejimi (Design-05). Tur o'zgarmaydi. */
  transaction?: Transaction;
  /**
   * Faqat YARATISH rejimida (transaction berilmaganda) formani oldindan to'ldirish uchun.
   * Frontend-check-03: chek tafsilotidan "Xarajatga saqlash" — mavjud operatsiyadan
   * yangi xarajat nusxasini oldindan to'ldirib ochish uchun ishlatiladi.
   */
  template?: Partial<FormValues>;
}

function valuesFromTransaction(tx: Transaction): FormValues {
  return {
    amount: tx.amount,
    accountId: tx.type === "TRANSFER" ? "" : tx.accountId,
    fromAccountId: tx.type === "TRANSFER" ? (tx.fromAccountId ?? tx.accountId) : "",
    toAccountId: tx.type === "TRANSFER" ? (tx.toAccountId ?? "") : "",
    categoryId: tx.categoryId ?? "",
    date: tx.transactionDate,
    note: tx.note ?? "",
  };
}

const EMPTY_VALUES: FormValues = {
  amount: "",
  accountId: "",
  fromAccountId: "",
  toAccountId: "",
  categoryId: "",
  date: "",
  note: "",
};

function buildPayload(type: FormType, v: FormValues): CreateTransactionPayload {
  const note = v.note.trim() || undefined;
  return type === "TRANSFER"
    ? { type, amount: v.amount, fromAccountId: v.fromAccountId, toAccountId: v.toAccountId, transactionDate: v.date, note }
    : { type, amount: v.amount, accountId: v.accountId, categoryId: v.categoryId, transactionDate: v.date, note };
}

/**
 * Design-05: Operatsiya qo'shish va tahrirlash — desktop dialog / mobile sheet
 * (umumiy `Dialog` komponenti). Qoidalar:
 * - amount > 0, decimal string (float arifmetikasiz), max 2 kasr;
 * - kategoriya faqat mos turdagi, arxivlanmagan; transferda manba ≠ maqsad;
 * - kelajak sanasi taqiqlangan (`max=today`);
 * - tahrirda tur o'zgarmaydi (MVP: noto'g'ri tur → o'chirib qayta yaratiladi);
 * - yaratishda Idempotency-Key: bir xil payload retry → bir xil kalit,
 *   payload o'zgarsa → yangi kalit (aks holda backend 409 IDEMPOTENCY_KEY_REUSED);
 * - tahrirda `expectedVersion`; 409 STALE_VERSION jim overwrite qilinmaydi —
 *   server holatini yuklab, qayta tahrirlashga imkon beriladi;
 * - xatoda dialog ochiq qoladi va qiymatlar saqlanadi; saqlanayotganda yopish bloklanadi;
 * - o'zgartirilgan (dirty) forma yopilayotganda tasdiq so'raladi.
 */
export function AddTransactionDialog({ onClose, onSaved, initialType = "EXPENSE", transaction, template }: Props) {
  const isEdit = Boolean(transaction);
  const [current, setCurrent] = useState<Transaction | undefined>(transaction);
  const [type, setType] = useState<FormType>(transaction?.type ?? initialType);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [optionsError, setOptionsError] = useState<string | undefined>();
  const [optionsReload, setOptionsReload] = useState(0);
  // Qaysi urinish (optionsReload) yakunlangan — loading holati shundan hosil qilinadi.
  const [optionsSettled, setOptionsSettled] = useState(-1);
  const loadingOptions = optionsSettled !== optionsReload;

  const initialValues = useMemo(
    () => (transaction ? valuesFromTransaction(transaction) : { ...EMPTY_VALUES, date: toLocalDate(), ...template }),
    [transaction, template],
  );
  const [values, setValues] = useState<FormValues>(initialValues);
  const [baseline, setBaseline] = useState<FormValues>(initialValues);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [conflict, setConflict] = useState<"stale" | "deleted" | undefined>();
  const [conflictNotice, setConflictNotice] = useState<string | undefined>();
  const [reloadingServer, setReloadingServer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  // Idempotency: kalit oxirgi yuborilgan payload bilan birga saqlanadi.
  const idempotencyRef = useRef<{ key: string; signature: string } | null>(null);

  const today = toLocalDate();
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAccounts(), listCategories()])
      .then(([accountList, categoryList]) => {
        if (cancelled) return;
        setOptionsError(undefined);
        setAccounts(accountList);
        setCategories(categoryList);
        if (!transaction && accountList.length > 0) {
          // Oldindan to'ldirilgan (template) qiymatlar ustidan yozib yubormaymiz —
          // faqat bo'sh maydonlarga standart hisobni qo'yamiz.
          const withDefaults = (prev: FormValues): FormValues => ({
            ...prev,
            accountId: prev.accountId || accountList[0].id,
            fromAccountId: prev.fromAccountId || accountList[0].id,
            toAccountId: prev.toAccountId || (accountList[1]?.id ?? ""),
          });
          setValues(withDefaults);
          setBaseline(withDefaults);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setOptionsError(error instanceof ApiError ? error.message : "Hisob va kategoriyalarni yuklab bo‘lmadi.");
      })
      .finally(() => {
        if (!cancelled) setOptionsSettled(optionsReload);
      });
    return () => {
      cancelled = true;
    };
  }, [transaction, optionsReload]);

  // Arxivlangan hisob/kategoriya ro'yxatda yo'q, lekin tahrirlanayotgan operatsiyada bo'lishi mumkin —
  // uni nomi bilan ko'rsatamiz (Design-07: arxivlangan kategoriya eski tranzaksiyada nomi bilan ko'rinadi).
  const accountOptions = useMemo(() => {
    const list = accounts.map((a) => ({ id: a.id, name: a.name }));
    // Ro'yxat hali yuklanmagan bo'lsa, joriy hisob "arxivlangan" deb noto'g'ri belgilanmasin.
    const suffix = loadingOptions ? "" : " (arxivlangan)";
    if (current) {
      const extra: { id?: string; name?: string }[] =
        current.type === "TRANSFER"
          ? [
              { id: current.fromAccountId, name: current.fromAccountName },
              { id: current.toAccountId, name: current.toAccountName },
            ]
          : [{ id: current.accountId, name: current.accountName }];
      for (const item of extra) {
        if (item.id && !list.some((a) => a.id === item.id)) {
          list.push({ id: item.id, name: `${item.name ?? "Hisob"}${suffix}` });
        }
      }
    }
    return list;
  }, [accounts, current, loadingOptions]);

  const relevantCategories = useMemo(() => {
    if (type === "TRANSFER") return [];
    const list = categories
      .filter((c) => c.type === (type as CategoryType) && !c.archived)
      .map((c) => ({ id: c.id, name: c.name }));
    if (current?.categoryId && current.type === type && !list.some((c) => c.id === current.categoryId)) {
      list.push({ id: current.categoryId, name: `${current.categoryName ?? "Kategoriya"}${loadingOptions ? "" : " (arxivlangan)"}` });
    }
    return list;
  }, [categories, type, current, loadingOptions]);

  // Tur almashganda summa/sana/izoh saqlanadi, turga xos maydon moslanadi (Design-05):
  // tanlangan kategoriya yangi turga mos kelmasa — birinchi mos kategoriya. Effektsiz, render paytida hosil qilinadi.
  const categoryId = relevantCategories.some((c) => c.id === values.categoryId)
    ? values.categoryId
    : (relevantCategories[0]?.id ?? "");

  // "Qaysi hisobga" manba hisobni taklif qilmaydi (Design-05).
  const destinationOptions = accountOptions.filter((a) => a.id !== values.fromAccountId);
  const toAccountId = destinationOptions.some((a) => a.id === values.toAccountId)
    ? values.toAccountId
    : (destinationOptions[0]?.id ?? "");
  const effective: FormValues = { ...values, categoryId, toAccountId };

  // Sekin so'rov xabari: 5s dan keyin ko'rsatiladi, submit tugagach handleSubmit'da o'chiriladi.
  useEffect(() => {
    if (!submitting) return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_REQUEST_MS);
    return () => window.clearTimeout(timer);
  }, [submitting]);

  const dirty = JSON.stringify(values) !== JSON.stringify(baseline) || (!isEdit && type !== initialType);


  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!isValidPositiveAmount(effective.amount)) errors.amount = "Summa 0 dan katta bo‘lishi kerak";
    if (type === "TRANSFER") {
      if (!effective.fromAccountId || !effective.toAccountId) errors.account = "Hisoblarni tanlang";
      else if (effective.fromAccountId === effective.toAccountId) errors.account = "Bir xil hisobga o‘tkazma bo‘lmaydi";
    } else {
      if (!effective.accountId) errors.account = "Hisobni tanlang";
      if (!effective.categoryId) errors.category = "Kategoriyani tanlang";
    }
    if (!effective.date) errors.date = "Sanani tanlang";
    else if (effective.date > today) errors.date = "Kelajak sanasini tanlab bo‘lmaydi";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /** Backend field nomlari → forma maydonlari. */
  function mapFieldErrors(errors: Record<string, string>): Record<string, string> {
    const mapped: Record<string, string> = {};
    for (const [field, message] of Object.entries(errors)) {
      if (field === "transactionDate") mapped.date = message;
      else if (field === "accountId" || field === "fromAccountId" || field === "toAccountId") mapped.account = message;
      else if (field === "categoryId") mapped.category = message;
      else mapped[field] = message;
    }
    return mapped;
  }

  function handleError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError("Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring.");
      return;
    }
    if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...mapFieldErrors(error.fieldErrors!) }));
      return;
    }
    switch (error.code) {
      case "STALE_VERSION":
        setConflict("stale");
        return;
      case "TRANSACTION_NOT_FOUND":
        if (isEdit) {
          setConflict("deleted");
          return;
        }
        break;
      case "IDEMPOTENCY_KEY_IN_PROGRESS":
        setFormError("Oldingi so‘rov hali bajarilmoqda. Bir necha soniyadan keyin qayta urinib ko‘ring.");
        return;
      case "INVALID_AMOUNT":
        setFieldErrors((prev) => ({ ...prev, amount: error.message }));
        return;
      case "FUTURE_DATE_NOT_ALLOWED":
      case "DATE_BEFORE_OPENING":
        setFieldErrors((prev) => ({ ...prev, date: error.message }));
        return;
      case "CATEGORY_ARCHIVED":
      case "CATEGORY_TYPE_MISMATCH":
        setFieldErrors((prev) => ({ ...prev, category: error.message }));
        return;
      case "ACCOUNT_ARCHIVED":
      case "TRANSFER_SAME_ACCOUNT":
        setFieldErrors((prev) => ({ ...prev, account: error.message }));
        return;
      case "UNAUTHENTICATED":
        setFormError("Sessiya tugagan. Qaytadan tizimga kiring — kiritgan ma’lumotlaringiz saqlanmaydi.");
        return;
    }
    setFormError(error.message);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || conflict) return; // dublyaj submit bloklanadi
    setFormError(undefined);
    setConflictNotice(undefined);
    if (!validate()) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setFormError("Internetga ulanmagansiz. Ulanib, qayta urinib ko‘ring — kiritilgan qiymatlar saqlanib qoladi.");
      return;
    }

    const payload = buildPayload(type, effective);
    setSubmitting(true);
    try {
      let saved: Transaction;
      if (current) {
        saved = await updateTransaction(current.id, { ...payload, expectedVersion: current.version });
      } else {
        const signature = JSON.stringify(payload);
        if (!idempotencyRef.current || idempotencyRef.current.signature !== signature) {
          idempotencyRef.current = { key: createIdempotencyKey(), signature };
        }
        saved = await createTransaction(payload, idempotencyRef.current.key);
      }
      onSaved(saved);
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
      setSlow(false);
    }
  }

  /** 409 STALE_VERSION: serverdagi eng so'nggi holatni formaga yuklaymiz — foydalanuvchi ko'rib, qayta tahrirlaydi. */
  async function reloadFromServer() {
    if (!current) return;
    setReloadingServer(true);
    try {
      const fresh = await getTransaction(current.id);
      const freshValues = valuesFromTransaction(fresh);
      setCurrent(fresh);
      setType(fresh.type);
      setValues(freshValues);
      setBaseline(freshValues);
      setFieldErrors({});
      setConflict(undefined);
      setConflictNotice("Serverdagi so‘nggi holat yuklandi. O‘zgarishlaringizni qayta kiriting va saqlang.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setConflict("deleted");
      else setFormError(error instanceof ApiError ? error.message : "Operatsiyani qayta yuklab bo‘lmadi.");
    } finally {
      setReloadingServer(false);
    }
  }

  const busy = submitting || loadingOptions;
  const title = isEdit ? `${TYPE_LABELS[type]}ni tahrirlash` : `${TYPE_LABELS[type]} qo‘shish`;

  return (
    <Dialog title={title} onClose={onClose} preventClose={submitting} dirty={dirty}>
      {isEdit ? (
        <p className={styles.typeLocked}>
          Turi: <strong>{TYPE_LABELS[type]}</strong>. Turni o‘zgartirib bo‘lmaydi — kerak bo‘lsa, operatsiyani o‘chirib, qaytadan yarating.
        </p>
      ) : (
        <div className={styles.typeTabs} role="group" aria-label="Operatsiya turi">
          {(Object.keys(TYPE_LABELS) as FormType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={[styles.typeTab, type === t ? styles.typeTabActive : ""].filter(Boolean).join(" ")}
              onClick={() => {
                setType(t);
                setFieldErrors({});
              }}
              disabled={submitting}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      {optionsError && (
        <div className={styles.formError} role="alert">
          <span>{optionsError}</span>
          <Button variant="secondary" onClick={() => setOptionsReload((n) => n + 1)}>Qayta urinish</Button>
        </div>
      )}

      {conflict === "stale" && (
        <div className={styles.conflict} role="alert">
          <p className={styles.conflictText}>
            Bu operatsiya boshqa joyda (masalan, boshqa qurilma yoki oynada) o‘zgartirilgan. Sizning o‘zgarishlaringiz saqlanmadi.
          </p>
          <Button variant="secondary" loading={reloadingServer} onClick={() => void reloadFromServer()}>
            So‘nggi holatni yuklash
          </Button>
        </div>
      )}
      {conflict === "deleted" && (
        <div className={styles.conflict} role="alert">
          <p className={styles.conflictText}>Bu operatsiya o‘chirilgan, uni tahrirlab bo‘lmaydi.</p>
          <Button variant="secondary" onClick={onClose}>Yopish</Button>
        </div>
      )}
      {conflictNotice && <p className={styles.notice} role="status">{conflictNotice}</p>}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-amount">
            Summa
          </label>
          <input
            id="tx-amount"
            className={styles.amountInput}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={values.amount}
            onChange={(event) => set("amount", sanitizeAmountInput(event.target.value))}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.amount)}
            aria-describedby={fieldErrors.amount ? "tx-amount-error" : undefined}
          />
          {fieldErrors.amount && (
            <p id="tx-amount-error" className={styles.fieldError}>
              {fieldErrors.amount}
            </p>
          )}
        </div>

        {type === "TRANSFER" ? (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tx-from">
                Qaysi hisobdan
              </label>
              <select
                id="tx-from"
                className={styles.select}
                value={values.fromAccountId}
                onChange={(event) => set("fromAccountId", event.target.value)}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.account)}
                aria-describedby={fieldErrors.account ? "tx-account-error" : undefined}
              >
                {accountOptions.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="tx-to">
                Qaysi hisobga
              </label>
              <select
                id="tx-to"
                className={styles.select}
                value={toAccountId}
                onChange={(event) => set("toAccountId", event.target.value)}
                disabled={busy || destinationOptions.length === 0}
                aria-invalid={Boolean(fieldErrors.account)}
                aria-describedby={fieldErrors.account ? "tx-account-error" : undefined}
              >
                {destinationOptions.length === 0 && <option value="">Boshqa hisob yo‘q</option>}
                {destinationOptions.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.account && (
              <p id="tx-account-error" className={styles.fieldError}>
                {fieldErrors.account}
              </p>
            )}
            {!loadingOptions && accountOptions.length < 2 && (
              <p className={styles.hint}>O‘tkazma uchun kamida ikkita hisob kerak.</p>
            )}
          </>
        ) : (
          <>
            <Select
              id="tx-account"
              label="Hisob"
              value={values.accountId}
              onChange={(value) => set("accountId", value)}
              disabled={busy || accountOptions.length === 0}
              placeholder={accountOptions.length === 0 ? "Hisob yo‘q" : undefined}
              options={accountOptions.map((acc) => ({ value: acc.id, label: acc.name }))}
              error={fieldErrors.account}
            />
            {/* 10+ kategoriyada Select o‘zi qidiriladigan Combobox'ga o‘tadi (Design-02) */}
            <Select
              id="tx-category"
              label="Kategoriya"
              value={categoryId}
              onChange={(value) => set("categoryId", value)}
              disabled={busy || relevantCategories.length === 0}
              placeholder={relevantCategories.length === 0 ? "Kategoriya yo‘q" : undefined}
              options={relevantCategories.map((cat) => ({ value: cat.id, label: cat.name }))}
              error={fieldErrors.category}
            />
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-date">
            Sana
          </label>
          <input
            id="tx-date"
            className={styles.input}
            type="date"
            value={values.date}
            max={today}
            onChange={(event) => set("date", event.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.date)}
            aria-describedby={fieldErrors.date ? "tx-date-error" : undefined}
          />
          {fieldErrors.date && (
            <p id="tx-date-error" className={styles.fieldError}>
              {fieldErrors.date}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tx-note">
            Izoh <span className={styles.optional}>· ixtiyoriy</span>
          </label>
          <textarea
            id="tx-note"
            className={styles.textarea}
            value={values.note}
            onChange={(event) => set("note", event.target.value.slice(0, NOTE_MAX_LENGTH))}
            disabled={submitting}
            maxLength={NOTE_MAX_LENGTH}
          />
        </div>

        {slow && (
          <p className={styles.notice} role="status">
            Biroz vaqt olmoqda… Oynani yopmang.
          </p>
        )}

        <div className={styles.actions}>
          <DialogCancelButton disabled={submitting} />
          <Button
            type="submit"
            loading={submitting}
            disabled={loadingOptions || accountOptions.length === 0 || Boolean(conflict)}
          >
            Saqlash
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
