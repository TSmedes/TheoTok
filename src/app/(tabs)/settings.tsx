import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { TopScrim } from '@/components/TopScrim';
import { CARDS } from '@/content/library';
import { CONTENT_TYPES, TRADITION_LABELS, type ContentType } from '@/content/types';
import { SELECTABLE_TRADITIONS, buildPool } from '@/feed/buildPool';
import { usePreferences } from '@/store/preferences';
import { dailyReminderManager } from '@/notifications/expoDailyReminder';
import { nextDailyReminderMessageIndex as advanceDailyReminderMessageIndex } from '@/notifications/dailyReminder';
import { useSaved } from '@/store/saved';
import { useSeen } from '@/store/seen';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

const TYPE_LABELS: Record<ContentType, string> = {
  scripture: 'Scripture',
  history: 'Church History',
  doctrine: 'Doctrine',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { traditions, types, toggleTradition, toggleType, restartOnboarding } = usePreferences();
  const revealAnswers = usePreferences((s) => s.revealAnswers);
  const setRevealAnswers = usePreferences((s) => s.setRevealAnswers);
  const dailyReminderEnabled = usePreferences((s) => s.dailyReminderEnabled);
  const dailyReminderNotificationIds = usePreferences((s) => s.dailyReminderNotificationIds);
  const nextDailyReminderMessageIndex = usePreferences((s) => s.nextDailyReminderMessageIndex);
  const setDailyReminders = usePreferences((s) => s.setDailyReminders);
  const clearSeen = useSeen((s) => s.clear);
  const seenCount = useSeen((s) => s.ids.length);
  const clearSaved = useSaved((s) => s.clear);
  const savedCount = useSaved((s) => s.ids.length);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [testNotificationBusy, setTestNotificationBusy] = useState(false);

  const poolSize = buildPool(CARDS, { traditions, types }).length;

  const toggleDailyReminder = async () => {
    if (reminderBusy) return;
    setReminderBusy(true);

    try {
      if (dailyReminderEnabled) {
        await dailyReminderManager.disable(dailyReminderNotificationIds);
        setDailyReminders({
          enabled: false,
          notificationIds: [],
          nextMessageIndex: nextDailyReminderMessageIndex,
        });
        return;
      }

      const result = await dailyReminderManager.enable({
        now: new Date(),
        messageCursor: nextDailyReminderMessageIndex,
        days: 28,
      });
      setDailyReminders({
        enabled: result.enabled,
        notificationIds: result.notificationIds,
        nextMessageIndex: nextDailyReminderMessageIndex + result.notificationIds.length,
      });

      if (!result.enabled) {
        Alert.alert('Notifications are off', 'Allow notifications in your device settings to receive the daily reminder.');
      }
    } catch {
      Alert.alert('Reminder unavailable', 'We could not schedule the daily reminder. Please try again.');
    } finally {
      setReminderBusy(false);
    }
  };

  const sendTestNotification = async () => {
    if (testNotificationBusy) return;
    setTestNotificationBusy(true);

    try {
      const sent = await dailyReminderManager.sendTest(nextDailyReminderMessageIndex);
      if (sent) {
        setDailyReminders({
          enabled: dailyReminderEnabled,
          notificationIds: dailyReminderNotificationIds,
          nextMessageIndex: advanceDailyReminderMessageIndex(nextDailyReminderMessageIndex),
        });
      }
      Alert.alert(
        sent ? 'Test notification sent' : 'Notifications are off',
        sent
          ? 'Background TheoTok for a moment to see it in the notification tray.'
          : 'Allow notifications in your device settings, then try again.',
      );
    } catch {
      Alert.alert('Test unavailable', 'We could not send a test notification. Please try again.');
    } finally {
      setTestNotificationBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 96 },
        ]}>
        <Text style={styles.title}>Filters</Text>
        <Text style={styles.subtitle}>
          {poolSize} {poolSize === 1 ? 'card' : 'cards'} in your feed
        </Text>

        <Section
          title="Content"
          note="What kinds of card you want to see. At least one stays on.">
          <View style={styles.chips}>
            {CONTENT_TYPES.map((type) => (
              <Chip
                key={type}
                label={TYPE_LABELS[type]}
                selected={types.includes(type)}
                onPress={() => toggleType(type)}
              />
            ))}
          </View>
        </Section>

        <Section
          title="Traditions"
          note="Pick any number. Scripture, the creeds and the councils belong to everyone, so they always appear. Choose none to see all traditions.">
          <View style={styles.chips}>
            {SELECTABLE_TRADITIONS.map((tradition) => (
              <Chip
                key={tradition}
                label={TRADITION_LABELS[tradition]}
                selected={traditions.includes(tradition)}
                onPress={() => toggleTradition(tradition)}
              />
            ))}
          </View>
        </Section>

        <Section
          title="Card style"
          note="Catechism questions and history cards can lead with the question and hold the answer back until you tap. Scripture, the creeds and confession articles have no question to ask, so they always show in full.">
          <View style={styles.chips}>
            <Chip
              label="Just read"
              selected={!revealAnswers}
              onPress={() => setRevealAnswers(false)}
            />
            <Chip label="Test me" selected={revealAnswers} onPress={() => setRevealAnswers(true)} />
          </View>
        </Section>

        <Section
          title="Daily reminder"
          note="Receive an encouraging Scripture and theology prompt at 8:00 AM. Messages rotate so each morning is a little different.">
          <View style={styles.chips}>
            <Chip
              label={reminderBusy ? 'Updating reminder…' : 'Daily 8 AM reminder'}
              selected={dailyReminderEnabled}
              onPress={() => void toggleDailyReminder()}
            />
            <Chip
              label={testNotificationBusy ? 'Sending test…' : 'Send test notification now'}
              selected={false}
              onPress={() => void sendTestNotification()}
            />
          </View>
        </Section>

        <Section title="Reading history" note={`${seenCount} cards seen. Clearing this lets them come round again sooner.`}>
          <View style={styles.chips}>
            <Chip label="Clear reading history" selected={false} onPress={clearSeen} />
          </View>
        </Section>

        <Section title="Saved" note={`${savedCount} saved ${savedCount === 1 ? 'card' : 'cards'}.`}>
          <View style={styles.chips}>
            <Chip label="Clear saved cards" selected={false} onPress={clearSaved} />
            <Chip label="Show onboarding again" selected={false} onPress={restartOnboarding} />
          </View>
        </Section>
      </ScrollView>
      <TopScrim />
    </View>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  root: { flex: 1, backgroundColor: colors.void },
  content: {
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: maxCardWidth,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  note: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
