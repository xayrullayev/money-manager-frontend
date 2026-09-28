const MAX=9999999999999999999n;
export function savingCents(value:string):bigint {
 const [whole,fraction=""]=value.split("."); return BigInt(whole)*100n+BigInt(fraction.padEnd(2,"0"));
}
export function validSavingAmount(value:string):boolean {
 return /^\d{1,17}(\.\d{1,2})?$/.test(value) && savingCents(value)>0n && savingCents(value)<=MAX;
}
export function contributionPreview(current:string,target:string,amount:string,kind:"CONTRIBUTION"|"WITHDRAWAL") {
 if(!validSavingAmount(amount)) return null;
 const next=savingCents(current)+(kind==="WITHDRAWAL"?-1n:1n)*savingCents(amount);
 if(next<0n||next>MAX) return null;
 return {amount:`${next/100n}.${String(next%100n).padStart(2,"0")}`,percent:Number(next*10000n/savingCents(target))/100};
}
/** A closure belongs to one mounted form. Retries of unchanged input reuse its UUID. */
export function createSavingRetry() {
 let payload:string|undefined,key="";
 return (next:string)=>{ if(next!==payload) {key=crypto.randomUUID();payload=next;} return key; };
}
export function savingToday(timezone:string,now=new Date()):string {
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const get=(type:string)=>parts.find(p=>p.type===type)!.value;
 return `${get("year")}-${get("month")}-${get("day")}`;
}
export const SAVING_ICONS={emergency:"Favqulodda",travel:"Sayohat",home:"Uy",car:"Avtomobil",education:"Ta’lim",wedding:"To‘y",gadget:"Texnika",health:"Sog‘liq",gift:"Sovg‘a",business:"Biznes",retirement:"Pensiya",other:"Boshqa"};
