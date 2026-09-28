import type {SavingPlan} from "../../shared/api/savings";
export function planStatus(plan:SavingPlan){return plan.archived?"Arxivlangan":plan.completed?"Maqsadga erishildi":(plan.remainingDays??0)<0?"Muddat o‘tgan":"Davom etmoqda";}
