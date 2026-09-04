import { useReducedMotion } from 'react-native-reanimated';

import { usePreferences, type MotionPreference } from '@/store/preferences';

/**
 * How much the feed may move, combining the reader's choice with the OS
 * accessibility setting.
 *
 * The OS can only ever tighten. Someone who has asked their phone to remove
 * animations should not have to ask again here, but someone who has chosen
 * 'reduced' in Settings keeps it whatever the OS says.
 */
export function useMotionPreference(): MotionPreference {
  const chosen = usePreferences((s) => s.motion);
  const systemReduced = useReducedMotion();
  return chosen === 'reduced' || systemReduced ? 'reduced' : 'full';
}
