import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorFallback } from "./ErrorFallback";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * Router `errorElement` — sahifa ichidagi render xatosi React Router'ning
 * standart "Unexpected Application Error!" ekraniga (stack trace bilan)
 * tushmasligi uchun. Xato faqat konsolga yoziladi, foydalanuvchiga
 * texnik tafsilot ko'rsatilmaydi.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error("Route render error:", error);
    document.title = "Xatolik · Money Manager";
  }, [error]);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  // To'liq qayta yuklash: xato holatidagi komponentlar va keshlar tozalanadi.
  return <ErrorFallback onAction={() => window.location.assign("/")} />;
}
