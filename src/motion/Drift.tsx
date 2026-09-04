import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useSettleState } from './SettleContext';

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * The card's content, trailing behind the gradient it sits on and receding
 * slightly as the card leaves the centre — the whole of Layer B's depth.
 *
 * It moves the content and never the card. The card is exactly one page tall
 * and one page wide, and anything that shrinks it opens a gap at every edge
 * through which the backdrop shows as a border — which makes the feed read as
 * cards floating on some other surface instead of as one continuous surface.
 * Displacing what is *inside* the card gives the same sense of depth with
 * nothing to see around it.
 *
 * Exactly one of these per card. It is separate from `Settle` because `Settle`
 * nests — the citation block contains the rule, and both are `Settle`s — so an
 * offset applied there would land on the rule twice.
 *
 * With no `SettleContext` above it, the share-capture path, this is a plain
 * `View`, the same guarantee `Settle` gives.
 */
export function Drift({ style, children }: Props) {
  const state = useSettleState();
  if (!state?.drift || !state.contentScale) return <View style={style}>{children}</View>;
  return (
    <DriftAnimated style={style} drift={state.drift} scale={state.contentScale}>
      {children}
    </DriftAnimated>
  );
}

function DriftAnimated({
  style,
  children,
  drift,
  scale,
}: Props & { drift: SharedValue<number>; scale: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.get() }, { scale: scale.get() }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
