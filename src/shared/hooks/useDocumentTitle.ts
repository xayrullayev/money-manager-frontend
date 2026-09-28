import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitle } from "../lib/pageTitle";

/** Joriy route bo'yicha `document.title`ni yangilaydi (Frontend-01). */
export function useDocumentTitle(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pageTitle(pathname);
  }, [pathname]);
}
