import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Web has no Layer B — the parallax needs a scroll offset read on the UI thread
 * every frame, and this feed is a scroll-snapping DOM element. So this is the
 * plain container it stands in for, kept as a separate file only so `Card` can
 * be written once.
 */
export function Drift({ style, children }: Props) {
  return <View style={style}>{children}</View>;
}
