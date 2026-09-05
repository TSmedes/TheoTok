import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { CONTENT_TYPES } from '@/content/types';
import { blendWeights } from '@/motion/progress';
import { useMotionPreference } from '@/motion/useMotionPreference';
import { gradientEnd, gradientLocations, gradients, gradientStart } from '@/theme/tokens';

import type { GradientBackdropProps } from './gradientBackdropTypes';

/**
 * The colour behind the feed, blended across the cards either side of the
 * reader.
 *
 * Each card paints its own opaque gradient, so on its own this would never be
 * seen — it is visible only through Layer B, which fades a card as it leaves
 * the centre. That is not two effects stacked but one: without the backdrop,
 * fading a card reveals the near-black void beneath and the swipe reads as a
 * dip to black; with it, the same fade reveals the next card's colour arriving.
 *
 * All three gradients stay mounted for the life of the feed and only their
 * opacities move. `expo-linear-gradient` takes its colours as a prop, not as an
 * animatable style, so there is no interpolating between them — and remounting
 * a gradient mid-fling would be the one thing guaranteed to drop frames.
 */
export function GradientBackdrop({ types, scrollY, height }: GradientBackdropProps) {
  const motion = useMotionPreference();

  // With reduced motion there is no Layer B, so every card is fully opaque and
  // nothing of this could ever show through. Don't pay for it.
  if (motion === 'reduced' || scrollY === null || height <= 0 || types.length === 0) return null;

  return <Backdrop types={types} scrollY={scrollY} height={height} />;
}

function Backdrop({ types, scrollY, height }: GradientBackdropProps & { scrollY: SharedValue<number> }) {
  const weights = useDerivedValue(() => blendWeights(scrollY.get(), height, types));

  return (
    <>
      {CONTENT_TYPES.map((type, index) => (
        <BackdropLayer key={type} type={type} index={index} weights={weights} />
      ))}
    </>
  );
}

function BackdropLayer({
  type,
  index,
  weights,
}: {
  type: (typeof CONTENT_TYPES)[number];
  index: number;
  weights: SharedValue<[number, number, number]>;
}) {
  const style = useAnimatedStyle(() => ({ opacity: weights.get()[index] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient
        colors={gradients[type]}
        start={gradientStart}
        end={gradientEnd}
        locations={gradientLocations}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
