import React, { useState } from 'react';
import { DEFAULT_FACELESS_AVATAR, DEFAULT_FACELESS_AVATAR_DATA_URI } from '../../assets/defaultAvatar';

export interface FacelessAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  shape?: 'circle' | 'rounded';
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-6 h-6',     // 24px (compact table cells, leave balances)
  sm: 'w-8 h-8',     // 32px (header status, attendance register)
  md: 'w-10 h-10',   // 40px (standard employee lists & cards)
  lg: 'w-14 h-14',   // 56px (modal headers, profile cards)
  xl: 'w-16 h-16',   // 64px (employee portal banner)
  '2xl': 'w-24 h-24 sm:w-28 sm:h-28', // 96px-112px (profile dossier)
};

export const FacelessAvatar: React.FC<FacelessAvatarProps> = ({
  src,
  alt = 'Employee Avatar',
  size = 'md',
  className = '',
  shape = 'circle',
}) => {
  // If no source provided or source is blank, use default faceless avatar
  const initialSrc = (src && src.trim()) ? src.trim() : DEFAULT_FACELESS_AVATAR;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState(false);

  // If the src prop changes externally, update state
  React.useEffect(() => {
    const valid = (src && src.trim()) ? src.trim() : DEFAULT_FACELESS_AVATAR;
    setCurrentSrc(valid);
    setHasError(false);
  }, [src]);

  const sizeClass = typeof size === 'number' ? '' : (SIZE_MAP[size] || SIZE_MAP.md);
  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback from primary URL to embedded SVG data URI to guarantee 100% display
      if (currentSrc !== DEFAULT_FACELESS_AVATAR_DATA_URI) {
        setCurrentSrc(DEFAULT_FACELESS_AVATAR_DATA_URI);
      }
    }
  };

  return (
    <div
      style={customStyle}
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none bg-slate-100 ${shapeClass} ${sizeClass} ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt}
        onError={handleError}
        loading="lazy"
        className={`w-full h-full object-cover ${shapeClass}`}
      />
    </div>
  );
};
