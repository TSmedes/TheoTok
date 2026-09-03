import { useEffect, useState } from 'react';

import { usePreferences } from './preferences';
import { useSaved } from './saved';
import { useSeen } from './seen';

/**
 * Every store that reads from AsyncStorage. Rehydration is asynchronous, so on
 * a cold start each of these briefly reports its *initial* state rather than
 * the reader's. That is not a cosmetic flicker:
 *
 *  - `onboarded` starts false, so index.tsx would redirect a returning reader
 *    straight back into onboarding before their real answer arrived.
 *  - `useFeed` builds and caches the card order from a snapshot of `seen` and
 *    the tradition filters. Built a frame too early it uses an empty seen
 *    window and the default filters, and that order is kept for the session.
 *
 * So the app waits, behind the native splash screen, until all three are in.
 */
interface PersistedStore {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
}

const STORES: PersistedStore[] = [usePreferences, useSaved, useSeen];

const allHydrated = () => STORES.every((store) => store.persist.hasHydrated());

/**
 * Storage failing should degrade to defaults, not to an app stuck on its splash
 * screen forever, so hydration is given a deadline.
 */
const HYDRATION_TIMEOUT_MS = 3000;

export function useStoresHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allHydrated);

  useEffect(() => {
    if (hydrated) return;

    const settle = () => {
      if (allHydrated()) setHydrated(true);
    };

    const unsubscribers = STORES.map((store) => store.persist.onFinishHydration(settle));
    const timer = setTimeout(() => setHydrated(true), HYDRATION_TIMEOUT_MS);

    // A store may have finished between the initial render and this effect.
    settle();

    return () => {
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [hydrated]);

  return hydrated;
}
