/**
 * The feed's running order, held outside React.
 *
 * It has to live here rather than in component state because the tab navigator
 * unmounts the feed when you visit Saved or Filters. Rebuilding on the way back
 * drew a fresh seed *and* a larger seen-set, so the reader returned to a
 * completely different sequence — the card they were reading simply gone.
 *
 * Memoised by pool key, so changing a filter builds a new order and anything
 * else reuses the existing one.
 */

export interface Sequence {
  poolKey: string;
  /** Card ids, in the order the feed will show them. */
  order: string[];
  /** Indices where the pool was exhausted and started over, for the divider. */
  cycleStarts: number[];
}

export interface BuildResult {
  order: string[];
  recycled: boolean;
}

let current: Sequence | null = null;

/**
 * The order for this pool, building it only if the pool has changed.
 *
 * Safe to call during render: it is a pure memo over module state and never
 * notifies React, so it cannot cause a render-phase update.
 */
export function sequenceFor(poolKey: string, build: () => BuildResult): Sequence {
  if (!current || current.poolKey !== poolKey) {
    const built = build();
    current = {
      poolKey,
      order: built.order,
      cycleStarts: built.recycled ? [0] : [],
    };
  }
  return current;
}

/** Adds another pass onto the end, so scrolling never dead-ends. */
export function extendSequence(built: BuildResult): Sequence | null {
  if (!current) return null;
  const start = current.order.length;
  current = {
    poolKey: current.poolKey,
    order: [...current.order, ...built.order],
    cycleStarts: built.recycled ? [...current.cycleStarts, start] : current.cycleStarts,
  };
  return current;
}

/** Drops the memo so the next call rebuilds. Used by an explicit reshuffle. */
export function clearSequence(): void {
  current = null;
}

/** Stable key for a set of filters; order-independent so re-selecting is a no-op. */
export function poolKeyFor(traditions: readonly string[], types: readonly string[]): string {
  return JSON.stringify([[...traditions].sort(), [...types].sort()]);
}
