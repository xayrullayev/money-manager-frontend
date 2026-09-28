import { useEffect, useRef, useState, type FormEvent } from "react";
import { archiveAccount, createAccount, fetchAccountSummary, listAccounts, unarchiveAccount, updateAccount, type Account, type AccountType } from "../../shared/api/accounts";
import { ApiError } from "../../shared/api/client";
import { toLocalDate } from "../../shared/lib/period";
import { Button } from "../../shared/ui/Button";
import { Dialog, DialogCancelButton } from "../../shared/ui/Dialog";
import { EmptyState } from "../../shared/ui/EmptyState";
import { SkeletonList } from "../../shared/ui/Skeleton";
import { Input } from "../../shared/ui/Input";
import { Select } from "../../shared/ui/Select";
import styles from "./AccountsPage.module.css";

const TYPES: Record<AccountType, string> = { CASH: "Naqd pul", CARD: "Karta", BANK: "Bank hisobi" };
const TYPE_OPTIONS = Object.entries(TYPES).map(([value, label]) => ({ value, label }));
const money = (amount: string, currency: string) => `${amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency}`;
const message = (error: unknown) => (error instanceof ApiError ? error.message : "Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.");

/**
 * Design-07: Hisoblar boshqaruvi. Naqd/karta/bank hisobini yaratish, tahrirlash,
 * arxivlash; boshlang'ich qoldiq daromadga kirmaydi; arxivlangan hisob tarixda
 * saqlanadi, yangi operatsiya kiritilmaydi; "Arxivdan chiqarish" bir bosishda
 * (backend idempotent, ledger o'zgarmaydi).
 */
export function AccountsSection({ baseCurrency }: { baseCurrency: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<Record<string, string>>({});
  const [includeArchived, setIncludeArchived] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<Account | "new" | null>(null);
  const [archiving, setArchiving] = useState<Account | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAccounts({ includeArchived }), fetchAccountSummary(includeArchived)])
      .then(([items, summary]) => {
        if (!cancelled) {
          setAccounts(items);
          setTotals(summary);
          setStatus("ready");
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(message(cause));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [includeArchived, revision]);

  function refresh(text = "") {
    setNotice(text);
    setError("");
    setStatus("loading");
    setRevision((value) => value + 1);
  }

  async function restore(account: Account) {
    if (restoring) return;
    setRestoring(account.id);
    setRestoreError("");
    try {
      await unarchiveAccount(account.id);
      refresh(`"${account.name}" hisobi arxivdan chiqarildi — yangi operatsiyalar yana kiritiladi.`);
    } catch (cause) {
      setRestoreError(message(cause));
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <p>Pullaringiz qayerda saqlanayotganini bir joyda kuzating.</p>
        <Button onClick={() => { setNotice(""); setEditor("new"); }}>+ Hisob qo'shish</Button>
      </div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {restoreError && <p className={styles.error} role="alert">{restoreError}</p>}
      <div className={styles.toolbar}>
        <span>{includeArchived ? "Barcha hisoblar" : "Faol hisoblar"}{status === "ready" ? ` · ${accounts.length}` : ""}</span>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={includeArchived} onChange={(event) => { setStatus("loading"); setIncludeArchived(event.target.checked); }} />
          Arxivlanganlarni ko'rsatish
        </label>
      </div>
      {status === "loading" && <SkeletonList variant="card" rows={2} label="Hisoblar yuklanmoqda…" />}
      {status === "error" && (
        <EmptyState
          tone="error"
          title="Hisoblarni yuklab bo'lmadi"
          description={error}
          action={<Button variant="secondary" onClick={() => refresh()}>Qayta urinish</Button>}
        />
      )}
      {status === "ready" && (
        <>
          <section className={styles.total} aria-label="Hisoblar jami qoldig'i">
            <span>{includeArchived ? "Barcha hisoblar qoldig'i" : "Faol hisoblar qoldig'i"}</span>
            {Object.entries(totals).length ? (
              Object.entries(totals).map(([currency, amount]) => <strong key={currency}>{money(amount, currency)}</strong>)
            ) : (
              <strong>0 {baseCurrency}</strong>
            )}
            <small>Qoldiq barcha qayd etilgan operatsiyalar asosida hisoblanadi.</small>
          </section>
          {accounts.length === 0 ? (
            <EmptyState
              icon="👛"
              title="Hali hisob qo'shilmagan"
              description="Naqd pul, karta yoki bank hisobingizni qo'shib boshlang."
              action={<Button variant="secondary" onClick={() => setEditor("new")}>Birinchi hisobni qo'shish</Button>}
            />
          ) : (
            <div className={styles.grid}>
              {accounts.map((account) => (
                <article className={styles.card} key={account.id}>
                  <div className={styles.cardHeading}>
                    <span className={styles.type}>{TYPES[account.type]}</span>
                    {account.archived && <span className={styles.badge}>Arxivlangan</span>}
                  </div>
                  <h2>{account.name}</h2>
                  <p className={styles.balance}>{money(account.balance, account.currency)}</p>
                  <div className={styles.actions}>
                    {!account.archived ? (
                      <>
                        <Button variant="secondary" onClick={() => setEditor(account)}>Tahrirlash</Button>
                        <Button variant="ghost" onClick={() => setArchiving(account)}>Arxivlash</Button>
                      </>
                    ) : (
                      <>
                        <span className={styles.hint}>Tarix saqlangan. Yangi operatsiyalar kiritilmaydi.</span>
                        <Button
                          variant="secondary"
                          loading={restoring === account.id}
                          disabled={restoring !== null && restoring !== account.id}
                          onClick={() => void restore(account)}
                          aria-label={`"${account.name}" hisobini arxivdan chiqarish`}
                        >
                          Arxivdan chiqarish
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <p className={styles.footnote}>Bu hisoblar pulingizni qayd qilish uchun. Bankka ulanish yoki karta raqamini kiritish talab qilinmaydi.</p>
      {editor && (
        <AccountEditor
          account={editor === "new" ? null : editor}
          currency={baseCurrency}
          onClose={() => setEditor(null)}
          onSaved={() => {
            const created = editor === "new";
            setEditor(null);
            refresh(created ? "Hisob qo'shildi." : "Hisob yangilandi.");
          }}
        />
      )}
      {archiving && (
        <ArchiveDialog account={archiving} onClose={() => setArchiving(null)} onArchived={() => { setArchiving(null); refresh("Hisob arxivlandi. Operatsiyalar tarixi saqlandi."); }} />
      )}
    </div>
  );
}

function AccountEditor({ account, currency, onClose, onSaved }: { account: Account | null; currency: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "CASH");
  const [balance, setBalance] = useState("0");
  const [initialDate] = useState(toLocalDate);
  const [date, setDate] = useState(initialDate);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const dirty = account
    ? name !== account.name || type !== account.type
    : name.trim() !== "" || type !== "CASH" || balance !== "0" || date !== initialDate;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Hisob nomini kiriting.";
    if (!account && !/^-?\d{1,17}(\.\d{1,2})?$/.test(balance)) next.openingBalance = "17 xonagacha son, kasr qismi 2 xonagacha bo'lishi mumkin.";
    if (!account && (!date || date > toLocalDate())) next.openingDate = "Bugungi yoki oldingi sanani tanlang.";
    setFields(next);
    setError("");
    if (Object.keys(next).length) return;
    locked.current = true;
    setBusy(true);
    try {
      if (account) await updateAccount(account.id, { name: name.trim(), type });
      else await createAccount({ name: name.trim(), type, openingBalance: balance, openingDate: date, currency });
      onSaved();
    } catch (cause) {
      setError(message(cause));
      if (cause instanceof ApiError) setFields(cause.fieldErrors ?? {});
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title={account ? "Hisobni tahrirlash" : "Yangi hisob"} onClose={onClose} preventClose={busy} dirty={dirty}>
      <form onSubmit={submit} className={styles.form} noValidate>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Input label="Hisob nomi" value={name} onChange={setName} maxLength={100} disabled={busy} placeholder="Masalan, kundalik karta" error={fields.name} />
        <Select label="Hisob turi" value={type} onChange={(value) => setType(value as AccountType)} options={TYPE_OPTIONS} disabled={busy} />
        {!account ? (
          <>
            <Input
              label={`Boshlang'ich qoldiq (${currency})`}
              value={balance}
              onChange={setBalance}
              inputMode="decimal"
              disabled={busy}
              hint={fields.openingBalance ? undefined : "Qarzdor qoldiq uchun minus ishorasini yozing. Bu summa daromadga kirmaydi."}
              error={fields.openingBalance}
            />
            <Input
              label="Boshlang'ich qoldiq sanasi"
              type="date"
              value={date}
              onChange={setDate}
              max={toLocalDate()}
              disabled={busy}
              error={fields.openingDate}
            />
            <p className={styles.hint}>Valyuta: {currency}. Hisob yaratilgach boshlang'ich qoldiq va sana o'zgartirilmaydi.</p>
          </>
        ) : (
          <p className={styles.hint}>Nom va turni o'zgartirish qoldiq yoki operatsiyalar tarixiga ta'sir qilmaydi.</p>
        )}
        <div className={styles.formActions}>
          <DialogCancelButton disabled={busy} />
          <Button type="submit" loading={busy}>Saqlash</Button>
        </div>
      </form>
    </Dialog>
  );
}

function ArchiveDialog({ account, onClose, onArchived }: { account: Account; onClose: () => void; onArchived: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);

  async function archive() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await archiveAccount(account.id);
      onArchived();
    } catch (cause) {
      setError(message(cause));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog title="Hisobni arxivlash" onClose={onClose} preventClose={busy}>
      <p className={styles.archiveText}>"{account.name}" hisobi faol ro'yxatdan chiqariladi. Qoldiq va operatsiyalar tarixi saqlanadi, yangi operatsiyalar kiritilmaydi. Keyin "Arxivlanganlarni ko'rsatish" orqali arxivdan chiqarishingiz mumkin.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Bekor qilish</Button>
        <Button loading={busy} onClick={() => void archive()}>Arxivlash</Button>
      </div>
    </Dialog>
  );
}
