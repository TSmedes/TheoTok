import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface FeedRenderInfo<T> {
  item: T;
  index: number;
  /** Measured height of one page, so the card can fill it exactly. */
  height: number;
  /**
   * True for the card occupying most of the viewport. Flips at the halfway
   * crossing rather than on settle, so an entrance animation can start with the
   * gesture — see `visualIndex.ts`. Gates animation and autoplay.
   */
  isActive: boolean;
  /**
   * The feed's scroll offset, live on the UI thread, for motion that has to
   * track the gesture rather than follow it.
   *
   * Null on web, which has no Reanimated: there the feed is a scroll-snapping
   * DOM element and its motion is CSS. Consumers are platform-split and the web
   * half never reads this, so the import above is type-only and no Reanimated
   * runtime reaches the web bundle.
   */
  scrollY: SharedValue<number> | null;
}

export interface FeedProps<T> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: FeedRenderInfo<T>) => ReactNode;
  /** Fires when the snapped card changes. */
  onIndexChange?: (index: number) => void;
  /**
   * Drawn behind the list, given the same live scroll offset the pages get.
   *
   * The feed owns the scroll position, so anything that has to paint behind it
   * in response to scrolling can only be reached from in here. Not called on
   * web: there the feed is a scrolling DOM element, and anything rendered
   * inside it would scroll along with the content rather than stay behind it.
   */
  renderBackdrop?: (info: { scrollY: SharedValue<number> | null; height: number }) => ReactNode;
  /**
   * Card to open on. Read once at mount: the tab navigator unmounts the feed,
   * and coming back should land where the reader left off rather than at the
   * top of a fresh shuffle.
   */
  initialIndex?: number;
}
