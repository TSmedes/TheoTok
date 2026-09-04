import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface CardSurfaceProps {
  /** True for the card occupying most of the viewport — see `visualIndex.ts`. */
  isActive: boolean;
  /** Position in the feed, which with `height` locates the card against `scrollY`. */
  index: number;
  /** Measured height of one page. */
  height: number;
  /** The feed's live scroll offset, or null on web. See `FeedRenderInfo`. */
  scrollY: SharedValue<number> | null;
  children: ReactNode;
}
