import type { SVGProps, ReactNode } from "react";

/**
 * Design-Migrate-03: sidebar/rail/drawer uchun line-ikonkalar.
 * Figma "Element" line-icon uslubi: 20px, stroke currentColor, aria-hidden.
 * Rang meros orqali (currentColor) — faol/nofaol holat CSS'da hal qilinadi.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Bosh sahifa — dashboard (grid). */
export function DashboardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Base>
  );
}

/** Operatsiyalar — transactions (ikki yo'nalishli o'q). */
export function TransactionsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h13" />
      <path d="M14 5l3 3-3 3" />
      <path d="M20 16H7" />
      <path d="M10 13l-3 3 3 3" />
    </Base>
  );
}

/** Hisoblar — accounts (hamyon/karta). */
export function AccountsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M16 14h2" />
    </Base>
  );
}

/** Budjetlar — budgets (progress/coins). */
export function BudgetsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </Base>
  );
}

/** Hisobotlar — reports (hujjat + chiziqlar). */
export function ReportsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </Base>
  );
}

/** Sozlamalar — settings (shesternya). */
export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </Base>
  );
}

/** Chiqish — sign out. */
export function SignOutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3" />
      <path d="M16 12H10" />
      <path d="M14 8l4 4-4 4" />
    </Base>
  );
}

/** Mobil menyu ochish — hamburger. */
export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Base>
  );
}

/** Menyu yopish — X. */
export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Base>
  );
}

/** Style & Component — dizayn tizimi (swatch/komponent belgisi). */
export function StyleGuideIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <circle cx="17" cy="17" r="4" />
    </Base>
  );
}

export function SavingsIcon(props: IconProps) { return <Base {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m16 8 5-5M17 3h4v4"/></Base>; }
