import { createContext, useContext } from 'react';

import type { MotionPreference } from '@/store/preferences';

export interface SettleState {
  /** Whether this card is the one the reader is on. Drives the entrance. */
  active: boolean;
  motion: MotionPreference;
}

/**
 * How a `<Settle>` knows whether to animate.
 *
 * The default is `null`, meaning "render static and fully visible", and that
 * default is load-bearing rather than incidental. `ShareCard` renders a `Card`
 * outside the feed to be photographed by `react-native-view-shot`, which
 * captures the native view hierarchy as it stands — a transform that has been
 * started but not yet committed is captured mid-flight. With no provider above
 * it, every `Settle` in that subtree degrades to a plain `View`, so there is no
 * animated node in the captured tree at all. `Card` also provides `null`
 * explicitly on its share branch, so a stray provider higher up cannot corrupt
 * a capture.
 */
export const SettleContext = createContext<SettleState | null>(null);

export function useSettleState(): SettleState | null {
  return useContext(SettleContext);
}
