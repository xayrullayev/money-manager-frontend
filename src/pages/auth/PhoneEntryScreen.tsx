import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { PhoneInput, NATIONAL_LENGTH } from "../../shared/ui/PhoneInput";
import { Button } from "../../shared/ui/Button";
import { requestOtp } from "../../shared/api/auth";
import { ApiError } from "../../shared/api/client";
import { env } from "../../shared/api/env";
import styles from "./AuthLayout.module.css";

export type AuthMode = "login" | "register";

const COPY: Record<AuthMode, { title: string; subtitle: string; cta: string; footerText: string; footerLinkText: string; footerTo: string }> = {
  login: {
    title: "Kirish",
    subtitle: "Telefon raqamingizni kiriting",
    cta: "Davom etish",
    footerText: "Hisobingiz yo'qmi?",
    footerLinkText: "Ro'yxatdan o'tish",
    footerTo: "/register",
  },
  register: {
    title: "Ro'yxatdan o'tish",
    subtitle: "Telefon raqamingizni kiriting",
    cta: "SMS kod olish",
    footerText: "Hisobingiz bormi?",
    footerLinkText: "Kirish",
    footerTo: "/login",
  },
};

/**
 * Design-AUTH-01 / Design-03: telefon raqami kiritish ekrani.
 * Login va registratsiya bir xil UI/oqimni ishlatadi — farq faqat matnda;
 * yangi/eski foydalanuvchi ekanligini backend verify bosqichida aniqlaydi.
 */
export function PhoneEntryScreen({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const copy = COPY[mode];

  const [digits, setDigits] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isComplete = digits.length === NATIONAL_LENGTH;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isComplete || submitting) return;

    setFieldError(undefined);
    setFormError(undefined);
    setSubmitting(true);

    const fullPhone = `${env.defaultCountryCode}${digits}`;
    try {
      const result = await requestOtp({ phone: fullPhone });
      navigate(mode === "login" ? "/login/verify" : "/register/verify", {
        state: {
          phone: fullPhone,
          codeExpiresInSeconds: result.codeExpiresInSeconds,
          resendAvailableInSeconds: result.resendAvailableInSeconds,
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422 || error.status === 400) {
          setFieldError("Noto'g'ri telefon raqami");
        } else if (error.status === 429) {
          setFormError("Urinishlar soni chegarasiga yetdingiz. Birozdan so'ng qayta urinib ko'ring.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Kutilmagan xatolik yuz berdi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <span>
          {copy.footerText}{" "}
          <a
            href={copy.footerTo}
            onClick={(event) => {
              event.preventDefault();
              navigate(copy.footerTo, { state: location.state });
            }}
          >
            {copy.footerLinkText}
          </a>
        </span>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className={styles.errorBanner} role="alert">
            {formError}
          </div>
        )}
        <PhoneInput
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setFieldError(undefined);
          }}
          countryCode={env.defaultCountryCode}
          error={fieldError}
          disabled={submitting}
          autoFocus
        />
        <Button type="submit" fullWidth disabled={!isComplete} loading={submitting}>
          {copy.cta}
        </Button>
      </form>
    </AuthLayout>
  );
}
