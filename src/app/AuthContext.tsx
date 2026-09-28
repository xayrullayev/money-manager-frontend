import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, logout as logoutRequest, type MeResult } from "../shared/api/auth";
import { ApiError } from "../shared/api/client";
import { clearUserStorage, runLogoutHooks } from "../shared/lib/sessionCleanup";

interface AuthContextValue {
  user: MeResult | null;
  /**
   * "error" — `/auth/me` 401 emas, balki tarmoq/server xatosi bilan tugadi.
   * Bu sessiya tugadi degani emas, shuning uchun login'ga otilmaydi (Frontend-01).
   */
  status: "loading" | "authenticated" | "unauthenticated" | "error";
  /** true — foydalanuvchi o'zi "Chiqish"ni bosgan (deep-link eslab qolinmaydi). */
  loggedOut: boolean;
  setUser: (user: MeResult) => void;
  logout: () => Promise<void>;
  /** "error" holatidan keyin `/auth/me`ni qayta tekshiradi. */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sessiya holati — Bakend-04 cookie-based session bilan ishlaydi.
 * App yuklanganda `/auth/me`ni tekshiradi; 401 bo'lsa unauthenticated deb belgilanadi
 * (login/registration ekranlariga yo'naltirish uchun).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<MeResult | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [loggedOut, setLoggedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setUserState(me);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (cancelled) return;
        // Faqat 401 "sessiya yo'q" degani. Tarmoq/5xx xatosida login'ga otish
        // noto'g'ri — sessiya tirik bo'lishi mumkin; ProtectedRoute "Qayta urinish" beradi.
        setStatus(error instanceof ApiError && error.status === 401 ? "unauthenticated" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const setUser = useCallback((next: MeResult) => {
    setUserState(next);
    setStatus("authenticated");
    setLoggedOut(false);
  }, []);

  const logout = useCallback(async () => {
    // Avval sahifalar kutilayotgan ishlarini yakunlaydi (masalan Undo'dagi o'chirish) — sessiya hali tirik.
    await runLogoutHooks();
    try {
      await logoutRequest();
    } finally {
      // Frontend-02: keyingi foydalanuvchi oldingisining ma'lumotini ko'rmasligi uchun
      // server javobidan qat'i nazar lokal holat va `mm.*` storage tozalanadi.
      clearUserStorage();
      setLoggedOut(true);
      setUserState(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, loggedOut, setUser, logout, retry }),
    [user, status, loggedOut, setUser, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
