import { Platform } from 'react-native';

import {
  createDailyReminderManager,
  type DailyReminderManager,
  type NotificationClient,
} from './dailyReminderService';
import { loadExpoNotifications } from './expoNotifications';

const Notifications = loadExpoNotifications();

/*
 * Without the native module there is nothing to schedule, so `ensure` hands back
 * the stored queue untouched: a launch under Expo Go must not quietly clear the
 * user's reminders or advance the message rotation. `enable` reports failure,
 * and settings explains why before it ever gets that far.
 */
const unavailableManager: DailyReminderManager = {
  enable: async () => ({ enabled: false, notificationIds: [] }),
  ensure: async ({ notificationIds }) => ({ enabled: true, notificationIds }),
  disable: async () => {},
};

function createClient(notifications: NonNullable<typeof Notifications>): NotificationClient {
  return {
    getPermissionsAsync: notifications.getPermissionsAsync,
    requestPermissionsAsync: notifications.requestPermissionsAsync,
    getAllScheduledNotificationIdsAsync: async () =>
      (await notifications.getAllScheduledNotificationsAsync()).map((notification) => notification.identifier),
    setNotificationChannelAsync: async (id) => {
      await notifications.setNotificationChannelAsync(id, {
        name: 'Daily scripture reminder',
        importance: notifications.AndroidImportance.DEFAULT,
      });
    },
    scheduleNotificationAsync: ({ content, trigger }) =>
      notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger.date,
          channelId: trigger.channelId,
        },
      }),
    cancelScheduledNotificationAsync: notifications.cancelScheduledNotificationAsync,
  };
}

export const dailyReminderManager: DailyReminderManager = Notifications
  ? createDailyReminderManager(createClient(Notifications), Platform.OS === 'android' ? 'android' : 'ios')
  : unavailableManager;
