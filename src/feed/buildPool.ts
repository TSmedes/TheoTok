import type { Card, ContentType, Tradition } from '@/content/types';
import { TRADITIONS } from '@/content/types';

import { interleaveByType } from './interleave';
import { mulberry32, weightedShuffle } from './shuffle';

/**
 * 'ecumenical' is a content bucket, not a party: creeds, councils and Scripture
 * belong to everyone, so those cards match every filter. It is therefore never
 * offered as a choice in onboarding.
 */
export const SELECTABLE_TRADITIONS: readonly Tradition[] = TRADITIONS.filter(
  (t) => t !== 'ecumenical',
);

export interface FeedPreferences {
  /** Empty means "no tradition filter" rather than "nothing", so the feed is never blank. */
  traditions: readonly Tradition[];
  types: readonly ContentType[];
}

export function matchesTraditions(card: Card, selected: readonly Tradition[]): boolean {
  if (selected.length === 0) return true;
  if (card.traditions.includes('ecumenical')) return true;
  return card.traditions.some((t) => selected.includes(t));
}

/** The cards a given set of filters can draw from. */
export function buildPool(cards: readonly Card[], prefs: FeedPreferences): Card[] {
  return cards.filter(
    (card) => prefs.types.includes(card.type) && matchesTraditions(card, prefs.traditions),
  );
}

export interface SequenceResult {
  sequence: Card[];
  /**
   * True when every card in the pool had already been seen, so the seen set was
   * discarded and the pool reused. The feed shows a divider when this happens
   * rather than silently starting over or dead-ending.
   */
  recycled: boolean;
}

/**
 * Orders a pool into the sequence the feed will actually scroll through:
 * unseen cards first, weighted-shuffled by the given seed, then interleaved so
 * no type runs more than twice.
 *
 * Pure, so the whole ordering policy is testable without mounting the feed.
 */
export function buildSequence(
  pool: readonly Card[],
  seen: ReadonlySet<string>,
  seed: number,
): SequenceResult {
  const unseen = pool.filter((card) => !seen.has(card.id));
  const recycled = unseen.length === 0 && pool.length > 0;
  const source = recycled ? pool : unseen;

  const shuffled = weightedShuffle(source, (card) => card.weight ?? 1, mulberry32(seed));
  // A separate PRNG stream, so the interleave's tie-breaks don't correlate with
  // the shuffle's draws while both stay derived from the one seed.
  const interleaveRand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  return {
    sequence: interleaveByType(shuffled, (card) => card.type, interleaveRand),
    recycled,
  };
}
