import {
  createDailyReminderManager,
  type NotificationClient,
  type ScheduledNotification,
} from '../dailyReminderService';
import { DAILY_REMINDER_MESSAGES } from '../dailyReminder';

function createNotificationClient(permission = 'granted', existingIds: string[] = []) {
  const scheduled: ScheduledNotification[] = [];
  const channels: string[] = [];
  const cancelled: string[] = [];

  const client: NotificationClient = {
    getPermissionsAsync: async () => ({ status: permission }),
    requestPermissionsAsync: async () => ({ status: permission }),
    getAllScheduledNotificationIdsAsync: async () => existingIds,
    setNotificationChannelAsync: async (id) => {
      channels.push(id);
    },
    scheduleNotificationAsync: async (request) => {
      scheduled.push(request);
      return `reminder-${scheduled.length}`;
    },
    cancelScheduledNotificationAsync: async (id) => {
      cancelled.push(id);
    },
  };

  return { client, scheduled, channels, cancelled };
}

describe('daily reminder manager', () => {
  it('schedules a rotating 8 AM queue after permission is granted', async () => {
    const fake = createNotificationClient();
    const manager = createDailyReminderManager(fake.client, 'android');

    const result = await manager.enable({
      now: new Date('2026-09-03T07:30:00'),
      messageCursor: 0,
      days: 2,
    });

    expect(result).toEqual({ enabled: true, notificationIds: ['reminder-1', 'reminder-2'] });
    expect(fake.channels).toEqual(['daily-reminder']);
    expect(fake.scheduled).toEqual([
      {
        content: { title: 'TheoTok', body: DAILY_REMINDER_MESSAGES[0] },
        trigger: { type: 'date', date: new Date('2026-09-03T08:00:00'), channelId: 'daily-reminder' },
      },
      {
        content: { title: 'TheoTok', body: DAILY_REMINDER_MESSAGES[1] },
        trigger: { type: 'date', date: new Date('2026-09-04T08:00:00'), channelId: 'daily-reminder' },
      },
    ]);
  });

  it('does not schedule reminders when notification permission is denied', async () => {
    const fake = createNotificationClient('denied');
    const manager = createDailyReminderManager(fake.client, 'ios');

    const result = await manager.enable({
      now: new Date('2026-09-03T07:30:00'),
      messageCursor: 0,
      days: 2,
    });

    expect(result).toEqual({ enabled: false, notificationIds: [] });
    expect(fake.scheduled).toEqual([]);
  });

  it('cancels every queued notification when reminders are disabled', async () => {
    const fake = createNotificationClient();
    const manager = createDailyReminderManager(fake.client, 'ios');

    await manager.disable(['reminder-1', 'reminder-2']);

    expect(fake.cancelled).toEqual(['reminder-1', 'reminder-2']);
  });

  it('keeps the existing queue when at least a week of reminders remains', async () => {
    const existingIds = Array.from({ length: 7 }, (_, index) => `reminder-${index + 1}`);
    const fake = createNotificationClient('granted', existingIds);
    const manager = createDailyReminderManager(fake.client, 'ios');

    const result = await manager.ensure({
      now: new Date('2026-09-03T07:30:00'),
      messageCursor: 8,
      notificationIds: existingIds,
      days: 28,
    });

    expect(result).toEqual({ enabled: true, notificationIds: existingIds });
    expect(fake.scheduled).toEqual([]);
  });
});
