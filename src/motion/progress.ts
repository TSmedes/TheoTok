import { motion } from '@/theme/tokens';

/**
 * The arithmetic behind Layer B, kept pure so it can be checked without a
 * device — the same reasoning as `windowing.ts` and `visualIndex.ts`.
 *
 * These run inside worklets on the UI thread. They are not among the argument
 * positions the worklets plugin workletises automatically, so each carries its
 * own directive.
 */

/**
 * How far a card's top edge sits from where it would be if the card were the
 * one in view, in pixels. Zero when the card is exactly in place, negative once
 * the reader has scrolled past it.
 */
export function centreDistance(index: number, scrollY: number, pageHeight: number): number {
  'worklet';
  return index * pageHeight - scrollY;
}

/**
 * The same distance as a 0-to-1 fraction of a page, clamped. 0 means the card
 * is in view, 1 means a full page away or further, in either direction.
 */
export function centreProgress(index: number, scrollY: number, pageHeight: number): number {
  'worklet';
  if (pageHeight <= 0) return 0;
  const distance = Math.abs(centreDistance(index, scrollY, pageHeight));
  return Math.min(1, distance / pageHeight);
}

/**
 * How far a card's text is displaced within its own card, in pixels.
 *
 * The text scrolls at `motion.parallax` of the rate the card does, so what it
 * fails to travel accumulates as a local offset — the whole of the depth
 * effect. The sign is inverted because a card moving up the screen leaves its
 * text trailing below.
 */
export function textDrift(index: number, scrollY: number, pageHeight: number): number {
  'worklet';
  if (pageHeight <= 0) return 0;
  return -centreDistance(index, scrollY, pageHeight) * (1 - motion.parallax);
}

/** Linear map of a 0-to-1 progress onto a range. */
export function rampTo(progress: number, restValue: number): number {
  'worklet';
  return 1 + (restValue - 1) * progress;
}
