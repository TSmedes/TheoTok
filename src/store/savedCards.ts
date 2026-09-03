import { CARDS, toRendered } from '@/content/library';
import type { Card, RenderedCard } from '@/content/types';

import { useSaved } from './saved';

export interface SavedItem {
  card: Card;
  rendered: RenderedCard;
}

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/**
 * The saved collection as renderable cards, newest first.
 *
 * A saved id whose card no longer exists is skipped rather than crashing —
 * content edits should never break somebody's collection.
 */
export function resolveSaved(ids: readonly string[]): SavedItem[] {
  return ids.flatMap((id) => {
    const card = BY_ID.get(id);
    return card ? [{ card, rendered: toRendered(card) }] : [];
  });
}

/** The list screen and the card view read the same collection through here. */
export function useSavedItems(): SavedItem[] {
  return resolveSaved(useSaved((s) => s.ids));
}

/**
 * Holds an index inside a collection that can shrink underneath it — unsaving
 * the card you are looking at is the ordinary way that happens.
 */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(Math.trunc(index), length - 1));
}
