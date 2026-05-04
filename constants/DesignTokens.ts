/**
 * Design Tokens for CrashCue App
 * Centralized design system with reusable styles, gradients, and animations
 */

// Gradient Definitions
export const GRADIENTS = {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#f093fb', '#f5576c'],
    success: ['#11998e', '#38ef7d'],
    danger: ['#eb3349', '#f45c43'],
    warning: ['#f2994a', '#f2c94c'],
    dark: ['#1F2937', '#374151'],
    purple: ['#5B5FED', '#8B5FED'],
    blue: ['#3b82f6', '#8b5cf6'],
    ocean: ['#2E3192', '#1BFFFF'],
    sunset: ['#FF6B6B', '#FFE66D'],
    forest: ['#134E5E', '#71B280'],
} as const;

// Shadow Presets
export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }),
};

// Border Radius
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
};

// Spacing Scale
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
};

// Animation Durations
export const DURATION = {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
};

// Glassmorphism Styles
export const GLASS = {
    light: 'bg-white/10 backdrop-blur-xl border border-white/20',
    medium: 'bg-white/20 backdrop-blur-2xl border border-white/30',
    dark: 'bg-black/10 backdrop-blur-xl border border-black/20',
};

// Common Card Styles
export const CARD_STYLES = {
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl',
    elevated: 'bg-white rounded-2xl border border-gray-100',
    flat: 'bg-white rounded-2xl',
};

// Button Styles
export const BUTTON_STYLES = {
    primary: 'rounded-2xl px-6 py-4 items-center justify-center',
    secondary: 'rounded-xl px-4 py-3 items-center justify-center',
    icon: 'w-12 h-12 rounded-full items-center justify-center',
    iconLg: 'w-16 h-16 rounded-full items-center justify-center',
};

// Typography Scales
export const TYPOGRAPHY = {
    hero: 'text-5xl font-black tracking-tight',
    title: 'text-3xl font-bold',
    subtitle: 'text-xl font-semibold',
    body: 'text-base font-normal',
    caption: 'text-sm font-medium',
    tiny: 'text-xs font-normal',
};
