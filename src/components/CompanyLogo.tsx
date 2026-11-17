import React from 'react';

interface CompanyLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  variant = 'dark',
  size = 'md',
}) => {
  const iconSize = size === 'lg' ? 52 : size === 'sm' ? 32 : 42;
  const primaryColor = variant === 'light' ? '#FFFFFF' : '#0F2942';
  const secondaryText = variant === 'light' ? '#BAE6FD' : '#475569';

  return (
    <div className="inline-flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo Inversora La Experta B.G., C.A."
        className="shrink-0"
      >
        {/* Escudo base industrial */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="12"
          fill="#0F2942"
          stroke="#0284C7"
          strokeWidth="2"
        />
        {/* Arco de precisión API 653 */}
        <path
          d="M12 22C18 14 46 14 52 22"
          stroke="#38BDF8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Cuerpo del tanque atmosférico */}
        <rect
          x="14"
          y="24"
          width="36"
          height="22"
          rx="2"
          fill="#1E3A5F"
          stroke="#E2E8F0"
          strokeWidth="1.8"
        />
        {/* Anillos horizontales del tanque */}
        <line x1="14" y1="31" x2="50" y2="31" stroke="#64748B" strokeWidth="1.2" />
        <line x1="14" y1="38" x2="50" y2="38" stroke="#64748B" strokeWidth="1.2" />
        {/* Techo flotante / cúpula */}
        <path
          d="M12 24L32 17L52 24"
          fill="#0284C7"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Base anular */}
        <rect x="10" y="46" width="44" height="4" rx="1.5" fill="#D97706" />
        {/* Distintivo de integridad QA/QC */}
        <circle cx="48" cy="46" r="8" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
        <path
          d="M44.5 46L47 48.5L51.5 43.5"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="leading-tight">
        <div
          className="font-display text-sm font-extrabold tracking-tight"
          style={{ color: primaryColor }}
        >
          INVERSORA LA EXPERTA B.G., C.A.
        </div>
        <div
          className="font-mono text-[10px] font-semibold tracking-wider"
          style={{ color: secondaryText }}
        >
          INGENIERÍA Y MANTENIMIENTO · API 653 / ASME
        </div>
      </div>
    </div>
  );
};
