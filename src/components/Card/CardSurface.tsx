import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettleContext, type SettleState } from '@/motion/SettleContext';
import { useMotionPreference } from '@/motion/useMotionPreference';

interface Props {
  /** True for the card occupying most of the viewport — see `visualIndex.ts`. */
  isActive: boolean;
  children: ReactNode;
}

/**
 * Everything on one page of the feed, and the one place that decides whether
 * that page is animating.
 *
 * It exists so that `Card` and `ActionRail` stay unaware of motion: they mark
 * *which* of their parts move and in what order, and this answers whether any
 * of it should happen at all. Crucially it is mounted only from the feed, never
 * around the off-screen share target, which is what keeps a captured image free
 * of half-finished animations.
 */
export function CardSurface({ isActive, children }: Props) {
  const motion = useMotionPreference();
  const state = useMemo<SettleState>(() => ({ active: isActive, motion }), [isActive, motion]);

  return (
    <SettleContext.Provider value={state}>
      <View style={styles.page}>{children}</View>
    </SettleContext.Provider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});
