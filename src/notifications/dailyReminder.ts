export const DAILY_REMINDER_MESSAGES = [
  'Begin the day filled with the Spirit—open Scripture and dwell with God.',
  'Make room for God’s Word this morning; let it steady your heart.',
  'A few quiet minutes in Scripture can shape your whole day.',
  'Come to the Word with an open heart—there is grace for today.',
  'Let truth take root today. Check in with Scripture and theology.',
  'Start with what is lasting: open Scripture and be renewed.',
] as const;

export interface DailyReminder {
  dayOffset: number;
  hour: 8;
  minute: 0;
  body: string;
}

export function buildDailyReminderSchedule(count: number, messageCursor: number): DailyReminder[] {
  return Array.from({ length: count }, (_, index) => ({
    dayOffset: index + 1,
    hour: 8,
    minute: 0,
    body: DAILY_REMINDER_MESSAGES[(messageCursor + index) % DAILY_REMINDER_MESSAGES.length],
  }));
}

export function nextDailyReminderMessageIndex(messageCursor: number): number {
  return messageCursor + 1;
}
