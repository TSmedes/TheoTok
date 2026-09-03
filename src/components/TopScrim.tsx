import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

/**
 * A fade behind the status bar for full-bleed scrolling screens.
 *
 * These screens deliberately scroll under the status bar rather than sitting
 * below an opaque header, which keeps the layout uncluttered — but without this
 * the content collides with the clock and battery icons as it passes beneath
 * them. The gradient gives the system text something to sit against without
 * introducing a hard edge.
 */
export function TopScrim() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.void, colors.void, 'rgba(5, 5, 9, 0)']}
      locations={[0, 0.55, 1]}
      style={[styles.scrim, { height: insets.top + spacing.lg }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
