/**
 * O'zbekcha sana nomlari — qo'lda belgilangan ro'yxat.
 *
 * `Intl.DateTimeFormat("uz-...", { month: "long" })` ko'plab brauzerlarda
 * o'zbek tili uchun to'liq CLDR ma'lumotiga ega emas va "M09" kabi xato
 * formatga tushib qoladi (fallback pattern). Shu sababli oy/hafta kuni
 * nomlarini Intl'ga tayanmasdan, qo'lda belgilaymiz — barcha brauzer va
 * platformalarda bir xil, ishonchli natija beradi.
 */
export const UZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
] as const;

export const UZ_WEEKDAYS = [
  "yakshanba",
  "dushanba",
  "seshanba",
  "chorshanba",
  "payshanba",
  "juma",
  "shanba",
] as const;

export function uzMonthName(monthIndex0: number): string {
  return UZ_MONTHS[((monthIndex0 % 12) + 12) % 12];
}

export function uzWeekdayName(dayIndex0: number): string {
  return UZ_WEEKDAYS[((dayIndex0 % 7) + 7) % 7];
}
