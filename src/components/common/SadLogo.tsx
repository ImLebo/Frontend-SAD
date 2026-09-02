import React from 'react';

interface SadLogoProps {
  className?: string;
  size?: number;
}

export const SadLogo: React.FC<SadLogoProps> = ({ className = '', size = 38 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        {/* Main Shield Gradient */}
        <linearGradient id="sadShieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Dynamic Wave & Glow Gradient */}
        <linearGradient id="sadPulseGrad" x1="12" y1="24" x2="36" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="sadGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Hexagonal Shield Base */}
      <path
        d="M24 4L40 10V22C40 32.5 33.2 41.8 24 44.5C14.8 41.8 8 32.5 8 22V10L24 4Z"
        fill="url(#sadShieldGrad)"
        stroke="#60a5fa"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#sadGlow)"
      />

      {/* Inner Geometric Shield Outline */}
      <path
        d="M24 8.5L36 13V22C36 30.2 30.8 37.5 24 39.8C17.2 37.5 12 30.2 12 22V13L24 8.5Z"
        stroke="#93c5fd"
        strokeWidth="1"
        strokeOpacity="0.35"
        fill="none"
      />

      {/* Central Vital ECG / Response Wave */}
      <path
        d="M15 24.5H19L21.5 17L26.5 32L29 24.5H33"
        stroke="url(#sadPulseGrad)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Protection Beacon Point */}
      <circle cx="24" cy="12" r="2.2" fill="#38bdf8" />
      <circle cx="24" cy="12" r="4.2" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.5" />
    </svg>
  );
};
export default SadLogo;
