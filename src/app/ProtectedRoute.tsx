import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ErrorFallback } from "./ErrorFallback";
import { rememberReturnTo } from "../shared/lib/returnTo";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * false — faqat autentifikatsiyani talab qiladi (masalan /onboarding
   * uchun): onboarding hali tugallanmagan bo'lishi kutilgan holat, shuning
   * uchun bu yerda true bo'lsa cheksiz redirect tsikli hosil bo'lardi.
   * true (default) — /onboardingga ham yo'naltiradi (asosiy ilova sahifalari uchun).
   */
  requireOnboarding?: boolean;
}

/**
 * Sessiya bo'lmasa /login ga, (requireOnboarding bo'lsa) onboarding tugallanmagan bo'lsa /onboarding ga yo'naltiradi.
 * Frontend-01 deep-link: yo'naltirishdan oldin so'ralgan manzil (query/hash bilan) eslab qolinadi
 * va login/onboarding tugagach o'sha yerga qaytariladi (`consumeReturnTo`).
 */
export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { status, user, loggedOut, retry } = useAuth();
  const location = useLocation();
  const here = `${location.pathname}${location.search}${location.hash}`;

  if (status === "loading") {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span role="status">Yuklanmoqda…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <ErrorFallback
        title="Server bilan bog‘lanib bo‘lmadi"
        message="Internet aloqasini tekshiring yoki birozdan keyin qayta urinib ko‘ring. Ma’lumotlaringiz saqlangan."
        actionLabel="Qayta urinish"
        onAction={retry}
      />
    );
  }

  if (status === "unauthenticated") {
    // O'zi "Chiqish"ni bosgan foydalanuvchi uchun manzil eslab qolinmaydi —
    // keyingi kirgan (boshqa) foydalanuvchi eski sahifaga tushmasin.
    if (!loggedOut) rememberReturnTo(here);
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && user && !user.onboardingCompleted) {
    rememberReturnTo(here);
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
