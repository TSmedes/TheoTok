import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

/**
 * The tab bar floats over the feed rather than shrinking it, so a card stays
 * exactly one viewport tall and the gradient runs edge to edge. Cards reserve
 * bottom padding for it, so nothing is ever hidden underneath.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.void },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.bar,
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
          title: 'Filters',
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
  },
});
