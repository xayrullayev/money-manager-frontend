import { uzMonthName } from "./uzDate";

/** Davr filtri — Design-04: "Jami qoldiq, shu oydagi daromad/xarajat ... Davr filtri". */
export type PeriodPreset = "this_month" | "last_month" | "last_30_days";

export function toLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Figma: davr tanlovchisi joriy oy nomini ko'rsatadi, masalan "Sentabr 2026". */
export function getPeriodDisplayLabel(preset: PeriodPreset, now: Date = new Date()): string {
  if (preset === "last_30_days") return "So'nggi 30 kun";
  const monthOffset = preset === "last_month" ? -1 : 0;
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${uzMonthName(target.getMonth())} ${target.getFullYear()}`;
}

/** So'nggi ma'lumot sanasi — pastki caption uchun, masalan "18-sentabr". */
export function getShortDateCaption(date: Date = new Date()): string {
  return `${date.getDate()}-${uzMonthName(date.getMonth())}`;
}

export function resolvePeriod(preset: PeriodPreset, now: Date = new Date()): { from: string; to: string } {
  if (preset === "last_30_days") {
    const to = new Date(now);
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    return { from: toLocalDate(from), to: toLocalDate(to) };
  }

  const year = now.getFullYear();
  const month = now.getMonth() - (preset === "last_month" ? 1 : 0);
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: toLocalDate(from), to: toLocalDate(to) };
}
