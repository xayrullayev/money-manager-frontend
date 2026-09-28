import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/ui/Button";
import { completeOnboarding } from "../../shared/api/onboarding";
import { ApiError } from "../../shared/api/client";
import { useAuth } from "../../app/AuthContext";
import { consumeReturnTo } from "../../shared/lib/returnTo";
import { useDocumentTitle } from "../../shared/hooks/useDocumentTitle";
import styles from "./OnboardingScreen.module.css";

const CURRENCIES = ["UZS", "USD", "EUR"];

/**
 * Design-03 boshlang'ich sozlash bosqichi: valyuta (standart UZS), timezone,
 * birinchi hisob va boshlang'ich qoldiq. Registratsiya oqimidan alohida.
 * Valyuta birinchi operatsiyadan keyin o'zgartirilmaydi.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  useDocumentTitle();
  const { user, setUser } = useAuth();

  const [baseCurrency, setBaseCurrency] = useState("UZS");
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Tashkent",
  );
  const [firstAccountName, setFirstAccountName] = useState("Naqd pul");
  const [initialBalance, setInitialBalance] = useState("0");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    try {
      await completeOnboarding({
        baseCurrency,
        timezone,
        firstAccountName,
        initialBalance,
      });
      if (user) {
        setUser({ ...user, baseCurrency, onboardingCompleted: true });
      }
      navigate(consumeReturnTo(), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sozlashni saqlab bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>Boshlang'ich sozlash</h1>
          <p className={styles.subtitle}>
            Asosiy valyuta, birinchi hisobingiz va boshlang'ich qoldiqni kiriting.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)" }}>
              {error}
            </p>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="currency">
              Asosiy valyuta
            </label>
            <select
              id="currency"
              className={styles.select}
              value={baseCurrency}
              onChange={(event) => setBaseCurrency(event.target.value)}
              disabled={submitting}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <p className={styles.hint}>Birinchi operatsiyadan keyin o'zgartirib bo'lmaydi.</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="account-name">
              Birinchi hisob nomi
            </label>
            <input
              id="account-name"
              className={styles.input}
              value={firstAccountName}
              onChange={(event) => setFirstAccountName(event.target.value)}
              disabled={submitting}
              maxLength={60}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="initial-balance">
              Boshlang'ich qoldiq ({baseCurrency})
            </label>
            <input
              id="initial-balance"
              className={styles.input}
              type="text"
              inputMode="decimal"
              value={initialBalance}
              onChange={(event) => {
                const next = event.target.value.replace(/[^0-9.]/g, "");
                setInitialBalance(next);
              }}
              disabled={submitting}
            />
          </div>

          <p className={styles.hint}>Vaqt zonasi: {timezone}</p>

          <Button type="submit" fullWidth loading={submitting} disabled={!firstAccountName.trim()}>
            Davom etish
          </Button>
        </form>
      </div>
    </div>
  );
}
