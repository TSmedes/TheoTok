import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface SettleProps {
  /**
   * Position in the card's entrance sequence. The delay is `order ×
   * motion.stagger`, so the numbers are a running order rather than a duration:
   * 0 cue, 1 body, 2 citation, 3 the rule beneath it, 4+ the action rail.
   */
  order: number;
  /**
   * 'rise' fades and lifts, which is right for text. 'rule' wipes outward from
   * the left, which is right for the single gold line above a citation.
   */
  variant?: 'rise' | 'rule';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
