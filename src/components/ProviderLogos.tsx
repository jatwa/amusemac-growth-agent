import React from 'react';

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.05.0 12s.47 3.8 1.29 5.42l3.99-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const ZohoLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
    <g fontWeight="900" fontFamily="sans-serif" fontSize="28">
      <rect x="2" y="5" width="21" height="28" rx="4" fill="#ED1C24" />
      <text x="7" y="27" fill="#FFFFFF">Z</text>
      
      <rect x="26" y="5" width="21" height="28" rx="4" fill="#00A651" />
      <text x="30" y="27" fill="#FFFFFF">O</text>
      
      <rect x="50" y="5" width="21" height="28" rx="4" fill="#0072BC" />
      <text x="54" y="27" fill="#FFFFFF">H</text>
      
      <rect x="74" y="5" width="21" height="28" rx="4" fill="#F7941D" />
      <text x="78" y="27" fill="#FFFFFF">O</text>
    </g>
  </svg>
);

export const AmusemacLogo: React.FC<{ className?: string; iconSize?: string }> = ({
  className = "w-9 h-9",
  iconSize = "w-5 h-5"
}) => (
  <div className={`${className} rounded-xl bg-gradient-to-tr from-[#f5b82e] to-[#d49b19] p-0.5 shadow-lg shadow-[#f5b82e]/20 flex items-center justify-center`}>
    <div className="w-full h-full bg-[#0c0d12] rounded-[10px] flex items-center justify-center">
      <svg className={`${iconSize} text-[#f5b82e]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    </div>
  </div>
);
