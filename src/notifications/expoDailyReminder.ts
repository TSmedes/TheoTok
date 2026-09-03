import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { createDailyReminderManager } from './dailyReminderService';

export const dailyReminderManager = createDailyReminderManager(
  {
    getPermissionsAsync: Notifications.getPermissionsAsync,
    requestPermissionsAsync: Notifications.requestPermissionsAsync,
    getAllScheduledNotificationIdsAsync: async () =>
      (await Notifications.getAllScheduledNotificationsAsync()).map((notification) => notification.identifier),
    setNotificationChannelAsync: async (id) => {
      await Notifications.setNotificationChannelAsync(id, {
        name: 'Daily scripture reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    },
    scheduleNotificationAsync: ({ content, trigger }) =>
      Notifications.scheduleNotificationAsync(
        trigger === null
          ? { content, trigger: null }
          : {
              content,
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: trigger.date,
                channelId: trigger.channelId,
              },
            },
      ),
    cancelScheduledNotificationAsync: Notifications.cancelScheduledNotificationAsync,
  },
  Platform.OS === 'android' ? 'android' : 'ios',
);
