import { apiClient } from "./client";
export interface SavingPlan {
 id:string; name:string; iconKey:string; colorToken:string; targetAmount:string; currentAmount:string;
 remaining:string; progressPercent:number; completed:boolean; archived:boolean; currency:string; version:number;
 dueDate?:string; remainingDays?:number;
}
export type ContributionKind = "CONTRIBUTION" | "WITHDRAWAL" | "REVERSAL";
export interface SavingContribution { id:string; amount:string; kind:ContributionKind; occurredOn:string; note?:string; createdAt:string; }
export interface CreateSavingPlanInput { name:string; iconKey:string; colorToken:string; targetAmount:string; currency:string; dueDate?:string; }
export interface UpdateSavingPlanInput { name?:string; iconKey?:string; colorToken?:string; targetAmount?:string; expectedVersion:number; dueDate?:string; clearDueDate?:boolean; }
export interface CreateContributionInput { amount:string; kind:Exclude<ContributionKind,"REVERSAL">; occurredOn:string; note?:string; }
export interface ContributionPage { items:SavingContribution[]; nextCursor?:string; }
export interface SavingsSummary { totalSavings:string; totalTarget:string; currency:string; planCount:number; }
export interface BalanceHistory { planId:string; currency:string; year:number; months:{month:string; balance?:string; future:boolean}[]; }
const root="/savings/plans";
const planPath=(id:string)=>`${root}/${encodeURIComponent(id)}`;
export async function fetchSavingPlans(archived=false,signal?:AbortSignal):Promise<SavingPlan[]> { return (await apiClient.get(root,{params:{archived},signal})).data; }
export async function fetchSavingPlan(id:string):Promise<SavingPlan> { return (await apiClient.get(planPath(id))).data; }
export async function createSavingPlan(input:CreateSavingPlanInput):Promise<SavingPlan> { return (await apiClient.post(root,input)).data; }
export async function updateSavingPlan(id:string,input:UpdateSavingPlanInput):Promise<SavingPlan> { return (await apiClient.patch(planPath(id),input)).data; }
export async function archiveSavingPlan(id:string):Promise<void> { await apiClient.post(`${planPath(id)}/archive`); }
export async function unarchiveSavingPlan(id:string):Promise<void> { await apiClient.post(`${planPath(id)}/unarchive`); }
export async function fetchContributions(id:string,cursor?:string,limit=20,signal?:AbortSignal):Promise<ContributionPage> { return (await apiClient.get(`${planPath(id)}/contributions`,{params:{cursor,limit},signal})).data; }
export async function addContribution(id:string,input:CreateContributionInput,key:string):Promise<SavingContribution> { return (await apiClient.post(`${planPath(id)}/contributions`,input,{headers:{"Idempotency-Key":key}})).data; }
export async function removeContribution(id:string,cid:string):Promise<void> { await apiClient.delete(`${planPath(id)}/contributions/${encodeURIComponent(cid)}`); }
export async function fetchSavingsSummary(signal?:AbortSignal):Promise<SavingsSummary> { return (await apiClient.get("/savings/summary",{signal})).data; }
export async function fetchSavingBalance(id:string,year:number,signal?:AbortSignal):Promise<BalanceHistory> { return (await apiClient.get(`${planPath(id)}/balance`,{params:{year},signal})).data; }
