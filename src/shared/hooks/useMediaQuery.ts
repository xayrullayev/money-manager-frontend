import { useEffect, useState } from "react";

/**
 * CSS media query holatini kuzatadi. Bir xil ma'lumotni ikki xil DOM
 * (masalan mobile ro'yxat va desktop jadval) bilan ikki marta render qilmaslik
 * uchun — Design-06: "<768 grouped mobile list, >=768 table".
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}
