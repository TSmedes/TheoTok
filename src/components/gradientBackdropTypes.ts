import type { SharedValue } from 'react-native-reanimated';

export interface GradientBackdropProps {
  /** One index into `CONTENT_TYPES` per card, in feed order. */
  types: readonly number[];
  scrollY: SharedValue<number> | null;
  /** Measured height of one page. */
  height: number;
}
