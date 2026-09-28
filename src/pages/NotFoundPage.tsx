import { useEffect } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "../shared/lib/pageTitle";

export function NotFoundPage() {
  useEffect(() => {
    document.title = `Sahifa topilmadi · ${APP_NAME}`;
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
      <h1>404</h1>
      <p>Sahifa topilmadi.</p>
      <Link to="/">Bosh sahifaga qaytish</Link>
    </div>
  );
}
