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
  "/checks": "Cheklar",
  "/checks/import": "Chek qo‘shish",
  "/checks/analytics": "Xaridlar tahlili",
  "/design/checks": "Cheklar dizayni",
  "/reports": "Hisobotlar",
  "/settings": "Sozlamalar",
  "/login": "Kirish",
  "/login/verify": "SMS kod",
  "/register": "Ro‘yxatdan o‘tish",
  "/register/verify": "SMS kod",
  "/onboarding": "Boshlang‘ich sozlash",
};

/** Aniq mos kelmagan yo'llar uchun namunaviy (dinamik) yorliqlar. */
function dynamicLabel(normalized: string): string | undefined {
  // /checks/<id> — chek tafsiloti (import/analytics TITLES'da aniq mos keladi).
  if (/^\/checks\/[^/]+$/.test(normalized)) return "Chek tafsiloti";
  return undefined;
}

/** `pathname` → "Budjetlar · Money Manager". Noma'lum yo'l — faqat ilova nomi. */
export function pageTitle(pathname: string): string {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page = TITLES[normalized] ?? dynamicLabel(normalized);
  return page ? `${page} · ${APP_NAME}` : APP_NAME;
}

/**
 * `pathname` → faqat sahifa yorlig'i ("Budjetlar"), ilova nomisiz.
 * Navbar sarlavhasi uchun (`pageTitle` — brauzer tabi uchun). Noma'lum yo'lda ilova nomi.
 */
export function pageLabel(pathname: string): string {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return TITLES[normalized] ?? dynamicLabel(normalized) ?? APP_NAME;
}
