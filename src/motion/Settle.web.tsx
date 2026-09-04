import { View, type ViewProps } from 'react-native';

import { useSettleState } from './SettleContext';
import type { SettleProps } from './types';

/**
 * Web twin of `Settle`. Same contract, different engine: the animation is a CSS
 * keyframe in `global.css` rather than a shared value, triggered by the
 * `is-active` class the feed puts on the page around it.
 *
 * That inversion is the reason this is worth a separate file. On web the card
 * is a subtree of React Native Web views whose class names are hashed and
 * unstable, so a stylesheet cannot select the elements it needs to animate.
 * `dataSet` is the supported escape hatch — RNW maps it to `data-*` attributes —
 * and `[data-settle="2"]` is a selector that will still mean the same thing
 * after the next RNW release.
 */
export function Settle({ order, variant = 'rise', style, children }: SettleProps) {
  const state = useSettleState();

  // No provider means the share path, or a card rendered outside the feed:
  // render exactly what a finished entrance leaves behind, with no attributes
  // for the stylesheet to catch.
  if (!state) return <View style={style}>{children}</View>;

  // `dataSet` is React Native Web's own prop and is absent from React Native's
  // `ViewProps`, which is what these types resolve to.
  const data = {
    dataSet: { settle: String(order), settleVariant: variant },
  } as unknown as ViewProps;

  return (
    <View {...data} style={style}>
      {children}
    </View>
  );
}
