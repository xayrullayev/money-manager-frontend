import { currentMonth, monthRange } from "./budgets";
export type ReportPreset="this_month"|"last_month"|"this_year"|"custom";
export function reportPeriodSelection(params:URLSearchParams,zone:string,now=new Date()) {
  const requested=params.get('preset');
  const named=requested==='this_month'||requested==='last_month'||requested==='this_year'?requested:null;
  const defaults=reportPreset(named??'this_month',zone,now);
  const from=params.get('from')??defaults.from,to=params.get('to')??defaults.to;
  const datesMatch=from===defaults.from&&to===defaults.to;
  const preset:ReportPreset=named&&datesMatch?named:!requested&&!params.has('from')&&!params.has('to')?'this_month':'custom';
  return {from,to,preset};
}
export function reportPreset(preset:Exclude<ReportPreset,"custom">,zone:string,now=new Date()){
  const month=currentMonth(zone,now);
  if(preset==="this_year")return {from:`${month.slice(0,4)}-01-01`,to:`${month.slice(0,4)}-12-31`};
  if(preset==="last_month"){
    const [year,m]=month.split("-").map(Number);
    return monthRange(`${m===1?year-1:year}-${String(m===1?12:m-1).padStart(2,"0")}`);
  }
  return monthRange(month);
}
export function periodError(from:string,to:string):string {
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number(s.slice(0,4))>=1&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!valid(from)||!valid(to))return "Boshlanish va tugash sanalarini to‘liq kiriting.";
  if(from>to)return "Boshlanish sanasi tugash sanasidan keyin bo‘lishi mumkin emas.";
  if((Date.parse(to)-Date.parse(from))/86400000+1>366)return "Ko‘pi bilan 366 kunni tanlang.";
  return "";
}
