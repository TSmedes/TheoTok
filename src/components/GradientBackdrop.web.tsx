import type { GradientBackdropProps } from './gradientBackdropTypes';

/**
 * Nothing on web. The backdrop is only ever seen through Layer B fading a card
 * as it leaves the centre, and there is no Layer B here — so a backdrop would
 * sit behind opaque cards, costing three full-screen gradients to be invisible.
 */
export function GradientBackdrop(_props: GradientBackdropProps) {
  return null;
}
