/**
 * Frontend-01: har bir sahifaning brauzer sarlavhasi (tab, tarix, ekran
 * o'quvchi sahifa almashganini e'lon qiladi). Nomlar sidebar bilan bir xil.
 */
export const APP_NAME = "Money Manager";

const TITLES: Record<string, string> = {
  "/": "Bosh sahifa",
  "/transactions": "Operatsiyalar",
  "/accounts": "Hisoblar",
  "/budgets": "Budjetlar",
  "/savings": "Jamg‘arma rejalari",
  "/reports": "Hisobotlar",
  "/settings": "Sozlamalar",
  "/login": "Kirish",
  "/login/verify": "SMS kod",
  "/register": "Ro‘yxatdan o‘tish",
  "/register/verify": "SMS kod",
  "/onboarding": "Boshlang‘ich sozlash",
};

/** `pathname` → "Budjetlar · Money Manager". Noma'lum yo'l — faqat ilova nomi. */
export function pageTitle(pathname: string): string {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page = TITLES[normalized];
  return page ? `${page} · ${APP_NAME}` : APP_NAME;
}
