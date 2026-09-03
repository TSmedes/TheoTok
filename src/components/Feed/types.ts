import type { ReactNode } from 'react';

export interface FeedRenderInfo<T> {
  item: T;
  index: number;
  /** Measured height of one page, so the card can fill it exactly. */
  height: number;
  /** True only for the card currently snapped into view. Gates speech, animation, autoplay. */
  isActive: boolean;
}

export interface FeedProps<T> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: FeedRenderInfo<T>) => ReactNode;
  /** Fires when the snapped card changes. */
  onIndexChange?: (index: number) => void;
  /**
   * Card to open on. Read once at mount: the tab navigator unmounts the feed,
   * and coming back should land where the reader left off rather than at the
   * top of a fresh shuffle.
   */
  initialIndex?: number;
}
