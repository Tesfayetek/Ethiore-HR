/**
 * Ethiopian Reinsurance S.C. (EthioRe) Official Brand Color Theme
 * 
 * Centralized theme definition derived directly from the official Ethiopian
 * Reinsurance logo (log-mini.jpg):
 * - Primary: Deep Oceanic Teal-Blue background tone (#186382)
 * - Accent: Warm Golden-Yellow "RE" ligature tone (#CCA352)
 */

export const ethioReTheme = {
  // Corporate Brand Colors extracted from Ethiopian Reinsurance logo
  colors: {
    // Dominant Blue/Teal tone from logo background
    primary: '#186382',
    primaryDark: '#0E3D52',
    primaryDarkest: '#082836',
    primaryLight: '#227D9E',
    primaryMuted: '#EBF3F7',
    primaryHover: '#1D7296',

    // Yellow/Gold "RE" accent from logo
    accent: '#CCA352',
    accentDark: '#A6802C',
    accentLight: '#E2BE6C',
    accentMuted: '#FAF3E3',
    accentHover: '#BA9241',

    // Secondary alias pointing to the gold/amber accent
    secondary: '#CCA352',
    secondaryLight: '#E2BE6C',
    secondaryDark: '#A6802C',
    secondaryMuted: '#FAF3E3',

    // Neutral Surfaces & Canvas
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F6F8',
    surfaceMuted: '#DFE9ED',

    // Typography
    textPrimary: '#0B2533',
    textSecondary: '#475B66',
    textMuted: '#78909C',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',

    // Structural Borders & Dividers
    border: '#DFE9ED',
    borderLight: '#EDF3F6',
    borderDark: '#CBD8DE',

    // Semantic Status Tokens (Distinct from Corporate Colors)
    success: '#059669',
    successBg: '#ECFDF5',
    successBorder: '#A7F3D0',
    successText: '#065F46',

    warning: '#D97706',
    warningBg: '#FFFBEB',
    warningBorder: '#FDE68A',
    warningText: '#92400E',

    error: '#DC2626',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    errorText: '#991B1B',

    info: '#186382',
    infoBg: '#EBF3F7',
    infoBorder: '#BDE0EE',
    infoText: '#0E3D52',
  },

  // Tailwind CSS Utility Class Mappings
  classes: {
    // Header & Navigation
    headerBg: 'bg-[#0E3D52]',
    headerBorder: 'border-[#186382]',
    sidebarBg: 'bg-[#082836]',
    sidebarBorder: 'border-[#0E3D52]',
    sidebarActiveItem: 'bg-[#186382] text-white border-l-4 border-[#CCA352] shadow-sm',
    sidebarInactiveItem: 'text-slate-300 hover:text-white hover:bg-[#186382]/60',

    // Buttons
    btnPrimary: 'bg-[#186382] hover:bg-[#227D9E] text-white font-semibold transition-all shadow-xs active:scale-[0.99]',
    btnSecondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold transition-all shadow-xs',
    btnGold: 'bg-[#CCA352] hover:bg-[#BA9241] text-white font-bold transition-all shadow-xs active:scale-[0.99]',
    btnDestructive: 'bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs',

    // Form Controls
    input: 'border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#186382] focus:border-[#186382] transition-colors',
    select: 'border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#186382] focus:border-[#186382] transition-colors',

    // Badges & Pills
    badgeCorporate: 'bg-[#EBF3F7] text-[#186382] border border-[#BDE0EE] font-medium text-xs px-2.5 py-0.5 rounded-full',
    badgeGold: 'bg-[#FAF3E3] text-[#A6802C] border border-[#E2BE6C]/60 font-medium text-xs px-2.5 py-0.5 rounded-full',
    badgeNeutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs px-2.5 py-0.5 rounded-full',

    // Table Accents
    tableHeader: 'bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200',
    tableRowHover: 'hover:bg-[#EBF3F7]/50 transition-colors',

    // Card Containers
    card: 'bg-white rounded-xl border border-slate-200 shadow-xs hover:border-[#186382]/40 transition-colors',
    cardBranded: 'bg-gradient-to-r from-[#0E3D52] via-[#186382] to-[#082836] text-white rounded-xl border-b-2 border-[#CCA352] shadow-md',
  },
};
