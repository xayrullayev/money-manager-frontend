import type { SVGProps } from "react";

/** Style guide demolari uchun kichik ikonkalar (Figma "Element" line uslubi). */
function Base({ children, size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Chevron = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M6 9l6 6 6-6" />
  </Base>
);
export const Search = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Base>
);
export const Bell = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Base>
);
export const Chat = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.5A8.4 8.4 0 1 1 21 11.5z" />
  </Base>
);
export const Attach = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M21.4 11.05 12.25 20.2a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.48-8.49" />
  </Base>
);
export const Smiley = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01M15 9h.01" />
  </Base>
);
export const Coins = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <ellipse cx="9" cy="7" rx="6" ry="3" />
    <path d="M3 7v5c0 1.66 2.7 3 6 3" />
    <path d="M3 12v5c0 1.66 2.7 3 6 3" />
    <ellipse cx="16" cy="14" rx="5" ry="2.5" />
    <path d="M11 14v4c0 1.4 2.24 2.5 5 2.5s5-1.1 5-2.5v-4" />
  </Base>
);
export const Home = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </Base>
);
export const Kebab = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Base>
);
export const Filter = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Base>
);
export const ArrowLeft = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Base>
);
export const ChevronRight = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);
export const ChevronLeft = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Base>
);
export const Sort = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
  </Base>
);
export const Receipt = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Base {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </Base>
);
