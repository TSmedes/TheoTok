import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

import { timing } from './curves';
import { useSettleState, type SettleState } from './SettleContext';
import type { SettleProps } from './types';

/**
 * One element of a card's entrance.
 *
 * Elements arrive in `order`, each `motion.stagger` behind the last, so a card
 * assembles rather than appearing. Everything about the timing lives in the
 * motion tokens; the only thing a caller chooses is where in the sequence it
 * sits.
 *
 * Splitting the static and animated cases into two components rather than
 * branching inside one is what keeps the hook order stable: with no provider
 * above it there is no shared value and no `Animated.View`, which is the
 * property the share-capture path depends on. See `SettleContext`.
 */
export function Settle(props: SettleProps) {
  const state = useSettleState();
  if (!state) return <View style={props.style}>{props.children}</View>;
  return <AnimatedSettle {...props} state={state} />;
}

function AnimatedSettle({
  order,
  variant = 'rise',
  style,
  children,
  state,
}: SettleProps & { state: SettleState }) {
  const progress = useSharedValue(0);
  const reduced = state.motion === 'reduced';
  const active = state.active;
  const duration = reduced ? motion.reduced : motion.settle;
  const delay = reduced ? 0 : order * motion.stagger;

  useEffect(() => {
    // Leaving is not a staggered event: an outgoing card is already sliding off
    // screen, and running its elements out one at a time reads as hesitation.
    progress.set(
      active ? withDelay(delay, withTiming(1, timing(duration))) : withTiming(0, timing(duration)),
    );
  }, [active, delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    if (variant === 'rule') {
      // scaleX, never width: a width animation forces a layout pass every frame.
      return { opacity: p, transform: [{ scaleX: reduced ? 1 : p }] };
    }
    return { opacity: p, transform: [{ translateY: reduced ? 0 : (1 - p) * motion.rise }] };
  });

  return (
    <Animated.View style={[style, variant === 'rule' && RULE_ORIGIN, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/** The rule draws itself outward from the margin, not from its own centre. */
const RULE_ORIGIN = { transformOrigin: 'left center' } as const;
