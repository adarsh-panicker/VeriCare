export function VeriCareLogo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VeriCare Logo"
    >
      <defs>
        <linearGradient id="vericare-bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      {/* Shield base */}
      <path
        d="M24 3L7 10.5V22.5C7 33.4 14.2 42.9 24 45.5C33.8 42.9 41 33.4 41 22.5V10.5L24 3Z"
        fill="url(#vericare-bg)"
        stroke="#CCFBF1"
        strokeWidth="2"
      />
      {/* Medical cross */}
      <rect x="21" y="12" width="6" height="16" rx="1.5" fill="#FFFFFF" fillOpacity="0.92" />
      <rect x="16" y="17" width="16" height="6" rx="1.5" fill="#FFFFFF" fillOpacity="0.92" />
      {/* Pulse / verification checkmark */}
      <path
        d="M14.5 32.5L19.5 32.5L22 28.5L25.5 36L28.5 31L33.5 31"
        stroke="#5EEAD4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
