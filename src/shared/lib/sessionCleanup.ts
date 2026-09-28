/**
 * Logout oldidan/keyin bajariladigan tozalash — Frontend-02 qabul mezoni:
 * "boshqa user cache logoutda tozalanadi".
 *
 * - `registerLogoutHook` — sahifa hali tugallanmagan ishini (masalan Undo
 *   kutayotgan o'chirishni) sessiya bekor bo'lishidan OLDIN yakunlashi uchun.
 * - `clearUserStorage` — shu ilova localStorage/sessionStorage'ga yozgan
 *   (`mm.` prefiksli) barcha qiymatlarni o'chiradi, keyingi user ko'rmasin.
 */

type LogoutHook = () => void | Promise<void>;

const hooks = new Set<LogoutHook>();

export const STORAGE_PREFIX = "mm.";

export function registerLogoutHook(hook: LogoutHook): () => void {
  hooks.add(hook);
  return () => {
    hooks.delete(hook);
  };
}

/** Barcha hook'lar parallel bajariladi; bittasining xatosi logout'ni to'xtatmaydi. */
export async function runLogoutHooks(): Promise<void> {
  await Promise.allSettled(Array.from(hooks, (hook) => Promise.resolve().then(hook)));
}

export function clearUserStorage(): void {
  for (const storage of [safeStorage("localStorage"), safeStorage("sessionStorage")]) {
    if (!storage) continue;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  }
}

function safeStorage(name: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return typeof window !== "undefined" ? window[name] : null;
  } catch {
    return null; // private mode / bloklangan storage
  }
}
