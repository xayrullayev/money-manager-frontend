import {useEffect,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {fetchSavingPlans,type SavingPlan,type SavingsSummary} from "../../shared/api/savings";
import {Button} from "../../shared/ui";
import {formatMoney} from "../../shared/lib/money";
import {PlanCard} from "../savings/PlanCard";
import styles from "./TotalSavingsBlock.module.css";
export function TotalSavingsBlock({summary,balanceHidden}:{summary?:SavingsSummary;balanceHidden:boolean}){
 const [plans,setPlans]=useState<SavingPlan[]>([]);const [busy,setBusy]=useState(true);const [error,setError]=useState(false);const [retry,setRetry]=useState(0);const navigate=useNavigate();
 // Reset request state when the resource changes; stale responses are ignored.
 // eslint-disable-next-line react/set-state-in-effect
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError(false);fetchSavingPlans(false,controller.signal).then(items=>{if(!controller.signal.aborted)setPlans(items.slice(0,3));}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[retry]);
 return <section className={styles.block} aria-labelledby="savings-title"><div className={styles.head}><div><h2 id="savings-title">Jamg‘arma rejalari</h2><p>Jami jamg‘arma</p><strong className={styles.total}>{!summary?"—":balanceHidden?"••••••":formatMoney(summary.totalSavings,summary.currency)}</strong></div><Button onClick={()=>navigate("/savings?new=1")}>+ Reja qo‘shish</Button></div>
 {busy?<p role="status">Rejalar yuklanmoqda…</p>:error?<div role="alert"><p>Jamg‘armalarni yuklab bo‘lmadi.</p><Button variant="secondary" onClick={()=>setRetry(v=>v+1)}>Qayta urinish</Button></div>:plans.length===0?<p>Jamg‘arma rejasi yo‘q — birinchi maqsadingizni yarating.</p>:<div className={styles.plans}>{plans.map(plan=><PlanCard key={plan.id} plan={plan} hidden={balanceHidden} onSelect={()=>navigate(`/savings?plan=${encodeURIComponent(plan.id)}`)}/>)}</div>}
 <Link className={styles.link} to="/savings">Barchasini ko‘rish →</Link></section>;
}
