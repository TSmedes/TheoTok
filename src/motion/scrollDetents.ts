/**
 * How many notches are felt crossing one card. A card is exactly one page, so
 * this number is the texture of the whole feed: ten is fine enough to read as a
 * picker wheel under a slow thumb, and coarse enough that a fling thins out into
 * a burst rather than a single continuous buzz.
 */
export const DETENTS_PER_PAGE = 10;

/**
 * Which detent a scroll offset has reached.
 *
 * The haptic fires whenever this answer changes, which is why it is expressed as
 * a position rather than as a rate: the gaps between ticks are the gaps the
 * reader's own gesture leaves, so slow dragging feels notched and fast dragging
 * feels like a burst without either being special-cased.
 */
export function detentAt(offsetY: number, pageHeight: number): number {
  if (pageHeight <= 0) return 0;
  // The half-detent offset puts each page boundary exactly halfway between two
  // notches rather than on one. Without it every landing would fire a Light tick
  // a frame or two before the Soft one, and the two would smear together into a
  // single indistinct buzz instead of the card audibly seating.
  return Math.floor((offsetY / pageHeight) * DETENTS_PER_PAGE + 0.5);
}
