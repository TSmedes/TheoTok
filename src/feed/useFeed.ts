import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { CARDS, renderedFor } from '@/content/library';
import type { Card, RenderedCard } from '@/content/types';
import { useFeedSession, currentIndex } from '@/store/feedSession';
import { usePreferences } from '@/store/preferences';
import { seenSnapshot, useSeen } from '@/store/seen';

import { buildPool, buildSequence } from './buildPool';
import { clearSequence, extendSequence, poolKeyFor, sequenceFor } from './sequence';
import { randomSeed } from './shuffle';

/** How close to the end we get before another pass is appended. */
const PREFETCH_MARGIN = 2;

export interface FeedPage {
  card: Card;
  rendered: RenderedCard;
  /** Marks the seam where the pool was used up and started over. */
  startsNewCycle: boolean;
}

export interface Feed {
  pages: FeedPage[];
  /** Cards matching the current filters, before the seen window is applied. */
  poolSize: number;
  /** Where to open the feed — the card the reader last had in view. */
  initialIndex: number;
  onIndexChange: (index: number) => void;
  reshuffle: () => void;
}

const CARDS_BY_ID = new Map(CARDS.map((card) => [card.id, card]));

export function useFeed(): Feed {
  const selectedTraditions = usePreferences((s) => s.traditions);
  const selectedTypes = usePreferences((s) => s.types);
  const markSeen = useSeen((s) => s.markSeen);
  const setIndex = useFeedSession((s) => s.setIndex);

  /**
   * Rebuilding the running order is the expensive half of a filter change, and
   * it is not what the reader is looking at when they make one — they are on the
   * Options screen, watching a chip. Deferring these lets the chip paint on the
   * press frame and the feed catch up in a low-priority render behind it.
   *
   * The tab navigator keeps this screen mounted, so without it the whole rebuild
   * lands inside the press and the chip cannot even draw its own pressed state.
   */
  const traditions = useDeferredValue(selectedTraditions);
  const types = useDeferredValue(selectedTypes);

  // Bumped when a pass is appended, to recompute the pages.
  const [revision, setRevision] = useState(0);

  const poolKey = useMemo(() => poolKeyFor(traditions, types), [traditions, types]);
  const pool = useMemo(() => buildPool(CARDS, { traditions, types }), [traditions, types]);

  /**
   * The seen window is read as a snapshot rather than subscribed to. Marking a
   * card seen while scrolling would otherwise change this input and reshuffle
   * the sequence under the reader's thumb.
   */
  const sequence = sequenceFor(poolKey, () => {
    const built = buildSequence(pool, seenSnapshot(), randomSeed());
    return { order: built.sequence.map((c) => c.id), recycled: built.recycled };
  });

  /**
   * `rendered` is a getter rather than a value: the pool can run to thousands of
   * cards and the reader sees perhaps ten of them, so rendering the lot up front
   * is work thrown away. The list asks for one as it draws each row, and
   * `renderedFor` caches, so scrolling back costs nothing.
   */
  const pages = useMemo(() => {
    const cycleStarts = new Set(sequence.cycleStarts);
    return sequence.order.flatMap((id, i) => {
      const card = CARDS_BY_ID.get(id);
      if (!card) return [];
      return [
        {
          card,
          startsNewCycle: cycleStarts.has(i),
          get rendered() {
            return renderedFor(card);
          },
        },
      ];
    });
    // `revision` is the signal that the order was extended in place.
  }, [sequence, sequence.order.length, revision]);

  // A change of filters invalidates the old position, but the very first render
  // must keep it — that is the whole point of remembering it across tabs.
  const knownPoolKey = useRef(poolKey);
  useEffect(() => {
    if (knownPoolKey.current === poolKey) return;
    knownPoolKey.current = poolKey;
    useFeedSession.getState().restart();
  }, [poolKey]);

  const initialIndex = useRef(Math.min(currentIndex(), Math.max(0, pages.length - 1))).current;

  const extendingRef = useRef(false);

  const onIndexChange = useCallback(
    (index: number) => {
      setIndex(index);

      const page = pages[index];
      if (page) markSeen(page.card.id);

      // Near the end, append another pass so the scroll never dead-ends. By now
      // most of the pool is in the seen window, so this normally recycles.
      if (pool.length > 0 && index >= pages.length - 1 - PREFETCH_MARGIN && !extendingRef.current) {
        extendingRef.current = true;
        const built = buildSequence(pool, seenSnapshot(), randomSeed());
        extendSequence({ order: built.sequence.map((c) => c.id), recycled: built.recycled });
        setRevision((r) => r + 1);
        extendingRef.current = false;
      }
    },
    [markSeen, pages, pool, setIndex],
  );

  const reshuffle = useCallback(() => {
    clearSequence();
    useFeedSession.getState().restart();
    setRevision((r) => r + 1);
  }, []);

  return { pages, poolSize: pool.length, initialIndex, onIndexChange, reshuffle };
}
