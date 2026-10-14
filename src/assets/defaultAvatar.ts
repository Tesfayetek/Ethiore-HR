/**
 * Official Faceless Avatar Asset for Ethiopian Reinsurance HRMS
 * Professional, neutral human silhouette without identifiable personal photos,
 * facial features, names, or initials. Styled in Ethiopian Re corporate
 * navy blue (#0E3D52) and gold (#CCA352) accents on neutral slate backdrop.
 */

export const DEFAULT_FACELESS_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ethioreAvatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <linearGradient id="ethioreSilhouette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1B556F" />
      <stop offset="100%" stop-color="#0E3D52" />
    </linearGradient>
    <linearGradient id="ethioreGoldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#CCA352" />
      <stop offset="100%" stop-color="#E2BE6C" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="99" fill="url(#ethioreAvatarBg)" stroke="#CBD5E1" stroke-width="2" />
  <g id="faceless-figure">
    <path d="M100 40 C79 40 64 56 64 78 C64 97 78 111 100 111 C122 111 136 97 136 78 C136 56 121 40 100 40 Z" fill="url(#ethioreSilhouette)" />
    <path d="M88 127 L100 139 L112 127" stroke="url(#ethioreGoldAccent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M34 186 C36 142 66 122 100 122 C134 122 164 142 166 186 C148 197 125 200 100 200 C75 200 52 197 34 186 Z" fill="url(#ethioreSilhouette)" />
  </g>
</svg>`;

export const DEFAULT_FACELESS_AVATAR_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  DEFAULT_FACELESS_AVATAR_SVG
)}`;

// Standard relative URL served from /public/assets/
export const DEFAULT_FACELESS_AVATAR_PATH = '/assets/faceless-avatar.svg';

// Primary default avatar reference used throughout the HRMS application
export const DEFAULT_FACELESS_AVATAR = DEFAULT_FACELESS_AVATAR_PATH;
