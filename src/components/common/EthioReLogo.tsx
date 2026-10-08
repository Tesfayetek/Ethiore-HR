import React from 'react';

export interface EthioReLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'compact';
  theme?: 'dark' | 'light';
  className?: string;
  showText?: boolean;
}

/**
 * Official Ethiopian Reinsurance S.C. (EthioRe) Logo
 * 
 * Faithfully constructed from the uploaded corporate brand logo (log-mini.jpg):
 * - Primary Background: Deep Teal-Blue (#186382)
 * - Emblem Ligature: Golden-Yellow "RE" (#CCA352) where the R leg flows into E bottom bar
 * - Typography: "Ethiopian Reinsurance" in crisp white, with Amharic Ge'ez script
 */
export const EthioReLogo: React.FC<EthioReLogoProps> = ({
  size = 'md',
  variant = 'full',
  theme = 'dark',
  className = '',
  showText = true,
}) => {
  // Dimensions for emblem
  const dimensions = {
    sm: { box: 'w-8 h-9', width: 32, height: 36, fontMain: 'text-xs', fontSub: 'text-[9px]' },
    md: { box: 'w-10 h-11', width: 40, height: 46, fontMain: 'text-sm font-bold', fontSub: 'text-[10px]' },
    lg: { box: 'w-14 h-16', width: 56, height: 64, fontMain: 'text-base font-bold', fontSub: 'text-xs' },
    xl: { box: 'w-20 h-24', width: 80, height: 92, fontMain: 'text-xl font-bold', fontSub: 'text-xs' },
  }[size];

  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0B2533]';
  const subTextColor = theme === 'dark' ? 'text-[#DFE9ED]' : 'text-[#475B66]';

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Official Ethiopian Reinsurance Logo Tile */}
      <div
        className={`${dimensions.box} rounded-lg overflow-hidden shadow-md shrink-0 flex items-center justify-center border border-[#CCA352]/30`}
        style={{
          aspectRatio: '180 / 210',
          background: 'linear-gradient(135deg, #1A6584 0%, #114E68 100%)',
        }}
        title="Ethiopian Reinsurance S.C. Official Logo"
      >
        <svg
          viewBox="0 0 180 210"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ethioreBgTile" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A6584" />
              <stop offset="100%" stopColor="#114E68" />
            </linearGradient>
            <linearGradient id="ethioreGoldLigature" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D8B062" />
              <stop offset="100%" stopColor="#BF9544" />
            </linearGradient>
          </defs>

          {/* Deep Blue/Teal Background */}
          <rect width="180" height="210" rx="12" fill="url(#ethioreBgTile)" />

          {/* Golden-Yellow "RE" Ligature as shown in log-mini.jpg */}
          <g fill="url(#ethioreGoldLigature)">
            {/* 'R' Stem and Upper Loop */}
            <path d="M 32 28 
                     L 52 28 
                     C 70 28 78 35 78 48 
                     C 78 59 69 66 54 66 
                     L 47 66 
                     L 47 98 
                     L 32 98 Z 
                     M 47 41 
                     L 47 53 
                     L 52 53 
                     C 60 53 63.5 51 63.5 47 
                     C 63.5 43 60 41 52 41 Z" />

            {/* 'R' Leg curving into 'E' Bottom Bar */}
            <path d="M 52 64 
                     L 68 64 
                     L 78 85 
                     L 148 85 
                     L 148 98 
                     L 72 98 
                     C 67.5 98 63.5 95 61 90 Z" />

            {/* 'E' Top Bar */}
            <rect x="92" y="28" width="56" height="13.5" rx="1" />

            {/* 'E' Middle Bar */}
            <rect x="92" y="56" width="48" height="13" rx="1" />
          </g>

          {/* Brand Name: "Ethiopian Reinsurance" in Crisp White */}
          <text
            x="90"
            y="131"
            textAnchor="middle"
            fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="700"
            fontSize="18"
            fill="#FFFFFF"
            letterSpacing="0.4"
          >
            Ethiopian
          </text>
          <text
            x="90"
            y="155"
            textAnchor="middle"
            fontFamily="'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="700"
            fontSize="17"
            fill="#FFFFFF"
            letterSpacing="0.4"
          >
            Reinsurance
          </text>

          {/* Amharic Script: የኢትዮጵያ ሪ-ኢንሹራንስ አ.ማ */}
          <text
            x="90"
            y="180"
            textAnchor="middle"
            fontFamily="'Nyala', 'Abyssinica SIL', system-ui, sans-serif"
            fontWeight="500"
            fontSize="11"
            fill="#FFFFFF"
            opacity="0.92"
            letterSpacing="0.5"
          >
            የኢትዮጵያ ሪ-ኢንሹራንስ አ.ማ
          </text>
        </svg>
      </div>

      {/* Typography Wordmark (for full variant) */}
      {variant !== 'mark' && showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center space-x-1.5">
            <span className={`tracking-tight ${dimensions.fontMain} ${textColor}`}>
              ETHIOPIAN REINSURANCE
            </span>
            <span className="text-[#CCA352] font-bold text-xs tracking-wider">S.C.</span>
          </div>

          <div className="flex items-center space-x-2 mt-0.5">
            <span className="font-semibold text-[#CCA352] text-xs tracking-wide">EthioRe</span>
            <span className="text-slate-400 text-xs">·</span>
            <span className={`${dimensions.fontSub} ${subTextColor} tracking-normal hidden sm:inline`}>
              የኢትዮጵያ ሪ-ኢንሹራንስ አ.ማ.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
