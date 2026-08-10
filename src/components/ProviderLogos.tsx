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

export const MicrosoftLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="10.8" height="10.8" fill="#F25022" />
    <rect x="12.2" y="0" width="10.8" height="10.8" fill="#7FBA00" />
    <rect x="0" y="12.2" width="10.8" height="10.8" fill="#00A4EF" />
    <rect x="12.2" y="12.2" width="10.8" height="10.8" fill="#FFB900" />
  </svg>
);

export const AppleLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 170 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.82.13-9.67-1.92-14.54-6.16-3.23-2.73-7.14-7.46-11.75-14.18-7.1-10.37-12.44-21.78-16.03-34.22-3.59-12.44-5.38-24.12-5.38-35.04 0-14.97 3.8-27.17 11.41-36.6 7.61-9.43 17.2-14.25 28.78-14.46 4.93 0 10.31 1.25 16.14 3.75 5.83 2.5 9.77 3.75 11.82 3.75 1.63 0 5.68-1.3 12.16-3.9 6.48-2.6 11.72-3.8 15.72-3.6 11.08.47 19.99 4.3 26.73 11.49-9.84 5.96-14.65 14.28-14.42 24.96.23 8.35 3.39 15.42 9.48 21.21 6.09 5.79 13.43 9.07 22.02 9.84-2.12 6.25-4.8 12.45-8.04 18.59zM119.22 31.84c0-7.39 2.66-14.37 7.98-20.94 5.32-6.57 11.96-10.45 19.92-11.64.23 1.06.35 2.06.35 3 0 7.35-2.77 14.48-8.31 21.39-5.54 6.91-12.27 10.74-20.19 11.49-.07-1.12-.11-2.22-.11-3.3z" />
  </svg>
);

export const ZohoLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
    <g font-weight="900" font-family="sans-serif" font-size="28">
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
