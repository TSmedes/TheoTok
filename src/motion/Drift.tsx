import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useSettleState } from './SettleContext';

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * The card's text, trailing slightly behind the gradient it sits on — the whole
 * of Layer B's parallax.
 *
 * Exactly one of these per card, wrapping the content container. It is separate
 * from `Settle` because `Settle` nests: the citation block contains the rule,
 * and both are `Settle`s, so an offset applied there would be applied twice to
 * the rule. This wraps everything once, above all of them, and `Settle` handles
 * only the entrance.
 *
 * With no `SettleContext` above it — the share-capture path — this is a plain
 * `View`, the same guarantee `Settle` gives.
 */
export function Drift({ style, children }: Props) {
  const state = useSettleState();
  if (!state?.drift) return <View style={style}>{children}</View>;
  return (
    <DriftAnimated style={style} drift={state.drift}>
      {children}
    </DriftAnimated>
  );
}

function DriftAnimated({
  style,
  children,
  drift,
}: Props & { drift: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.get() }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
