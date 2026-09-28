import {ApiError} from "../../shared/api/client";
export function savingError(error:unknown):string {
 if(error instanceof ApiError) {
  if(error.code==="STALE_VERSION") return "Reja boshqa joyda o‘zgartirilgan. Yangi holatni yuklab, qayta tahrirlang.";
  if(error.status===0) return "Ulanish uzildi. Qayta urinib ko‘ring.";
  return error.message;
 }
 return "Ma’lumotni yuklab bo‘lmadi. Qayta urinib ko‘ring.";
}
