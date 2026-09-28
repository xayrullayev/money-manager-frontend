import { useEffect, useRef, useState, type FormEvent } from "react";
import { createBudget, updateBudget, type Budget } from "../../shared/api/budgets";
import type { Category } from "../../shared/api/categories";
import { ApiError } from "../../shared/api/client";
import { Button, Dialog, DialogCancelButton, Input, Select } from "../../shared/ui";
import { validLimit } from "../../shared/lib/budgets";
import styles from "./BudgetsPage.module.css";

export function BudgetEditor({ budget, month, currency, categories, onClose, onSaved }: {
  budget: Budget | null; month: string; currency: string; categories: Category[];
  onClose: () => void; onSaved: () => void;
}) {
  const [category, setCategory] = useState(budget?.categoryId ?? "");
  const [limit, setLimit] = useState(budget?.limit ?? "");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const dirty = category !== (budget?.categoryId ?? "") || limit !== (budget?.limit ?? "");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return;
    const next: Record<string, string> = {};
    if (!category) next.categoryId = "Xarajat kategoriyasini tanlang.";
    if (!validLimit(limit)) next.limit = "Musbat summa kiriting: 17 ta butun va 2 tagacha kasr raqami.";
    setFields(next); setError(""); if (Object.keys(next).length) return;
    if (!navigator.onLine) { setError("Internetga ulaning. Kiritilgan ma’lumotlar saqlanib turibdi."); return; }
    lock.current = true; setBusy(true); setSlow(false);
    const timer = setTimeout(() => { if (mounted.current) setSlow(true); }, 5000);
    try {
      if (budget) await updateBudget(budget.id, limit);
      else await createBudget({ categoryId: category, month, limit });
      if (mounted.current) onSaved();
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof ApiError ? (cause.code === "BUDGET_EXISTS" ? "Bu kategoriya uchun shu oyda limit allaqachon mavjud. Ro‘yxatni yangilab, mavjud limitni tahrirlang." : cause.message) : "Limit saqlanmadi. Qayta urinib ko‘ring.");
        if (cause instanceof ApiError) setFields(cause.fieldErrors ?? {});
      }
    } finally { clearTimeout(timer); lock.current = false; if (mounted.current) { setBusy(false); setSlow(false); } }
  }
  return <Dialog title={budget ? "Limitni tahrirlash" : "Oylik limit qo‘shish"} onClose={onClose} preventClose={busy} dirty={dirty} discardMessage="Saqlanmagan o‘zgarishlarni bekor qilasizmi?">
    <form onSubmit={submit} className={styles.form} noValidate>
      <p>Oy: <strong>{month}</strong></p>
      {budget ? <p>Kategoriya: <strong>{budget.categoryName}</strong></p> : <Select label="Xarajat kategoriyasi" value={category} onChange={setCategory} disabled={busy} error={fields.categoryId} placeholder="Kategoriyani tanlang" options={categories.map(c => ({value:c.id,label:c.name}))} />}
      <Input label={`Oylik limit (${currency})`} value={limit} onChange={setLimit} inputMode="decimal" disabled={busy} maxLength={20} error={fields.limit} hint="Masalan, 1500000 yoki 1500000.50" />
      <p className={styles.hint}>Limit hisobdagi pulni o‘zgartirmaydi. U tanlangan oydagi xarajatlarni kuzatish uchun.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {slow && <p role="status">Saqlash biroz vaqt olmoqda…</p>}
      <div className={styles.actions}><DialogCancelButton disabled={busy} /><Button type="submit" loading={busy}>Saqlash</Button></div>
    </form>
  </Dialog>;
}
