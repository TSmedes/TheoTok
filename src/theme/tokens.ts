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

/**
 * "Reverent": slow, soft, small travel — motion you feel rather than notice.
 * Durations in ms, distances in px.
 *
 * This module is imported by the web bundle and by tests, so it must stay free
 * of Reanimated. It exports plain numbers; `@/motion/curves` turns `ease` into a
 * native `Easing.bezier`, and `global.css` mirrors these as `--motion-*` custom
 * properties. There is no build step joining the two, so a change here means a
 * matching change there.
 */
export const motion = {
  /** One element's entrance. */
  settle: 320,
  /** Between cue → body → rule. Three elements land in ~440ms. */
  stagger: 60,
  /** How far an entering element travels up. */
  rise: 16,
  /** Web's active/inactive page opacity transition. */
  dim: 380,
  /** Non-active pages on web, where there is no parallax opacity ramp. */
  dimOpacity: 0.55,
  /** Layer B: text moves at this fraction of the gradient's scroll rate. */
  parallax: 0.85,
  /** Layer B: what an off-centre card settles back to. */
  restScale: 0.94,
  restOpacity: 0.45,
  /** Matches the rule in `Citation`; the wipe is scaleX from 0, never width. */
  ruleWidth: 44,
  /** Reduced motion keeps the fade but drops the travel, and shortens it. */
  reduced: 200,
  /** Web keyboard-driven page scroll (`scrollTween`). */
  scroll: 320,
} as const;

export const motionEase = {
  /** Ease-out with a long tail — the deceleration is the whole character. */
  out: [0.22, 1, 0.36, 1] as const,
  cssOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
