import type { SharedValue } from 'react-native-reanimated';

export interface GradientBackdropProps {
  /**
   * One index into `CONTENT_TYPES` per card, in feed order.
   *
   * A shared value rather than a plain array: the worklet below reads it every
   * frame, and closing over a JS array copies the whole list into the UI runtime
   * whenever the closure is rebuilt.
   */
  types: SharedValue<number[]>;
  /** How many cards `types` holds, for the guard that runs on the JS thread. */
  count: number;
  scrollY: SharedValue<number> | null;
  /** Measured height of one page. */
  height: number;
}
