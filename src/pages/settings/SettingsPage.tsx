import {useEffect,useRef,useState,type FormEvent} from "react";
import {Link} from "react-router-dom";
import {fetchProfile,updateProfile,type Profile} from "../../shared/api/profile";
import {ApiError} from "../../shared/api/client";
import {Button,Input,Dialog} from "../../shared/ui";
import {useAuth} from "../../app/AuthContext";
import styles from "../reports/ReportsPage.module.css";
export function SettingsPage(){const [retry,setRetry]=useState(0);return <LoadSettings key={retry} retry={()=>setRetry(n=>n+1)}/>;}
function LoadSettings({retry}:{retry:()=>void}){
 const [profile,setProfile]=useState<Profile|null>(null),[error,setError]=useState("");
 useEffect(()=>{let active=true;fetchProfile().then(p=>{if(active)setProfile(p);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Profil yuklanmadi.");});return()=>{active=false;};},[]);
 if(error)return <div role="alert"><h1>Sozlamalar</h1><p>{error}</p><Button onClick={retry}>Qayta urinish</Button></div>;
 if(!profile)return <p role="status">Sozlamalar yuklanmoqda…</p>;
 return <SettingsForm profile={profile}/>;
}
function SettingsForm({profile}:{profile:Profile}){
 const [name,setName]=useState(profile.displayName??""),[zone,setZone]=useState(profile.timezone),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState(""),[confirm,setConfirm]=useState(false);
 const [savedProfile,setSavedProfile]=useState(profile);
 const lock=useRef(false);const {logout}=useAuth();
 let preview="";try{preview=new Intl.DateTimeFormat("en-GB",{timeZone:zone,dateStyle:"medium",timeStyle:"short"}).format(new Date());}catch{/* Invalid timezone is explained on submit. */}
 async function save(event:FormEvent){event.preventDefault();if(lock.current)return;setError("");setNotice("");if(!preview){setError("To‘g‘ri vaqt mintaqasini kiriting. Masalan, Asia/Tashkent.");return;}if(!navigator.onLine){setError("Internetga ulaning. Kiritilgan qiymatlar saqlanib turibdi.");return;}if(savedProfile.displayName&&!name.trim()){setError("Ismni bo‘sh qoldirib bo‘lmaydi.");return;}lock.current=true;setBusy(true);try{const saved=await updateProfile({timezone:zone.trim(),...(name.trim()?{displayName:name.trim()}:{})});setSavedProfile(saved);setName(saved.displayName??"");setZone(saved.timezone);setNotice("Sozlamalar saqlandi. Yangi ochilgan hisobot va budjetlar shu vaqt mintaqasidan foydalanadi.");}catch(e){setError(e instanceof ApiError?e.message:"Sozlamalar saqlanmadi.");}finally{lock.current=false;setBusy(false);}}
 async function signOut(){if(lock.current)return;lock.current=true;setBusy(true);try{await logout();}catch(e){setError(e instanceof Error?e.message:"Chiqib bo‘lmadi. Qayta urinib ko‘ring.");setConfirm(false);}finally{lock.current=false;setBusy(false);}}
 return <div className={styles.page}><h1>Sozlamalar</h1><form className={styles.filters} onSubmit={save} noValidate><Input label="Ism" value={name} onChange={setName} optional={!savedProfile.displayName} maxLength={100} disabled={busy}/><Input label="Vaqt mintaqasi" value={zone} onChange={setZone} disabled={busy} hint="Masalan, Asia/Tashkent, Europe/London yoki UTC"/><Input label="Asosiy valyuta" value={profile.baseCurrency} onChange={()=>{}} readOnly hint="Valyutani o‘zgartirish hozircha qo‘llab-quvvatlanmaydi."/><p>{preview?`Tanlangan mintaqada hozir: ${preview}`:"Vaqt mintaqasi aniqlanmadi."}</p><Button type="submit" loading={busy}>Saqlash</Button></form>{error&&<p role="alert" className={styles.error}>{error}</p>}{notice&&<p role="status">{notice}</p>}<section className={styles.panel}><h2>Ma’lumotlarni eksport qilish</h2><p>Hisobot sahifasida davrni tanlab CSV faylni yuklab olishingiz mumkin.</p><Link to="/reports">Hisobot va CSV eksportiga o‘tish</Link></section><section className={styles.panel}><h2>Sessiya</h2><Button variant="secondary" onClick={()=>setConfirm(true)}>Hisobdan chiqish</Button></section>{confirm&&<Dialog title="Hisobdan chiqish" onClose={()=>setConfirm(false)} preventClose={busy}><p>Sessiya yakunlanadi. Qayta kirish uchun telefon raqamingiz kerak bo‘ladi.</p><Button variant="secondary" data-autofocus disabled={busy} onClick={()=>setConfirm(false)}>Bekor qilish</Button><Button loading={busy} onClick={()=>void signOut()}>Chiqish</Button></Dialog>}</div>;
}
