import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettleContext, type SettleState } from '@/motion/SettleContext';
import { useMotionPreference } from '@/motion/useMotionPreference';

import type { CardSurfaceProps } from './cardSurfaceTypes';

/**
 * Web twin. There is no Layer B here — the depth effect needs a scroll offset
 * read on the UI thread every frame, and this feed is a scroll-snapping DOM
 * element with no Reanimated behind it. The sense of one card being the subject
 * comes from `global.css` dimming the pages either side instead.
 *
 * So all this does is answer whether the card is animating, which is what Layer
 * A needs. Nothing displaces or scales the content.
 */
export function CardSurface({ isActive, children }: CardSurfaceProps) {
  const motion = useMotionPreference();
  const state = useMemo<SettleState>(
    () => ({ active: isActive, motion, drift: null, contentScale: null }),
    [isActive, motion],
  );

  return (
    <SettleContext.Provider value={state}>
      <View style={styles.page}>{children}</View>
    </SettleContext.Provider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});
