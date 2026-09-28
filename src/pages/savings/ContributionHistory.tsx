import {useEffect,useRef,useState} from "react";
import {fetchContributions,removeContribution,type SavingContribution,type SavingPlan} from "../../shared/api/savings";
import {Button,useToast} from "../../shared/ui";
import {formatMoney} from "../../shared/lib/money";
import {registerLogoutHook} from "../../shared/lib/sessionCleanup";
import {savingError} from "./errors";
import styles from "./SavingPlansPage.module.css";
const labels={CONTRIBUTION:"Hissa",WITHDRAWAL:"Yechish",REVERSAL:"Bekor qilish"};
export function ContributionHistory({plan,hidden,onChanged}:{plan:SavingPlan;hidden:boolean;onChanged:()=>void}) {
 const [rows,setRows]=useState<SavingContribution[]>([]);const [cursor,setCursor]=useState<string>();const [busy,setBusy]=useState(true);const [error,setError]=useState("");const [retry,setRetry]=useState(0);const [pending,setPending]=useState<string[]>([]);const {showToast}=useToast();
 const alive=useRef(true);const nextLock=useRef(false);const pendingIds=useRef(new Set<string>());const commits=useRef(new Set<()=>Promise<void>>());
 useEffect(()=>{alive.current=true;const pendingCommits=commits.current;const unregister=registerLogoutHook(async()=>{await Promise.allSettled([...pendingCommits].map(fn=>fn()));});return()=>{alive.current=false;void Promise.allSettled([...pendingCommits].map(fn=>fn())).finally(unregister);};},[]);
 // Reset request state when the resource changes; stale responses are ignored.
 // eslint-disable-next-line react/set-state-in-effect
 useEffect(()=>{const controller=new AbortController();setBusy(true);setError("");fetchContributions(plan.id,undefined,20,controller.signal).then(page=>{if(!controller.signal.aborted){setRows(page.items);setCursor(page.nextCursor);}}).catch(e=>{if(!controller.signal.aborted)setError(savingError(e));}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[plan.id,retry]);
 async function more(){if(nextLock.current||!cursor)return;nextLock.current=true;setBusy(true);setError("");try{const page=await fetchContributions(plan.id,cursor);if(alive.current){setRows(old=>[...old,...page.items.filter(x=>!old.some(y=>y.id===x.id))]);setCursor(page.nextCursor);}}catch(e){if(alive.current)setError(savingError(e));}finally{nextLock.current=false;if(alive.current)setBusy(false);}}
 function remove(row:SavingContribution){if(pendingIds.current.has(row.id))return;pendingIds.current.add(row.id);setPending([...pendingIds.current]);let done=false;let promise:Promise<void>|undefined;
 const clear=()=>{pendingIds.current.delete(row.id);if(alive.current)setPending([...pendingIds.current]);};
 const commit=()=>{if(promise)return promise;if(done)return Promise.resolve();done=true;promise=(async()=>{try{await removeContribution(plan.id,row.id);if(alive.current)onChanged();}catch(e){showToast(savingError(e),"error");}finally{commits.current.delete(commit);clear();}})();return promise;};
 commits.current.add(commit);showToast("Yozuv bekor qilinadi.","info",6000,{action:{label:"Qaytarish",onClick:()=>{if(done)return;done=true;commits.current.delete(commit);clear();}},onDismiss:reason=>{if(reason!=="action")void commit();}});
 }
 return <section className={styles.panel}><h2>Hissalar tarixi</h2>{error&&<div role="alert"><p>{error}</p><Button variant="secondary" onClick={()=>setRetry(v=>v+1)}>Qayta urinish</Button></div>}
 {!busy&&!error&&rows.length===0&&<p className={styles.empty}>Hozircha yozuv yo‘q. Birinchi hissangizni qo‘shing.</p>}
 {rows.length>0&&<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Amal</th><th>Sana</th><th>Summa</th><th>Izoh</th><th><span className={styles.srOnly}>Boshqarish</span></th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{labels[row.kind]}</td><td>{row.occurredOn}</td><td className={row.amount.startsWith("-")?styles.debit:undefined}>{hidden?"••••••":`${row.amount.startsWith("-")?"−":"+"} ${formatMoney(row.amount.replace(/^-/,""),plan.currency)}`}</td><td>{row.note||"—"}</td><td>{row.kind!=="REVERSAL"&&!plan.archived&&<Button variant="ghost" disabled={pending.includes(row.id)} onClick={()=>remove(row)} aria-label={`${row.occurredOn} ${labels[row.kind]} yozuvini bekor qilish`}>{pending.includes(row.id)?"Kutilmoqda…":"Bekor qilish"}</Button>}</td></tr>)}</tbody></table></div>}
 {busy&&<p role="status">Yuklanmoqda…</p>}{cursor&&<Button variant="secondary" onClick={()=>void more()} disabled={busy}>Yana yuklash</Button>}
 </section>;
}
