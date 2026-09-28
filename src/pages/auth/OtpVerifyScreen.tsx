import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { OtpInput } from "../../shared/ui/OtpInput";
import { Button } from "../../shared/ui/Button";
import { useCountdown } from "../../shared/hooks/useCountdown";
import { requestOtp, verifyOtp } from "../../shared/api/auth";
import { ApiError } from "../../shared/api/client";
import { env } from "../../shared/api/env";
import { consumeReturnTo } from "../../shared/lib/returnTo";
import { useAuth } from "../../app/AuthContext";
import type { AuthMode } from "./PhoneEntryScreen";
import styles from "./AuthLayout.module.css";

interface LocationState {
  phone?: string;
  resendAvailableInSeconds?: number;
}

/** Backend contractdan kelmasa fallback: telefon raqamini +998 XX XXX XX XX ko'rinishida ko'rsatish. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const national = digits.slice(-9);
  const cc = digits.slice(0, digits.length - 9);
  return `+${cc} ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`;
}

/**
 * Design-AUTH-02: SMS kod tasdiqlash ekrani.
 * To'liq kod kiritilganda avtomatik submit; resend countdown; xatoda shake +
 * qolgan urinishlar backend xabarida.
 */
export function OtpVerifyScreen({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const state = (location.state ?? {}) as LocationState;
  const phone = state.phone;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);

  const { isExpired, formatted, restart } = useCountdown(
    state.resendAvailableInSeconds ?? env.otpResendSeconds,
  );

  useEffect(() => {
    if (!phone) {
      navigate(mode === "login" ? "/login" : "/register", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => {
    if (code.length === env.otpCodeLength && !verifying && !success) {
      void handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!phone) return null;

  async function handleVerify() {
    setVerifying(true);
    setError(undefined);
    try {
      const result = await verifyOtp({ phone: phone as string, code });
      setSuccess(true);
      setUser({
        id: result.user.id,
        phone: result.user.phone,
        baseCurrency: null,
        onboardingCompleted: !result.isNewUser,
      });
      setTimeout(() => {
        // Frontend-01 deep-link: sessiyasiz ochilgan sahifaga qaytish (yangi user avval onboarding'dan o'tadi).
        navigate(result.isNewUser ? "/onboarding" : consumeReturnTo(), { replace: true });
      }, 500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 410) {
          setError("Kod muddati tugagan. Qayta yuboring.");
        } else if (err.status === 429) {
          setError("Urinishlar soni chegarasiga yetdingiz.");
        } else if (err.status === 400 || err.status === 422) {
          setError(err.message || "Noto'g'ri kod");
        } else {
          setError(err.message);
        }
      } else {
        setError("Kutilmagan xatolik yuz berdi.");
      }
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!isExpired || resending) return;
    setResending(true);
    setError(undefined);
    try {
      const result = await requestOtp({ phone: phone as string });
      restart(result.resendAvailableInSeconds);
      setCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kod qayta yuborilmadi.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Kodni kiriting"
      subtitle={`${maskPhone(phone)} raqamiga SMS yuborildi`}
      onBack={() => navigate(mode === "login" ? "/login" : "/register", { state: { phone } })}
    >
      <div className={styles.form}>
        <OtpInput
          length={env.otpCodeLength}
          value={code}
          onChange={setCode}
          error={error}
          disabled={verifying || success}
        />

        {success ? (
          <p style={{ textAlign: "center", color: "var(--color-success)", fontWeight: 600 }}>
            ✓ Tasdiqlandi
          </p>
        ) : (
          <Button
            type="button"
            fullWidth
            loading={verifying}
            disabled={code.length !== env.otpCodeLength}
            onClick={() => void handleVerify()}
          >
            Tasdiqlash
          </Button>
        )}

        <div style={{ textAlign: "center" }}>
          {isExpired ? (
            <Button variant="ghost" type="button" loading={resending} onClick={() => void handleResend()}>
              Qayta yuborish
            </Button>
          ) : (
            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
              Qayta yuborish ({formatted})
            </span>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
