import { buildDailyReminderSchedule } from './dailyReminder';

export interface ScheduledNotification {
  content: { title: string; body: string };
  trigger: { type: 'date'; date: Date; channelId?: string };
}

export interface NotificationClient {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getAllScheduledNotificationIdsAsync: () => Promise<string[]>;
  setNotificationChannelAsync: (id: string) => Promise<void>;
  scheduleNotificationAsync: (request: ScheduledNotification) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
}

export interface EnableDailyRemindersOptions {
  now: Date;
  messageCursor: number;
  days: number;
}

export interface DailyReminderManager {
  enable: (options: EnableDailyRemindersOptions) => Promise<{
    enabled: boolean;
    notificationIds: string[];
  }>;
  ensure: (
    options: EnableDailyRemindersOptions & { notificationIds: string[] },
  ) => Promise<{ enabled: boolean; notificationIds: string[] }>;
  disable: (notificationIds: string[]) => Promise<void>;
}

const CHANNEL_ID = 'daily-reminder';

function nextEightAm(now: Date): Date {
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

export function createDailyReminderManager(
  client: NotificationClient,
  platform: 'android' | 'ios',
): DailyReminderManager {
  return {
    async enable({ now, messageCursor, days }) {
      if (platform === 'android') await client.setNotificationChannelAsync(CHANNEL_ID);

      let { status } = await client.getPermissionsAsync();
      if (status !== 'granted') ({ status } = await client.requestPermissionsAsync());
      if (status !== 'granted') return { enabled: false, notificationIds: [] };

      const firstReminder = nextEightAm(now);
      const notificationIds = await Promise.all(
        buildDailyReminderSchedule(days, messageCursor).map(({ dayOffset, body }) => {
          const date = new Date(firstReminder);
          date.setDate(date.getDate() + dayOffset - 1);
          return client.scheduleNotificationAsync({
            content: { title: 'TheoTok', body },
            trigger: {
              type: 'date',
              date,
              ...(platform === 'android' ? { channelId: CHANNEL_ID } : {}),
            },
          });
        }),
      );

      return { enabled: true, notificationIds };
    },
    async disable(notificationIds) {
      await Promise.all(notificationIds.map((id) => client.cancelScheduledNotificationAsync(id)));
    },
    async ensure({ notificationIds, ...options }) {
      const scheduledIds = new Set(await client.getAllScheduledNotificationIdsAsync());
      const remainingIds = notificationIds.filter((id) => scheduledIds.has(id));

      // Keep the queue intact until it is nearly exhausted. This avoids both
      // duplicate alerts and resetting the message rotation every app launch.
      if (remainingIds.length >= 7) return { enabled: true, notificationIds: remainingIds };

      await Promise.all(remainingIds.map((id) => client.cancelScheduledNotificationAsync(id)));
      return this.enable(options);
    },
  };
}
