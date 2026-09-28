import { uzMonthName, uzWeekdayName } from "./uzDate";

/** Operatsiyalar ro'yxatini sana bo'yicha guruhlash uchun — Figma: "18-sentabr, juma". */
export function formatDateGroupLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${date.getDate()}-${uzMonthName(date.getMonth())}, ${uzWeekdayName(date.getDay())}`;
}

/** [{date, items}] — ketma-ket kelgan bir xil sanadagi operatsiyalarni guruhlaydi (backend allaqachon sana bo'yicha saralab beradi deb faraz qilinadi). */
export function groupByDate<T extends { transactionDate: string }>(items: T[]): { date: string; items: T[] }[] {
  const groups: { date: string; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.transactionDate) {
      last.items.push(item);
    } else {
      groups.push({ date: item.transactionDate, items: [item] });
    }
  }
  return groups;
}
