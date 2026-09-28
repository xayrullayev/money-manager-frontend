import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProfile, type Profile } from "../../shared/api/profile";
import { listBudgets, deleteBudget, type Budget } from "../../shared/api/budgets";
import { listCategories, type Category } from "../../shared/api/categories";
import { ApiError } from "../../shared/api/client";
import { Button, Dialog, Input } from "../../shared/ui";
import { currentMonth, isMonth, monthRange, budgetState } from "../../shared/lib/budgets";
import { formatMoney } from "../../shared/lib/money";
import { UZ_MONTHS } from "../../shared/lib/uzDate";
import { BudgetEditor } from "./BudgetEditor";
import styles from "./BudgetsPage.module.css";

function message(cause: unknown) { return !navigator.onLine ? "Internetga ulaning va qayta urinib ko‘ring." : cause instanceof ApiError ? cause.message : "Ma’lumot yuklanmadi. Qayta urinib ko‘ring."; }
export function BudgetsPage() {
  const [attempt, setAttempt] = useState(0);
  return <ProfileLoader key={attempt} retry={() => setAttempt(n => n + 1)} />;
}
function ProfileLoader({ retry }: { retry: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchProfile().then(value => { if(active) setProfile(value); }).catch(cause => { if(active) setError(message(cause)); });
    return () => { active = false; };
  }, []);
  if (error) return <div className={styles.state} role="alert"><h1>Budjetlar yuklanmadi</h1><p>{error}</p><Button onClick={retry}>Qayta urinish</Button></div>;
  if (!profile) return <Loading />;
  return <BudgetMonth profile={profile} />;
}
function BudgetMonth({ profile }: { profile: Profile }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("month");
  const month = raw && isMonth(raw) ? raw : currentMonth(profile.timezone);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem("mm.balanceHidden") === "1"; } catch { return false; } });
  const title = `${UZ_MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0,4)}`;
  function refresh(text = "") { setNotice(text); setRevision(n => n+1); }
  return <div className={styles.page}>
    <header className={styles.header}><div><h1>Oylik budjetlar</h1><p>Xarajatlaringiz uchun kategoriya bo‘yicha limit belgilang.</p></div><Button variant="secondary" aria-pressed={hidden} onClick={() => { const next = !hidden; setHidden(next); try { localStorage.setItem("mm.balanceHidden", next ? "1" : "0"); } catch { /* In-memory preference remains available. */ } }}>{hidden ? "Summalarni ko‘rsatish" : "Summalarni yashirish"}</Button></header>
    <div className={styles.toolbar}><Input label="Budjet oyi" type="month" value={month} min="0001-01" max="9999-12" onChange={value => { if(isMonth(value)) { const next=new URLSearchParams(params); next.set("month",value); setParams(next); setNotice(""); } }} /><p>{profile.timezone} · {title}</p></div>
    {raw && !isMonth(raw) && <p role="status">Havoladagi oy noto‘g‘ri. Joriy oy ko‘rsatilmoqda.</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <MonthContent key={`${month}-${revision}`} month={month} currency={profile.baseCurrency} hidden={hidden} refresh={refresh} />
    <p className={styles.hint}>Faqat xarajatlar hisoblanadi. O‘tkazmalar va boshlang‘ich qoldiq budjet sarfiga kirmaydi. Qolgan yoki oshgan summa keyingi oyga o‘tmaydi.</p>
  </div>;
}
function MonthContent({ month, currency, hidden, refresh }: {month:string;currency:string;hidden:boolean;refresh:(text?:string)=>void}) {
  const [data, setData] = useState<{budgets:Budget[];categories:Category[]} | null>(null);
  const [error,setError]=useState("");
  const [editor,setEditor]=useState<Budget | "new" | null>(null);
  const [deleting,setDeleting]=useState<Budget | null>(null);
  useEffect(()=>{
    let active=true;
    Promise.all([listBudgets(month),listCategories({type:"EXPENSE"})]).then(([budgets,categories])=>{if(active)setData({budgets,categories});}).catch(cause=>{if(active)setError(message(cause));});
    return ()=>{active=false;};
  },[month]);
  if(error)return <div className={styles.state} role="alert"><h2>Budjetlar yuklanmadi</h2><p>{error}</p><Button variant="secondary" onClick={()=>refresh()}>Qayta urinish</Button></div>;
  if(!data)return <Loading />;
  const available=data.categories.filter(c=>!c.archived&&!data.budgets.some(b=>b.categoryId===c.id));
  const money=(value:string)=>hidden?"••••••":formatMoney(value,currency).replace(/\u00a0/g," ");
  const range=monthRange(month);
  return <>
    <div className={styles.toolbar}><p aria-live="polite">{data.budgets.length} ta kategoriya uchun limit</p><Button disabled={!available.length} onClick={()=>setEditor("new")}>+ Limit qo‘shish</Button></div>
    {!available.length && <p className={styles.hint}>{data.categories.length ? "Barcha faol xarajat kategoriyalariga limit qo‘yilgan." : "Limit qo‘yish uchun avval xarajat kategoriyasini yarating."} {!data.categories.length && <Link to="/accounts">Kategoriyalarga o‘tish</Link>}</p>}
    {!data.budgets.length ? <section className={styles.state}><h2>Bu oy uchun budjet belgilanmagan</h2><p>Xarajatlarni nazorat qilish uchun kategoriya tanlab, oylik limit qo‘shing.</p></section> : <div className={styles.grid}>{data.budgets.map(b=>{
      const state=budgetState(b.utilizationPercent, b.exceeded);
      const url=new URLSearchParams({...range,type:"EXPENSE",category:b.categoryId});
      return <article key={b.id} className={styles.card}>
        <h2><Link to={`/transactions?${url}`}>{b.categoryName}</Link></h2>
        <p className={state==="exceeded"?styles.exceeded:styles.hint}>{state==="exceeded"?"⚠ Limitdan oshgan":state==="near"?"⚠ Limitga yaqin":"Limit doirasida"}</p>
        <dl className={styles.amounts}><div><dt>Sarflangan</dt><dd>{money(b.spent)}</dd></div><div><dt>Oylik limit</dt><dd>{money(b.limit)}</dd></div></dl>
        {!hidden && <><progress className={state==="exceeded"?styles.dangerProgress:styles.progress} max={100} value={Math.min(100,Math.max(0,b.utilizationPercent))} aria-label={`${b.categoryName} budjet sarfi`} aria-valuetext={`${b.utilizationPercent}% sarflangan`} /><div className={styles.progressLabel}><span>{b.utilizationPercent}% sarflangan</span><span>Limit 100%</span></div></>}
        <p className={state==="exceeded"?styles.exceeded:styles.hint}>{b.exceeded?`Oshgan: +${money(b.remaining.replace(/^-/,""))}`:`Qolgan: ${money(b.remaining)}`}</p>
        <div className={styles.actions}><Button variant="secondary" onClick={()=>setEditor(b)}>Tahrirlash</Button><Button variant="ghost" onClick={()=>setDeleting(b)}>Limitni olib tashlash</Button></div>
      </article>;
    })}</div>}
    {editor && <BudgetEditor budget={editor==="new"?null:editor} month={month} currency={currency} categories={available} onClose={()=>setEditor(null)} onSaved={()=>refresh("Limit saqlandi. Sarf ma’lumotlari yangilanmoqda.")} />}
    {deleting && <DeleteLimit budget={deleting} onClose={()=>setDeleting(null)} onDeleted={()=>refresh("Limit olib tashlandi. Operatsiyalar tarixi saqlangan.")} />}
  </>;
}
function DeleteLimit({budget,onClose,onDeleted}:{budget:Budget;onClose:()=>void;onDeleted:()=>void}) {
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");const lock=useRef(false);
  async function remove(){if(lock.current)return;if(!navigator.onLine){setError("Internetga ulaning va qayta urinib ko‘ring.");return;}lock.current=true;setBusy(true);setError("");try{await deleteBudget(budget.id);onDeleted();}catch(cause){setError(message(cause));}finally{lock.current=false;setBusy(false);}}
  return <Dialog title="Limitni olib tashlash" onClose={onClose} preventClose={busy}><p>“{budget.categoryName}” uchun {budget.month} oyidagi limit olib tashlanadi. Xarajatlar va hisob qoldig‘i o‘zgarmaydi.</p>{error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.actions}><Button variant="secondary" data-autofocus disabled={busy} onClick={onClose}>Bekor qilish</Button><Button loading={busy} onClick={()=>void remove()}>Limitni olib tashlash</Button></div></Dialog>;
}
function Loading(){return <div className={styles.state} role="status"><p>Budjetlar yuklanmoqda…</p><div className={styles.skeleton} aria-hidden="true"/><div className={styles.skeleton} aria-hidden="true"/></div>;}
