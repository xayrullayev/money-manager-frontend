import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { Link, Outlet, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Badge, Button, Card, Dialog, EmptyState, Input, Select, SkeletonList, Tabs, useToast } from '../../shared/ui';
import { AccountsIcon, ArrowLeftIcon, ReportsIcon, SearchIcon } from '../../app/navIcons';
import { Receipt, Coins } from '../styleguide/sguiIcons';
import { categoryNames, groups, items, money, ranks, totals, validateReceiptLink, type CheckItem } from './checkModel';
import styles from './ChecksDesign.module.css';

type View = 'history' | 'detail' | 'analytics';
type Scenario = 'ready' | 'empty' | 'loading' | 'unavailable' | 'duplicate' | 'review';
const tabs = [{value:'history',label:'Cheklar tarixi'},{value:'analytics',label:'Xaridlar tahlili'}];
const scenarios = [{value:'ready',label:'Tayyor chek'},{value:'empty',label:'Bo‘sh holat'},{value:'loading',label:'Yuklanmoqda'},{value:'unavailable',label:'Manba javob bermadi'},{value:'duplicate',label:'Takroriy chek'},{value:'review',label:'Tekshirish kerak'}];
const palette = ['green','orange','teal','purple','blue','pink','brown','gray'];
/** Namunaviy chek identifikatori — tafsilot sahifasi URL'i: /checks/:id */
export const SAMPLE_CHECK_ID = 'korzinka-2026-09-28';

/** Sahifalar orasida umumiy holat (layout → Outlet). */
interface ChecksContext {
 base: string;
 rows: CheckItem[]; setRows: Dispatch<SetStateAction<CheckItem[]>>;
 empty: boolean; saved: boolean;
 query: string; setQuery: (v: string) => void;
 period: string; setPeriod: (v: string) => void;
 metric: string; setMetric: (v: string) => void;
 openImport: () => void; openPosting: () => void;
 go: (view: View) => void;
}
const useChecks = () => useOutletContext<ChecksContext>();

/**
 * Cheklar bo'limi layout'i: umumiy sarlavha, "Chek qo‘shish", umumiy ko'rsatkichlar,
 * bo'lim tablari va dialoglar. Har bir bo'lim alohida route:
 *  - `{base}`            — cheklar tarixi (ro'yxat)
 *  - `{base}/analytics`  — xaridlar tahlili
 *  - `{base}/:id`        — chek tafsiloti
 */
export function ChecksDesignPage({ preview = false }: { preview?: boolean }) {
 const base = preview ? '/design/checks' : '/checks';
 const { pathname } = useLocation();
 const routerNavigate = useNavigate();
 const view: View = pathname === `${base}/analytics` ? 'analytics' : pathname.replace(/\/+$/, '') === base ? 'history' : 'detail';
 const [scenario,setScenario]=useState<Scenario>('ready');
 const [rows,setRows]=useState(items);
 const [period,setPeriod]=useState('month');
 const [metric,setMetric]=useState('amount');
 const [query,setQuery]=useState('');
 const [importing,setImporting]=useState(false);
 const [saved,setSaved]=useState(false);
 const [posting,setPosting]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const {showToast}=useToast();
 const grouped=groups(rows);
 const empty=scenario==='empty';
 const displayTotal=empty?0:totals.net;
 useEffect(()=>{document.title=`${view==='detail'?'Chek tafsiloti':view==='analytics'?'Xaridlar tahlili':'Cheklar'} · Money Manager`;},[view]);
 function go(next:View){routerNavigate(next==='history'?base:next==='analytics'?`${base}/analytics`:`${base}/${SAMPLE_CHECK_ID}`); requestAnimationFrame(()=>heading.current?.focus());}
 function showSample(){setImporting(false);setScenario(saved?'duplicate':'ready');go('detail');}
 function reset(){setRows(items);setSaved(false);setScenario('ready');setQuery('');go('history');}
 const ctx: ChecksContext = {base,rows,setRows,empty,saved,query,setQuery,period,setPeriod,metric,setMetric,openImport:()=>setImporting(true),openPosting:()=>setPosting(true),go};
 return <div className={`${styles.root} ${preview?styles.preview:''}`}>
  {preview&&<div className={styles.previewNav}><Link to="/style-guide/components"><span className={styles.brandMark}>M</span> Money Manager</Link><Link to="/style-guide/components">Style &amp; Component ↗</Link></div>}
  <div className={styles.demoNote}><Badge tone="accent">Dizayn namoyishi</Badge><span>Namunaviy chek. Haqiqiy hisoblaringiz o‘zgarmaydi.</span></div>
  <header className={styles.pageHeader}><div><p className={styles.eyebrow}>XARAJATLARINGIZ, TAFSILOTLARI BILAN</p><h1 ref={heading} tabIndex={-1}>{view==='detail'?'Chek tafsiloti':view==='analytics'?'Xaridlar tahlili':'Cheklar'}</h1><p className={styles.muted}>{view==='detail'?'Har bir xarid o‘z joyida. Summalar va kategoriyalarni ko‘rib chiqing.':view==='analytics'?'Pulingiz qaysi kategoriya va mahsulotlarga ketayotganini ko‘ring.':'Xaridlaringizni saqlang. Pulingiz nimalarga ketayotganini biling.'}</p></div><Button onClick={()=>setImporting(true)}><span className={styles.buttonContent}><span aria-hidden="true">＋</span> Chek qo‘shish</span></Button></header>
  {view!=='detail'&&<>
   <div className={styles.overview}>
    <section className={styles.balance}><div className={styles.balanceTop}><span>Cheklar bo‘yicha xarajat</span><Receipt size={24}/></div><div className={styles.bigAmount}>{money(displayTotal)} <span>so‘m</span></div><div className={styles.balanceBottom}><span>Sentabr 2026</span><span className={styles.lightPill}>{empty?'0':'1'} ta namuna chek</span></div></section>
    <Card className={styles.stat}><span className={styles.statIcon}><ReportsIcon/></span><p>Xarid qatorlari</p><strong>{empty?'0':'26'} <small>ta mahsulot</small></strong><span className={styles.muted}>{empty?'Hali xarid yo‘q':`${grouped.length} ta kategoriyaga ajratildi`}</span></Card>
    <Card className={styles.stat}><span className={styles.statIcon}><Coins size={22}/></span><p>Chegirmalar</p><strong>{money(empty?0:totals.discount)} <small>so‘m</small></strong><span className={styles.muted}>Yakuniy summadan ayirilgan</span></Card>
   </div>
   <div className={styles.sectionNav}><Tabs items={tabs} value={view} onChange={v=>go(v as View)} ariaLabel="Cheklar bo‘limi"/><span className={styles.periodLabel}>28 sentabr — 4 oktabr / Sentabr 2026</span></div>
  </>}
  {(scenario==='duplicate'||scenario==='review')&&<div className={styles.notice} role="status"><strong>{scenario==='duplicate'?'Bu chek avval qo‘shilgan.':'Ayrim o‘lchov birliklarini tekshirish kerak.'}</strong><span>{scenario==='duplicate'?'Yangi xarajat yaratilmaydi. Mavjud chekni ko‘ryapsiz.':'Summa to‘g‘ri. Shubhali miqdorlar vazn bo‘yicha tahlilga kiritilmaydi.'}</span></div>}
  {scenario==='loading'?<Card><SkeletonList rows={5} label="Chek ma’lumotlari yuklanmoqda…"/></Card>:scenario==='unavailable'?<Card><EmptyState title="Chekni hozir yuklab bo‘lmadi" description="OFD javob bermayapti. Havolangizni tekshiring yoki keyinroq qayta urinib ko‘ring." tone="error" action={<Button onClick={()=>setScenario('ready')}>Namuna natijasiga qaytish</Button>}/></Card>:<Outlet context={ctx}/>}
  <details className={styles.designTools}><summary>Namoyish holatlari</summary><div><Select label="Ekran holati" value={scenario} options={scenarios} onChange={v=>{setScenario(v as Scenario);if(v==='empty')go('history');}}/><Button variant="secondary" onClick={reset}>Namunani tiklash</Button><span>Ushbu boshqaruvlar faqat dizaynni ko‘rib chiqish uchun.</span></div></details>
  {importing&&<ImportDialog onClose={()=>setImporting(false)} onSample={showSample}/>}
  {posting&&<PostingDialog onClose={()=>setPosting(false)} onSave={mode=>{setSaved(true);setPosting(false);showToast(mode==='link'?'Namuna mavjud xarajatga biriktirildi. Haqiqiy hisob o‘zgarmadi.':'Namuna saqlandi. Haqiqiy hisob o‘zgarmadi.','success');}}/>}
 </div>;
}

/** `{base}` — cheklar tarixi ro'yxati. */
export function ChecksHistoryView(){
 const {empty,saved,query,setQuery,openImport,go}=useChecks();
 return <div id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history" className={styles.historyLayout}>
   <Card className={styles.historyCard} title="Xaridlar tarixi" titleId="checks-history-title" action={<Badge>{empty?'0':'1'} ta chek</Badge>}>
    <div className={styles.search}><Input label="Chek qidirish" placeholder="Do‘kon yoki sana bo‘yicha qidiring" value={query} onChange={setQuery} prefix={<SearchIcon/>}/></div>
    {empty||!('korzinka 28.09.2026'.includes(query.toLowerCase().trim()))?<EmptyState title={empty?'Birinchi chekingizni qo‘shing':'Chek topilmadi'} description={empty?'QR kodni skanerlang yoki chek havolasini kiriting. Qolgan tafsilotlar bitta joyda bo‘ladi.':'Boshqa do‘kon nomi yoki sana bilan qidiring.'} icon={<Receipt size={36}/>} action={<Button onClick={()=>empty?openImport():setQuery('')}>{empty?'Chek qo‘shish':'Qidiruvni tozalash'}</Button>}/>:<>
     <div className={styles.tableHead}><span>Do‘kon / sana</span><span>Holat</span><span>Jami</span><span/></div>
     <button className={styles.receiptRow} onClick={()=>go('detail')}><span className={styles.store}><span className={styles.storeMark}>K</span><span><strong>Korzinka</strong><small>28.09.2026 · 21:25</small></span></span><Badge tone={saved?'success':'neutral'}>{saved?'Saqlangan':'Ko‘rib chiqish'}</Badge><span className={styles.rowAmount}>{money(totals.net)}<small>so‘m · 26 qator</small></span><span aria-hidden="true">↗</span></button>
     <div className={styles.tableFooter}><span>1 tadan 1 ta chek ko‘rsatilmoqda</span><Button variant="ghost" onClick={()=>go('detail')}>Batafsil ko‘rish →</Button></div>
    </>}
   </Card>
   <aside className={styles.tipCard}><span className={styles.tipIcon}><Receipt size={30}/></span><p className={styles.eyebrow}>BITTA CHEK. KO‘PROQ ANIQLIK.</p><h2>Mayda xaridlar ham<br/>e’tibordan chetda qolmasin.</h2><p>Meva, sut yoki yo‘ldagi ichimlik. Chekingizdagi har bir mahsulotni o‘z kategoriyasida ko‘ring.</p><Button variant="ghost" onClick={()=>go('analytics')}>Xaridlar tahlili <span aria-hidden="true">↗</span></Button></aside>
  </div>;
}

/** `{base}/:id` — chek tafsiloti. */
export function ChecksDetailView(){
 const {id}=useParams();
 const {rows,setRows,saved,openPosting,go}=useChecks();
 const grouped=groups(rows);
 if(id!==SAMPLE_CHECK_ID)return <Card><EmptyState title="Chek topilmadi" description="Havola noto‘g‘ri yoki chek o‘chirilgan bo‘lishi mumkin." action={<Button onClick={()=>go('history')}>Cheklar tarixiga</Button>}/></Card>;
 return <>
   <Button variant="ghost" onClick={()=>go('history')}><span className={styles.buttonContent}><ArrowLeftIcon/> Cheklar tarixiga</span></Button>
   <div className={styles.detailLayout}>
    <section className={styles.detailItems}><Card title="Xarid qilingan mahsulotlar" titleId="items-title" action={<Badge>26 qator</Badge>}><p className={styles.muted}>Kategoriya bo‘yicha ajratilgan · summalar chegirmadan keyin</p>
     {grouped.map((group,index)=><details key={group.name} className={styles.group} open={index===0||index===1||undefined}><summary><span className={styles.categoryDot} style={{background:`var(--category-${palette[index%palette.length]}-bg)`,color:`var(--category-${palette[index%palette.length]})`}}><Receipt size={18}/></span><span className={styles.groupName}>{group.name}<small>{group.items.length} ta qator</small></span><strong>{money(group.total)} <small>so‘m</small></strong><span className={styles.chevron} aria-hidden="true">⌄</span></summary>
      {group.items.map(item=><ItemRow key={item.id} item={item} onCategory={category=>setRows(current=>current.map(row=>row.id===item.id?{...row,category}:row))}/>)}
     </details>)}
    </Card></section>
    <aside className={styles.receiptAside}><Card className={styles.paper}><div className={styles.paperHeader}><span className={styles.storeMark}>K</span><h2>Korzinka</h2><p>Namuna savdo cheki</p><Badge tone={saved?'success':'accent'}>{saved?'Namuna saqlandi':'Xarajatga tayyor'}</Badge></div><dl className={styles.facts}><div><dt>Sana</dt><dd>28.09.2026</dd></div><div><dt>Vaqt</dt><dd>21:25</dd></div><div><dt>To‘lov turi</dt><dd>Naqd pul</dd></div></dl><dl className={styles.facts}><div><dt>Mahsulotlar summasi</dt><dd>{money(totals.gross)}</dd></div><div className={styles.saving}><dt>Chegirma</dt><dd>−{money(totals.discount)}</dd></div><div><dt>Shu jumladan QQS</dt><dd>48 486,09</dd></div></dl><div className={styles.totalLine}><span>Jami to‘lov</span><strong>{money(totals.net)}<small> so‘m</small></strong></div><Button fullWidth disabled={saved} onClick={openPosting}>{saved?'✓ Namuna saqlandi':'Xarajatga saqlash'}</Button><p className={styles.caption}>Namoyishda haqiqiy hisob o‘zgarmaydi.</p></Card><div className={styles.asideNote}><strong>Summalar tekshirildi</strong><p>471 856 − 19 319 = 452 537 so‘m. QQS jami summaga kiritilgan.</p><span>3 qatorda o‘lchov birligi aniqlashtiriladi.</span></div></aside>
   </div>
  </>;
}

/** `{base}/analytics` — xaridlar tahlili. */
export function ChecksAnalyticsView(){
 const {rows,empty,period,setPeriod,metric,setMetric}=useChecks();
 const grouped=groups(rows);
 const ranking=ranks(rows).sort((a,b)=>metric==='frequency'?b.count-a.count||b.amount-a.amount:b.amount-a.amount).slice(0,5);
 return <div id="tabpanel-analytics" role="tabpanel" aria-labelledby="tab-analytics" className={styles.analytics}>
   <Card title="Nimalarga sarfladingiz?" titleId="category-chart-title"><div className={styles.chartControls}><Tabs items={[{value:'week',label:'Haftalik'},{value:'month',label:'Oylik'}]} value={period} onChange={setPeriod} ariaLabel="Hisobot davri"/><span>{period==='week'?'28 sentabr — 4 oktabr 2026':'1–30 sentabr 2026'}</span></div><div role="tabpanel" id={`tabpanel-${period}`} aria-labelledby={`tab-${period}`}>
    {empty?<EmptyState title="Bu davrda xaridlar yo‘q" description="Chek qo‘shilganidan so‘ng kategoriyalar shu yerda ko‘rinadi."/>:<><div className={styles.stackedBar} aria-hidden="true">{grouped.map((g,i)=><span key={g.name} style={{width:`${g.total/totals.net*100}%`,background:`var(--category-${palette[i%palette.length]})`}}/>)}</div><div className={styles.chartLegend}>{grouped.map((g,i)=><div key={g.name}><span className={styles.legendName}><i style={{background:`var(--category-${palette[i%palette.length]})`}}/>{g.name}</span><strong>{money(g.total)} <small>so‘m</small></strong><span>{(g.total/totals.net*100).toFixed(1)}%</span></div>)}</div></>}
   </div><p className={styles.caption}>Faqat 1 ta namuna chek asosida. Barcha xarajatlaringizni ifodalamaydi.</p></Card>
   <Card title="Eng ko‘p xarid qilingan" titleId="ranking-title"><Tabs items={[{value:'amount',label:'Summa bo‘yicha'},{value:'frequency',label:'Xaridlar soni'}]} value={metric} onChange={setMetric} ariaLabel="Reyting turi"/><div role="tabpanel" id={`tabpanel-${metric}`} aria-labelledby={`tab-${metric}`}>
    {empty?<EmptyState title="Reyting hali shakllanmagan" compact/>:<ol className={styles.ranking}>{ranking.map((r,i)=><li key={r.code}><span className={styles.rankNumber}>{String(i+1).padStart(2,'0')}</span><div><span>{r.name}</span><div className={styles.rankTrack} aria-hidden="true"><i style={{width:`${metric==='frequency'?100:r.amount/ranking[0].amount*100}%`}}/></div></div><strong>{metric==='frequency'?`${r.count} marta`:money(r.amount)}{metric==='amount'&&<small>so‘m</small>}</strong></li>)}</ol>}
   </div><p className={styles.caption}>{metric==='frequency'?'Bir chekdagi bir xil mahsulot bir marta sanaladi. Teng natijalar summaga ko‘ra tartiblangan.':'Chegirmadan keyingi sof xarajatlar. Bir xil MXIK qatorlari birlashtirilgan.'}</p></Card>
  </div>;
}

function ItemRow({item,onCategory}:{item:CheckItem;onCategory:(category:string)=>void}){
 return <div className={styles.item}><div><strong>{item.name}</strong><p>{item.quantity} {item.unit}{item.review&&<span className={styles.warning}> · Birlikni tekshiring</span>}</p><details className={styles.itemMeta}><summary>Mahsulot tafsiloti</summary><div><span>MXIK: <code>{item.code}</code></span>{item.discount>0&&<span>Chegirma: {money(item.discount)} so‘m</span>}{item.review&&<span>Chekdagi miqdor va nom bir-biriga mos kelmasligi mumkin. Vazn tahliliga kiritilmaydi.</span>}<Select label={`${item.name} kategoriyasi`} value={item.category} options={categoryNames.map(c=>({value:c,label:c}))} onChange={onCategory}/></div></details></div><strong className={styles.itemAmount}>{money(item.net)}<small>so‘m</small></strong></div>;
}

function ImportDialog({onClose,onSample}:{onClose:()=>void;onSample:()=>void}){
 const [method,setMethod]=useState('link');
 const [url,setUrl]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [camera,setCamera]=useState<'idle'|'denied'>('idle');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function sample(){setBusy(true);timer.current=setTimeout(onSample,850);}
 function submit(event:FormEvent){event.preventDefault();const issue=validateReceiptLink(url);if(issue){setError(issue);return;}setError('Bu dizayn namoyishi: havola yuklanmaydi. Quyidagi namuna chekni oching.');}
 return <Dialog title="Chek qo‘shish" onClose={onClose}><div className={styles.dialogContent}><p className={styles.muted}>Xarid tafsilotlarini bir joyda saqlang.</p><Tabs items={[{value:'link',label:'Havola orqali'},{value:'qr',label:'QR skanerlash'}]} value={method} onChange={setMethod} ariaLabel="Chek kiritish usuli"/>
  <div role="tabpanel" id={`tabpanel-${method}`} aria-labelledby={`tab-${method}`}>
   {busy?<div className={styles.processing}><SkeletonList rows={3} label="Namuna chek tayyorlanmoqda…"/><p>Namuna chek tayyorlanmoqda…</p></div>:method==='link'?<form onSubmit={submit} className={styles.importForm}><Input label="Chek havolasi" type="url" value={url} onChange={v=>{setUrl(v);setError('');}} placeholder="https://ofd.soliq.uz/check?…" error={error} hint="Chekdagi QR kod ichidagi OFD havolasi."/><Button fullWidth type="submit">Havolani tekshirish</Button></form>:<div className={styles.qrContent}><div className={styles.scanArea}><span className={styles.scanCorner}/><Receipt size={58}/><p>QR kodni ramka ichiga joylashtiring</p></div>{camera==='denied'?<p className={styles.warning} role="alert">Kameraga ruxsat berilmadi — namuna holati. Havola orqali davom etishingiz mumkin.</p>:<p className={styles.caption}>Kamera interfeysi namunasi. Bu yerda kamera yoqilmaydi.</p>}<Button variant="secondary" fullWidth onClick={()=>setCamera('denied')}>Ruxsat rad etilishi holatini ko‘rish</Button><Button variant="ghost" onClick={()=>setMethod('link')}>Havola orqali davom etish</Button></div>}
  </div><div className={styles.sampleAction}><span>Interaktiv oqimni sinab ko‘ring</span><Button variant="ghost" disabled={busy} onClick={sample}>26 qatorli namuna chekni ochish →</Button></div></div></Dialog>;
}
function PostingDialog({onClose,onSave}:{onClose:()=>void;onSave:(mode:string)=>void}){
 const [mode,setMode]=useState('new'); const [account,setAccount]=useState('');const [existing,setExisting]=useState('');
 return <Dialog title="Xarajatga saqlash" onClose={onClose}><div className={styles.dialogContent}><div className={styles.postAmount}><AccountsIcon/><strong>{money(totals.net)} <small>so‘m</small></strong><span>Korzinka · 28 sentabr 2026</span></div><Tabs items={[{value:'new',label:'Yangi xarajat'},{value:'link',label:'Mavjudiga biriktirish'}]} value={mode} onChange={setMode} ariaLabel="Saqlash usuli"/><div role="tabpanel" id={`tabpanel-${mode}`} aria-labelledby={`tab-${mode}`}>
 {mode==='new'?<Select label="Qaysi hisobdan?" value={account} onChange={setAccount} placeholder="Hisobni tanlang" options={[{value:'cash',label:'Naqd pul · namuna'},{value:'card',label:'Bank kartasi · namuna'}]}/>:<Select label="Mavjud xarajat" value={existing} onChange={setExisting} placeholder="Xarajatni tanlang" options={[{value:'expense',label:'Korzinka · 452 537 so‘m · namuna'}]}/>}</div><p className={styles.muted}>{mode==='new'?'Mahsulotlar kategoriyalarga ajratilgan holda saqlanadi.':'Chek tanlangan xarajatga biriktiriladi. Summa qayta hisoblanmaydi.'}</p><Button fullWidth disabled={mode==='new'?!account:!existing} onClick={()=>onSave(mode)}>Namunani saqlash</Button><p className={styles.caption}>Haqiqiy hisobga yozilmaydi. Sahifa yangilansa namuna tiklanadi.</p></div></Dialog>;
}
