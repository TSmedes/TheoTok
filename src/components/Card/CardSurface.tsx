import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { centreProgress, rampTo, textDrift } from '@/motion/progress';
import { SettleContext, type SettleState } from '@/motion/SettleContext';
import { useMotionPreference } from '@/motion/useMotionPreference';
import { motion as motionTokens } from '@/theme/tokens';

import type { CardSurfaceProps } from './cardSurfaceTypes';

/**
 * One page of the feed, and the only place that knows the page is moving.
 *
 * Two jobs, which are really one. It answers whether this card is animating, so
 * that `Card` and `ActionRail` can mark which of their parts move without
 * knowing anything about motion (Layer A). And it applies the depth — the card
 * settling to full size as it arrives, its text trailing slightly behind the
 * gradient it sits on (Layer B).
 *
 * Both come off the feed's scroll offset rather than off React state, so they
 * track the gesture at frame rate without a single re-render. The card scale
 * lives here, on the whole page; the text drift is handed to the individual
 * `Settle` elements, since it must move the words and not the gradient beneath
 * them.
 *
 * Mounted only from the feed, never around the off-screen share target — which
 * is what keeps a captured image free of half-finished animations.
 */
export function CardSurface({ isActive, index, height, scrollY, children }: CardSurfaceProps) {
  const motion = useMotionPreference();
  // Reduced motion keeps the fades of Layer A and drops Layer B entirely: the
  // scale and the parallax are the parts that actually move.
  const still = motion === 'reduced' || scrollY === null || height <= 0;

  const drift = useDerivedValue(() => {
    if (still || !scrollY) return 0;
    return textDrift(index, scrollY.get(), height);
  });

  const contentScale = useDerivedValue(() => {
    if (still || !scrollY) return 1;
    return rampTo(centreProgress(index, scrollY.get(), height), motionTokens.restScale);
  });

  const state = useMemo<SettleState>(
    () => ({
      active: isActive,
      motion,
      drift: still ? null : drift,
      contentScale: still ? null : contentScale,
    }),
    [isActive, motion, still, drift, contentScale],
  );

  /**
   * Opacity only. The card must keep filling its page exactly — a scale here
   * would inset it and expose the backdrop as a border around every edge, which
   * is the one thing the backdrop must never look like. The receding happens to
   * the content instead, in `Drift`.
   */
  const depth = useAnimatedStyle(() => {
    if (still || !scrollY) return { opacity: 1 };
    return { opacity: rampTo(centreProgress(index, scrollY.get(), height), motionTokens.restOpacity) };
  });

  return (
    <SettleContext.Provider value={state}>
      <Animated.View style={[styles.page, depth]}>{children}</Animated.View>
    </SettleContext.Provider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
});
