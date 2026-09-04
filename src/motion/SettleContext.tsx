import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { MotionPreference } from '@/store/preferences';

export interface SettleState {
  /** Whether this card is the one the reader is on. Drives the entrance. */
  active: boolean;
  motion: MotionPreference;
  /**
   * How far the card's content is displaced within its own card, in pixels, and
   * how far it has receded, live on the UI thread.
   *
   * Both are read by exactly one `<Drift>` per card — never by `<Settle>`, which
   * nests, and would compound them once per level. They apply to the content
   * rather than to the card because the card has to keep filling its page
   * exactly: anything that insets it exposes the backdrop around its edges, and
   * the feed reads as cards floating on another surface rather than as one
   * surface.
   *
   * Null where there is no scroll-linked motion: on web, and under reduced
   * motion.
   */
  drift: SharedValue<number> | null;
  contentScale: SharedValue<number> | null;
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
