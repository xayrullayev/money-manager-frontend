export function currentMonth(zone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
}
export function isMonth(value: string): boolean {
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1;
}
export function monthRange(month: string): {from: string; to: string} {
  if (!isMonth(month)) throw new Error("Invalid calendar month");
  const [year, index] = month.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][index - 1];
  return { from: `${month}-01`, to: `${month}-${days}` };
}
export function validLimit(value: string): boolean {
  return /^\d{1,17}(\.\d{1,2})?$/.test(value) && /[1-9]/.test(value);
}
export function budgetState(percent: number, exceeded = false): "normal" | "near" | "exceeded" {
  return exceeded || percent > 100 ? "exceeded" : percent >= 80 ? "near" : "normal";
}
