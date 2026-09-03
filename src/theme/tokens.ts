import '@/global.css';

import { Platform } from 'react-native';

import type { ContentType } from '@/content/types';

/**
 * "Sacred modern": every card is a full-bleed dark gradient, keyed to its content
 * type, with a single warm gold used for citations across all three. The colour
 * teaches the taxonomy without needing a label.
 */
export const gradients: Record<ContentType, readonly [string, string, string]> = {
  scripture: ['#0A0821', '#241A5E', '#4A2E8F'],
  history: ['#170609', '#4E1119', '#8A2836'],
  doctrine: ['#04120F', '#0B3830', '#166B57'],
};

/** Diagonal, top-left to bottom-right. */
export const gradientStart = { x: 0, y: 0 } as const;
export const gradientEnd = { x: 1, y: 1 } as const;
export const gradientLocations = [0, 0.55, 1] as const;

export const colors = {
  /** Behind everything, and the letterbox on wide screens. */
  void: '#050509',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textTertiary: 'rgba(255, 255, 255, 0.48)',
  /** Warm gold — citations, rules, active filter chips. */
  accent: '#E4C07A',
  accentDim: 'rgba(228, 192, 122, 0.42)',
  rule: 'rgba(255, 255, 255, 0.18)',
  scrim: 'rgba(5, 5, 9, 0.72)',
  surface: '#0E0E16',
  surfaceRaised: '#181822',
} as const;

export const fonts = Platform.select({
  ios: { display: 'ui-serif', ui: 'system-ui' },
  android: { display: 'serif', ui: 'sans-serif' },
  default: { display: 'var(--font-serif)', ui: 'var(--font-display)' },
})!;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Discrete size tiers chosen from character count, rather than
 * `adjustsFontSizeToFit` (native-only, and it forces a measurement pass).
 * Deterministic and pixel-identical on every platform.
 */
export const textTiers = [
  { maxChars: 40, fontSize: 44, lineHeight: 52 },
  { maxChars: 90, fontSize: 36, lineHeight: 46 },
  { maxChars: 180, fontSize: 28, lineHeight: 38 },
  { maxChars: 320, fontSize: 22, lineHeight: 32 },
  { maxChars: Infinity, fontSize: 18, lineHeight: 28 },
] as const;

export function tierFor(text: string) {
  return textTiers.find((t) => text.length <= t.maxChars) ?? textTiers[textTiers.length - 1];
}

/** Cards are centred and letterboxed past this width so desktop web stays readable. */
export const maxCardWidth = 620;
