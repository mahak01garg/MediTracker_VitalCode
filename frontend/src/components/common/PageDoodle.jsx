import React from "react";

const svgByType = {
  dashboard: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="8" y="10" width="164" height="100" rx="16" fill="#EEF2FF" />
      <rect x="24" y="30" width="48" height="64" rx="8" fill="#4F46E5" />
      <rect x="78" y="48" width="32" height="46" rx="8" fill="#22C55E" />
      <rect x="116" y="38" width="38" height="56" rx="8" fill="#F59E0B" />
      <path d="M26 24h128" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  medication: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="20" y="18" width="62" height="28" rx="14" fill="#2563EB" />
      <rect x="82" y="18" width="62" height="28" rx="14" fill="#93C5FD" />
      <rect x="36" y="58" width="108" height="42" rx="10" fill="#ECFEFF" stroke="#0EA5E9" strokeWidth="3" />
      <path d="M90 64v30M75 79h30" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="18" y="12" width="144" height="96" rx="14" fill="#FEF3C7" />
      <rect x="18" y="12" width="144" height="24" rx="14" fill="#F59E0B" />
      <circle cx="48" cy="24" r="4" fill="#fff" />
      <circle cx="90" cy="24" r="4" fill="#fff" />
      <circle cx="132" cy="24" r="4" fill="#fff" />
      <path d="M42 54h96M42 72h72M42 90h56" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  doctor: (
    <svg viewBox="0 0 180 120" fill="none">
      <circle cx="90" cy="34" r="18" fill="#BFDBFE" />
      <rect x="52" y="54" width="76" height="46" rx="12" fill="#1D4ED8" />
      <path d="M90 62v24M78 74h24" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <rect x="64" y="16" width="52" height="8" rx="4" fill="#3B82F6" />
    </svg>
  ),
  appointment: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="24" y="16" width="132" height="88" rx="14" fill="#F3E8FF" />
      <rect x="24" y="16" width="132" height="22" rx="14" fill="#7C3AED" />
      <circle cx="50" cy="27" r="3" fill="#fff" />
      <circle cx="72" cy="27" r="3" fill="#fff" />
      <path d="M44 56h92M44 74h74" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
      <circle cx="132" cy="74" r="10" fill="#10B981" />
      <path d="m128 74 3 3 5-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 180 120" fill="none">
      <circle cx="90" cy="35" r="20" fill="#CFFAFE" />
      <rect x="50" y="60" width="80" height="40" rx="16" fill="#0891B2" />
      <circle cx="124" cy="28" r="12" fill="#22C55E" />
      <path d="m119 28 3 3 5-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 180 120" fill="none">
      <circle cx="90" cy="60" r="34" fill="#E0E7FF" />
      <circle cx="90" cy="60" r="16" fill="#4F46E5" />
      <path d="M90 18v14M90 88v14M48 60H34M146 60h-14M60 30l8 8M120 90l-8-8M60 90l8-8M120 30l-8 8" stroke="#3730A3" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="26" y="16" width="128" height="88" rx="20" fill="#DBEAFE" />
      <circle cx="90" cy="52" r="20" fill="#2563EB" />
      <path d="M90 42v16M90 70h.01" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <rect x="72" y="84" width="36" height="8" rx="4" fill="#93C5FD" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="28" y="20" width="124" height="80" rx="18" fill="#DCFCE7" />
      <rect x="56" y="34" width="68" height="38" rx="10" fill="#16A34A" />
      <circle cx="76" cy="52" r="5" fill="#fff" />
      <circle cx="104" cy="52" r="5" fill="#fff" />
      <path d="M76 66h28" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M90 20v-8M58 30l-6-6M122 30l6-6" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 180 120" fill="none">
      <rect x="14" y="12" width="152" height="96" rx="16" fill="#ECFEFF" />
      <path d="M30 84 62 62l24 12 32-30 32 16" stroke="#06B6D4" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="62" r="5" fill="#0EA5E9" />
      <circle cx="86" cy="74" r="5" fill="#0EA5E9" />
      <circle cx="118" cy="44" r="5" fill="#0EA5E9" />
      <circle cx="150" cy="60" r="5" fill="#0EA5E9" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 180 120" fill="none">
      <path d="M90 16 46 32v24c0 27 19 41 44 48 25-7 44-21 44-48V32L90 16Z" fill="#FEF2F2" stroke="#DC2626" strokeWidth="4" />
      <path d="m75 58 10 10 20-20" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const PageDoodle = ({ type = "dashboard", className = "" }) => {
  const svg = svgByType[type] || svgByType.dashboard;
  return (
    <div className={`w-28 h-20 md:w-36 md:h-24 opacity-95 ${className}`}>
      {svg}
    </div>
  );
};

export default PageDoodle;
