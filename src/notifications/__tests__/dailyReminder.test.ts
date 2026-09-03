import {
  buildDailyReminderSchedule,
  DAILY_REMINDER_MESSAGES,
  nextDailyReminderMessageIndex,
} from '../dailyReminder';

describe('buildDailyReminderSchedule', () => {
  it('creates one 8 AM reminder per day with messages rotating in order', () => {
    expect(buildDailyReminderSchedule(4, 3)).toEqual([
      { dayOffset: 1, hour: 8, minute: 0, body: DAILY_REMINDER_MESSAGES[3] },
      { dayOffset: 2, hour: 8, minute: 0, body: DAILY_REMINDER_MESSAGES[4] },
      { dayOffset: 3, hour: 8, minute: 0, body: DAILY_REMINDER_MESSAGES[5] },
      { dayOffset: 4, hour: 8, minute: 0, body: DAILY_REMINDER_MESSAGES[0] },
    ]);
  });

  it('wraps an out-of-range message cursor back through the rotation', () => {
    expect(buildDailyReminderSchedule(2, 9).map((reminder) => reminder.body)).toEqual([
      DAILY_REMINDER_MESSAGES[3],
      DAILY_REMINDER_MESSAGES[4],
    ]);
  });
});

describe('nextDailyReminderMessageIndex', () => {
  it('advances a persisted cursor so consecutive test notifications use different messages', () => {
    expect(nextDailyReminderMessageIndex(28)).toBe(29);
  });
});
