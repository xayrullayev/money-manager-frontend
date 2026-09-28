import {useEffect,useRef,useState} from "react";
import {Link,useSearchParams} from "react-router-dom";
import {fetchProfile,type Profile} from "../../shared/api/profile";
import {listAccounts,type Account} from "../../shared/api/accounts";
import {listTransactions} from "../../shared/api/transactions";
import {reportSummary,reportCategories,reportTrend,exportCsv,type Summary,type CategoryReport,type TrendReport,type ReportParams} from "../../shared/api/reports";
import {ApiError} from "../../shared/api/client";
import {Button,Input,Select} from "../../shared/ui";
import {reportPreset,reportPeriodSelection,periodError} from "../../shared/lib/reportPeriod";
import {formatMoney} from "../../shared/lib/money";
import styles from "./ReportsPage.module.css";

const money=(value:string,currency:string)=>formatMoney(value,currency).replace(/\u00a0/g," ");
function errorText(error:unknown){if(!navigator.onLine)return "Internetga ulaning. Tanlangan davr saqlanib turibdi.";return error instanceof Error?error.message:"Ma’lumot yuklanmadi.";}
export function ReportsPage(){const [retry,setRetry]=useState(0);return <ReportSetup key={retry} retry={()=>setRetry(n=>n+1)}/>;}
function ReportSetup({retry}:{retry:()=>void}){
 const [data,setData]=useState<{profile:Profile;accounts:Account[]}|null>(null);const [error,setError]=useState("");
 useEffect(()=>{let active=true;Promise.all([fetchProfile(),listAccounts({includeArchived:true})]).then(([profile,accounts])=>{if(active)setData({profile,accounts});}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[]);
 if(error)return <div role="alert"><h1>Hisobot yuklanmadi</h1><p>{error}</p><Button onClick={retry}>Qayta urinish</Button></div>;
 if(!data)return <p role="status">Hisobot sozlamalari yuklanmoqda…</p>;
 return <ReportFilters {...data}/>;
}
function ReportFilters({profile,accounts}:{profile:Profile;accounts:Account[]}){
 const [params,setParams]=useSearchParams();const [revision,setRevision]=useState(0);
 const {from,to,preset}=reportPeriodSelection(params,profile.timezone);
 const account=params.get("account")??"";
 const type=params.get("type")==="INCOME"?"INCOME":"EXPENSE";
 const invalid=periodError(from,to)|| (account&&!accounts.some(a=>a.id===account)?"Havoladagi hisob topilmadi. Boshqa hisobni tanlang.":"");
 function change(values:Record<string,string>){const next=new URLSearchParams(params);Object.entries(values).forEach(([k,v])=>v?next.set(k,v):next.delete(k));setParams(next);}
 return <div className={styles.page}><header><h1>Hisobotlar va eksport</h1><p>Daromad va xarajatlar — {profile.timezone} vaqt mintaqasi bo‘yicha.</p></header>
 <section className={styles.filters} aria-label="Hisobot filtrlari">
 <Select label="Davr" value={preset} onChange={value=>{if(value==="custom")change({preset:value});else change({...reportPreset(value as "this_month"|"last_month"|"this_year",profile.timezone),preset:value});}} options={[{value:"this_month",label:"Bu oy"},{value:"last_month",label:"O‘tgan oy"},{value:"this_year",label:"Bu yil"},{value:"custom",label:"Maxsus davr"}]}/>
 <Input label="Boshlanish sanasi" type="date" value={from} onChange={value=>change({from:value,preset:"custom"})}/>
 <Input label="Tugash sanasi" type="date" value={to} onChange={value=>change({to:value,preset:"custom"})}/>
 <Select label="Hisob" value={account} onChange={value=>change({account:value})} options={[{value:"",label:"Barcha hisoblar (arxiv bilan)"},...accounts.map(a=>({value:a.id,label:a.name+(a.archived?" (arxiv)":"")}))]}/>
 <Select label="Kategoriya tahlili" value={type} onChange={value=>change({type:value})} options={[{value:"EXPENSE",label:"Xarajatlar"},{value:"INCOME",label:"Daromadlar"}]}/>
 </section><p className={styles.hint}>Hisobot va CSV eksporti bir martada ko‘pi bilan 366 kunni qamrab oladi. O‘tkazmalar daromad va xarajat jamlariga kirmaydi.</p>
 {invalid?<p role="alert" className={styles.error}>{invalid}</p>:<ReportData key={`${from}-${to}-${account}-${type}-${revision}`} query={{from,to,...(account?{accountId:account}:{})}} type={type} retry={()=>setRevision(n=>n+1)}/>}
 </div>;
}
function ReportData({query,type,retry}:{query:ReportParams;type:"INCOME"|"EXPENSE";retry:()=>void}){
 const [data,setData]=useState<{summary:Summary;categories:CategoryReport;trend:TrendReport;hasRows:boolean}|null>(null);const [error,setError]=useState("");
 const [hidden,setHidden]=useState(()=>{try{return localStorage.getItem("mm.balanceHidden")==="1";}catch{return false;}});
 useEffect(()=>{let active=true;Promise.all([reportSummary(query),reportCategories(query,type),reportTrend(query),listTransactions({...query,limit:1})]).then(([summary,categories,trend,rows])=>{if(active)setData({summary,categories,trend,hasRows:rows.items.length>0});}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[query,type]);
 if(error)return <div className={styles.panel} role="alert"><h2>Hisobot yuklanmadi</h2><p>{error}</p><Button onClick={retry}>Qayta urinish</Button></div>;
 if(!data)return <div className={styles.panel} role="status">Hisobot yuklanmoqda…</div>;
 const chart = data.categories.items.slice(0,5).map(c=>({name:c.categoryName,percent:c.percent}));
 if(data.categories.items.length>5) chart.push({name:"Boshqalar",percent:data.categories.items.slice(5).reduce((sum,c)=>sum+c.percent,0)});
 const fmt=(value:string)=>hidden?"••••••":money(value,data.summary.currency);
 return <><Button variant="secondary" aria-pressed={hidden} onClick={()=>{const next=!hidden;setHidden(next);try{localStorage.setItem("mm.balanceHidden",next?"1":"0");}catch{/* preference is optional */}}}>{hidden?"Summalarni ko‘rsatish":"Summalarni yashirish"}</Button>
 <div className={styles.metrics}>{[["Daromad",data.summary.income],["Xarajat",data.summary.expense],["Sof farq",data.summary.net]].map(([label,value])=><section className={styles.panel} key={label}><h2>{label}</h2><strong>{fmt(value)}</strong></section>)}</div>
 {!data.hasRows&&<p role="status">Tanlangan davr yoki hisobda operatsiya topilmadi.</p>}
 <section className={styles.panel}><h2>{type==="EXPENSE"?"Xarajat":"Daromad"} kategoriyalari</h2><p>Jami: {fmt(data.categories.total)}</p>
 {!hidden && <div aria-hidden="true" className={styles.chart}>{chart.map(c=><div key={c.name}><span>{c.name}</span><progress max={100} value={Math.min(100,c.percent)}/></div>)}</div>}
 {data.categories.items.length?<table className={styles.table}><caption>Kategoriya bo‘yicha summa va ulush</caption><thead><tr><th>Kategoriya</th><th>Summa</th><th>Ulush</th></tr></thead><tbody>{data.categories.items.map(c=><tr key={c.categoryId}><td><Link to={`/transactions?${new URLSearchParams({from:query.from,to:query.to,type,category:c.categoryId,...(query.accountId?{account:query.accountId}:{})})}`}>{c.categoryName}{c.archived?" (arxiv)":""}</Link></td><td>{fmt(c.amount)}</td><td>{hidden?"—":`${c.percent}%`}</td></tr>)}</tbody></table>:<p>Bu davrda {type==="EXPENSE"?"xarajat":"daromad"} qayd etilmagan.</p>}</section>
 <section className={styles.panel}><h2>Oylar bo‘yicha o‘zgarish</h2><table className={styles.table}><caption>Daromad, xarajat va sof farq</caption><thead><tr><th>Oy</th><th>Daromad</th><th>Xarajat</th><th>Sof farq</th></tr></thead><tbody>{data.trend.points.map(p=><tr key={p.bucket}><td>{p.bucket}</td><td>{fmt(p.income)}</td><td>{fmt(p.expense)}</td><td>{fmt(p.net)}</td></tr>)}</tbody></table></section>
 <CsvExport query={query} hasRows={data.hasRows}/></>;
}
function CsvExport({query,hasRows}:{query:ReportParams;hasRows:boolean}){
 const [busy,setBusy]=useState(false),[slow,setSlow]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
 const abort=useRef<AbortController|null>(null),active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;abort.current?.abort();};},[]);
 async function download(){
  if(abort.current)return;if(!navigator.onLine){setError("Internetga ulaning va qayta urinib ko‘ring.");return;}
  const controller=new AbortController();abort.current=controller;setBusy(true);setError("");setDone(false);
  const timer=setTimeout(()=>{if(active.current)setSlow(true);},10000);
  try{const blob=await exportCsv(query,controller.signal);if(!active.current)return;const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`money-manager_${query.from}_${query.to}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setDone(true);}
  catch(e){if(active.current)setError(e instanceof ApiError&&e.code==="EXPORT_TOO_LARGE"?"Yozuvlar juda ko‘p. Qisqaroq davrni tanlang.":errorText(e));}
  finally{clearTimeout(timer);abort.current=null;if(active.current){setBusy(false);setSlow(false);}}
 }
 return <section className={styles.panel}><h2>CSV yuklab olish</h2><p>Davr: {query.from} — {query.to}. Tanlangan hisob filtri qo‘llanadi. CSV o‘tkazmalarni ham alohida tur sifatida o‘z ichiga oladi.</p><p className={styles.hint}>UTF-8 CSV · ko‘pi bilan 366 kun · telefon va sessiya ma’lumotlari kiritilmaydi.</p><Button loading={busy} disabled={!hasRows} onClick={()=>void download()}>{error?"Eksportni qayta urinish":"CSV yuklab olish"}</Button>{!hasRows&&<p>Bu davrda eksport qilish uchun ma’lumot yo‘q.</p>}{slow&&<p role="status">Fayl tayyorlanishi biroz vaqt olmoqda…</p>}{error&&<p role="alert" className={styles.error}>{error}</p>}{done&&<div role="status"><p>CSV faylni yuklab olish boshlandi.</p><Button variant="ghost" onClick={()=>setDone(false)}>Xabarni yopish</Button></div>}</section>;
}
