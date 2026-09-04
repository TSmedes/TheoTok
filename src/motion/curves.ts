import { Easing, ReduceMotion, type WithTimingConfig } from 'react-native-reanimated';

import { motionEase } from '@/theme/tokens';

/** The app's one curve. See `motionEase.out` for why the tail is this long. */
export const easeOut = Easing.bezier(...motionEase.out);

/**
 * Every `withTiming` in the app goes through here.
 *
 * `ReduceMotion.Never` is deliberate and is not an accessibility oversight.
 * Reduce-motion is resolved one level up, in `useMotionPreference`, which ORs
 * the OS setting with the reader's own choice and hands down a preference the
 * components then honour by dropping the travel and shortening the duration.
 * Letting Reanimated apply the system setting *as well* would compound the two:
 * an animation we intend to degrade to a soft fade would instead snap to its
 * final value, and the reader's Settings toggle would stop being the thing that
 * decides. One place makes the decision.
 */
export function timing(duration: number): WithTimingConfig {
  return { duration, easing: easeOut, reduceMotion: ReduceMotion.Never };
}
