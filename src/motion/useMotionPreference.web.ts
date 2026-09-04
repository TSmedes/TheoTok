import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { usePreferences, type MotionPreference } from '@/store/preferences';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/**
 * Web twin of the native hook. Two differences.
 *
 * The OS signal is the `prefers-reduced-motion` media query rather than
 * Reanimated. `expo export` prerenders these screens with no `window`, so the
 * server snapshot has to answer 'not reduced' rather than touch `matchMedia`.
 *
 * And because Layer A is delivered by CSS here rather than by JS, the resolved
 * answer has to reach the stylesheet: it is written to `data-motion` on the
 * root element, which `global.css` keys off alongside the media query. The
 * write is idempotent, so several components calling this hook is harmless.
 */
export function useMotionPreference(): MotionPreference {
  const chosen = usePreferences((s) => s.motion);
  const systemReduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    useCallback(() => false, []),
  );
  const resolved: MotionPreference = chosen === 'reduced' || systemReduced ? 'reduced' : 'full';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.motion = resolved;
  }, [resolved]);

  return resolved;
}
