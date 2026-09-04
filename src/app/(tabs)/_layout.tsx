import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme/tokens';

/**
 * What one tab actually needs when the label sits under the icon: 5pt of the
 * item's own padding, the 28pt icon box, the label's line, and 5pt below.
 *
 * React Navigation's bar is 49pt tall plus the bottom safe-area inset, and on a
 * phone that inset is deep enough to swallow the two or three points this comes
 * out over. The web has no inset, so the label was landing just past the bottom
 * edge of a bar already pinned to the bottom of the window — hence a tab bar
 * that looked cropped, but only below 768px, where the label drops beneath the
 * icon instead of sitting beside it.
 */
const LABEL_LINE_HEIGHT = 14;
const WEB_TAB_BAR_HEIGHT = 5 + 28 + LABEL_LINE_HEIGHT + 5;

/**
 * The tab bar floats over the feed rather than shrinking it, so a card stays
 * exactly one viewport tall and the gradient runs edge to edge. Cards reserve
 * bottom padding for it, so nothing is ever hidden underneath.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.void },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: [
          styles.bar,
          // A number here replaces the library's own height calculation, so it
          // has to carry the inset itself. Zero in every desktop browser, but a
          // phone browser with `viewport-fit=cover` reports the home indicator.
          Platform.OS === 'web' ? { height: WEB_TAB_BAR_HEIGHT + insets.bottom } : null,
        ],
        tabBarBackground: () => <View style={styles.barBackground} />,
        tabBarLabelStyle: styles.label,
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Options',
          tabBarIcon: ({ color, size }) => <Ionicons name="options-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    backgroundColor: '#000000',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
    elevation: 0,
  },
  barBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 11,
    letterSpacing: 0.3,
    // Stated rather than left to the font, because `WEB_TAB_BAR_HEIGHT` is
    // measured off it and a browser's idea of `normal` differs from the
    // platforms'.
    lineHeight: LABEL_LINE_HEIGHT,
  },
});
