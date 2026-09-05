/** Entries either side of the cited one shown before the reader asks for more. */
export const WINDOW = 5;

export interface ContextWindow {
  /** First entry to render, inclusive. */
  from: number;
  /** Last entry to render, exclusive. */
  to: number;
  /** Whether anything is hidden above, and so whether to offer to show it. */
  hasEarlier: boolean;
  hasLater: boolean;
}

/**
 * Which slice of a document to show around the cited entry.
 *
 * A window rather than the whole work because these run long — the Second
 * Helvetic Confession is 278 articles, and someone arriving from a single card
 * did not ask for all of them. Expanding is one tap at either end, and each end
 * expands on its own: reading backwards from an article is a different errand
 * from reading on from it.
 */
export function contextWindow(
  current: number,
  total: number,
  expanded: { before: boolean; after: boolean } = { before: false, after: false },
): ContextWindow {
  // A card whose index is stale (a re-import that moved things) should still
  // show the reader something rather than an empty slice.
  const anchor = Math.min(Math.max(current, 0), Math.max(total - 1, 0));

  const from = expanded.before ? 0 : Math.max(0, anchor - WINDOW);
  const to = expanded.after ? total : Math.min(total, anchor + WINDOW + 1);

  return { from, to, hasEarlier: from > 0, hasLater: to < total };
}
