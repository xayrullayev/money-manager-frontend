import { useEffect, useRef, useState } from "react";

/**
 * Qayta yuborish taymeri — Design-AUTH-02: "Qayta yuborish (00:59)".
 * `restart()` yangi SMS yuborilganda chaqiriladi.
 */
export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function restart(seconds: number = initialSeconds) {
    setSecondsLeft(seconds);
  }

  const isExpired = secondsLeft <= 0;
  const formatted = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60,
  ).padStart(2, "0")}`;

  return { secondsLeft, isExpired, formatted, restart };
}
