/**
 * Frontend-01: URL deep-link. Sessiyasiz ochilgan himoyalangan sahifa
 * (masalan `/budgets?month=2026-08`) login/onboarding'dan keyin aynan shu
 * manzilga qaytariladi.
 *
 * Manzil sessionStorage'da (`mm.` prefiksi — logout'da tozalanadi) saqlanadi,
 * chunki login oqimi bir necha sahifadan o'tadi (/login → /login/verify →
 * /onboarding) va har biri o'z `location.state`ini ishlatadi.
 */

const KEY = "mm.returnTo";
const AUTH_PATHS = ["/login", "/register", "/onboarding"];
const MAX_LENGTH = 2048;

/**
 * Faqat shu ilova ichidagi nisbiy yo'lni qabul qiladi — open redirect yo'q:
 * `//evil.com`, `/\evil.com`, `https://…`, `javascript:` va auth sahifalari rad etiladi.
 */
export function sanitizeReturnTo(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return null; // CR/LF/tab kabi boshqaruv belgilari
  }
  const pathname = value.split(/[?#]/, 1)[0];
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return value;
}

export function rememberReturnTo(path: string): void {
  const safe = sanitizeReturnTo(path);
  if (!safe || safe === "/") return;
  try {
    sessionStorage.setItem(KEY, safe);
  } catch {
    // Storage bloklangan bo'lsa deep-link shunchaki "/" ga tushadi.
  }
}

/** Saqlangan manzilni qaytaradi va o'chiradi; bo'lmasa `fallback`. */
export function consumeReturnTo(fallback = "/"): string {
  try {
    const value = sanitizeReturnTo(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
