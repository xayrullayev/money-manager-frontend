import { createBrowserRouter, Navigate } from "react-router-dom";
import { PhoneEntryScreen } from "../pages/auth/PhoneEntryScreen";
import { OtpVerifyScreen } from "../pages/auth/OtpVerifyScreen";
import { OnboardingScreen } from "../pages/onboarding/OnboardingScreen";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { TransactionsPage } from "../pages/transactions/TransactionsPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { BudgetsPage } from "../pages/budgets/BudgetsPage";
import { AccountsPage } from "../pages/accounts/AccountsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { StyleGuideLayout } from "../pages/styleguide/StyleGuideLayout";
import { ColorPage } from "../pages/styleguide/ColorPage";
import { TypographyPage } from "../pages/styleguide/TypographyPage";
import { ElementPage } from "../pages/styleguide/ElementPage";
import { ComponentPage } from "../pages/styleguide/ComponentPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "./AppShell";
import { RouteErrorPage } from "./RouteErrorPage";

/**
 * Frontend-01 talabi: routing + URL deep-link.
 * /register, /login — Design-03 / Design-AUTH-01/02 auth oqimi.
 * /onboarding — Design-03 5-qadam (auth'dan alohida).
 * / — Design-04 Dashboard, AppShell (sidebar/bottom nav) ichida.
 * /style-guide — Style & Component jonli style guide (auth talab qilmaydi).
 * Himoyalangan sahifaga sessiyasiz kelinsa manzil eslab qolinadi va login'dan keyin
 * o'sha yerga qaytiladi (ProtectedRoute → shared/lib/returnTo).
 */
export const router = createBrowserRouter([
  {
    // Pathless layout route: har qanday sahifa ichidagi render xatosi shu yerda
    // ushlanadi (React Router'ning standart stack-trace ekrani o'rniga).
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <p role="status">Sahifa yuklanmoqda…</p>,
    children: [
      { path: "/register", element: <PhoneEntryScreen mode="register" /> },
      { path: "/register/verify", element: <OtpVerifyScreen mode="register" /> },
      { path: "/login", element: <PhoneEntryScreen mode="login" /> },
      { path: "/login/verify", element: <OtpVerifyScreen mode="login" /> },
      { path: "/onboarding", element: <OnboardingScreen /> },
      {
        // Style & Component — jonli style guide. AppShell/auth'dan tashqarida,
        // to'g'ridan-to'g'ri ochiladigan dizayn ma'lumotnomasi (Design-Migrate-01/02).
        path: "/style-guide",
        element: <StyleGuideLayout />,
        children: [
          { index: true, element: <Navigate to="/style-guide/colors" replace /> },
          { path: "colors", element: <ColorPage /> },
          { path: "typography", element: <TypographyPage /> },
          { path: "elements", element: <ElementPage /> },
          { path: "components", element: <ComponentPage /> },
        ],
      },
      {
        // Shell bitta layout route: sahifalar orasida qayta mount bo'lmaydi (sidebar holati,
        // fokusni boshqarish va "Yana" menyusi navigatsiyada saqlanadi).
        element: <ProtectedRoute><AppShell /></ProtectedRoute>,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/transactions", element: <TransactionsPage /> },
          { path: "/accounts", element: <AccountsPage /> },
          { path: "/budgets", element: <BudgetsPage /> },
          { path: "/savings", lazy: async () => ({ Component: (await import("../pages/savings/SavingPlansPage")).SavingPlansPage }) },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
