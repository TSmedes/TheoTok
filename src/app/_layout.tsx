import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStoresHydrated } from '@/store/hydration';
import { dailyReminderManager } from '@/notifications/expoDailyReminder';
import { usePreferences } from '@/store/preferences';
import { colors } from '@/theme/tokens';

/*
 * Held at module scope, before React mounts, so there is no window in which the
 * splash could auto-hide onto an empty frame. The rejection is swallowed: it
 * only means the splash was already gone, which is not worth crashing over.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const hydrated = useStoresHydrated();
  const dailyReminderEnabled = usePreferences((s) => s.dailyReminderEnabled);
  const dailyReminderNotificationIds = usePreferences((s) => s.dailyReminderNotificationIds);
  const nextDailyReminderMessageIndex = usePreferences((s) => s.nextDailyReminderMessageIndex);
  const setDailyReminders = usePreferences((s) => s.setDailyReminders);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !dailyReminderEnabled) return;

    void dailyReminderManager
      .ensure({
        now: new Date(),
        messageCursor: nextDailyReminderMessageIndex,
        notificationIds: dailyReminderNotificationIds,
        days: 28,
      })
      .then((result) => {
        setDailyReminders({
          enabled: result.enabled,
          notificationIds: result.notificationIds,
          nextMessageIndex:
            result.enabled && result.notificationIds.length !== dailyReminderNotificationIds.length
              ? nextDailyReminderMessageIndex + result.notificationIds.length
              : nextDailyReminderMessageIndex,
        });
      })
      .catch(() => {
        // A reminder failure should never prevent the app itself from opening.
      });
    // This check is intentionally limited to app startup. Changes from Settings
    // are applied immediately by that screen and do not need another refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // The native splash is still up, so this renders as the splash, not a blank.
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.void },
          }}>
          {/*
            `index` must be declared first. React Navigation treats the first
            screen in a navigator as its initial route, so listing "(tabs)"
            ahead of it made the app open straight on the feed and the
            onboarding gate in index.tsx never rendered at all.
          */}
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="reader"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
