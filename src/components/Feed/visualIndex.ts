/**
 * Which page the reader is looking at, for the purpose of animation.
 *
 * Kept separate from the settled index the feed reports through
 * `onIndexChange`, and from the component, for the same reason as
 * `windowing.ts`: the interesting property is checkable without a device.
 *
 * The distinction that matters: `onMomentumScrollEnd` answers "which card did
 * the reader land on", which is the right question for stopping speech or
 * recording a card as seen, but it only answers *after* the swipe settles. An
 * entrance animation asked that late would leave the incoming card sitting in
 * its pre-animation state, visible, for the whole of the swipe. So this answers
 * a different question — "which card is mostly on screen right now" — and flips
 * at the halfway crossing, mid-gesture.
 */

/**
 * The page occupying most of the viewport at `offsetY`.
 *
 * Returns 0 for a height of zero: the feed does not render its list until it
 * has measured, so there is no page to be looking at yet, and a division by
 * zero here would poison the index with NaN.
 */
export function visualIndexFor(offsetY: number, pageHeight: number): number {
  if (pageHeight <= 0) return 0;
  return Math.max(0, Math.round(offsetY / pageHeight));
}
