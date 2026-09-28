import { apiClient, ApiError } from "./client";
export interface ReportParams { from: string; to: string; accountId?: string; }
export interface ReportSummaryParams extends ReportParams {
  type?: "INCOME" | "EXPENSE";
  categoryId?: string;
  search?: string;
}
export interface Summary {currency:string;period:{from:string;to:string};income:string;expense:string;net:string;transactionCount:number;}
export interface CategoryReport {currency:string;total:string;items:{categoryId:string;categoryName:string;amount:string;percent:number;archived:boolean}[];}
export interface TrendReport {currency:string;points:{bucket:string;income:string;expense:string;net:string}[];}
export async function reportSummary(params:ReportSummaryParams):Promise<Summary>{return (await apiClient.get<Summary>("/reports/summary",{params})).data;}
export async function reportCategories(params:ReportParams,type:"INCOME"|"EXPENSE"):Promise<CategoryReport>{return (await apiClient.get<CategoryReport>("/reports/categories",{params:{...params,type}})).data;}
export async function reportTrend(params:ReportParams):Promise<TrendReport>{return (await apiClient.get<TrendReport>("/reports/trend",{params:{...params,granularity:"MONTH"}})).data;}
export async function exportCsv(params:ReportParams,signal:AbortSignal):Promise<Blob>{
  const response=await apiClient.get<Blob>("/reports/transactions/export.csv",{params,responseType:"blob",timeout:90000,signal,validateStatus:()=>true});
  if(response.status>=400){
    let detail="Eksport bajarilmadi. Qayta urinib ko‘ring.";let code="EXPORT_ERROR";
    try {const problem=JSON.parse(await response.data.text());if(typeof problem.detail==="string")detail=problem.detail;if(typeof problem.code==="string")code=problem.code;}catch{/* Non-JSON upstream errors use the safe fallback. */}
    throw new ApiError({status:response.status,code,detail});
  }
  if(!String(response.headers["content-type"]).includes("text/csv"))throw new Error("Server CSV fayl qaytarmadi.");
  return response.data;
}
