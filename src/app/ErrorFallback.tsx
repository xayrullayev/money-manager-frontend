import { useEffect, useRef } from "react";
import { Button } from "../shared/ui/Button";
import styles from "./ErrorFallback.module.css";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction: () => void;
}

/**
 * Global ErrorBoundary va route `errorElement` uchun bitta fallback.
 * Foydalanuvchiga stack trace/texnik matn ko'rsatilmaydi; fokus sarlavhaga
 * o'tadi, ekran o'quvchi darhol nima bo'lganini eshitadi.
 */
export function ErrorFallback({
  title = "Nimadir noto‘g‘ri ketdi",
  message = "Kutilmagan xatolik yuz berdi. Sahifani qayta yuklab ko‘ring.",
  actionLabel = "Bosh sahifaga qaytish",
  onAction,
}: ErrorFallbackProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className={styles.root} role="alert">
      <h1 ref={heading} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      <p className={styles.message}>{message}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
