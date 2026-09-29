import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installMockApi } from "./shared/api/mock";

// Frontend-check-01: VITE_API_MOCK yoqilgan bo'lsa, ilova render bo'lishidan oldin
// apiClient adapteri mock adapterga almashtiriladi (real backend yo'q paytida QA uchun).
installMockApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
