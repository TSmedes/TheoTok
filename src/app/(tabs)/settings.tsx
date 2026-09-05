import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { TopScrim } from '@/components/TopScrim';
import { CARDS } from '@/content/library';
import { CONTENT_TYPES, TRADITION_LABELS, type ContentType } from '@/content/types';
import { SELECTABLE_TRADITIONS, buildPool } from '@/feed/buildPool';
import { usePreferences } from '@/store/preferences';
import { dailyReminderManager } from '@/notifications/expoDailyReminder';
import { notificationsAvailable } from '@/notifications/expoNotifications';
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
  const router = useRouter();
  // Selectors rather than the whole store: without one this screen re-renders on
  // every preferences change, and each of those renders used to rebuild the pool.
  const traditions = usePreferences((s) => s.traditions);
  const types = usePreferences((s) => s.types);
  const toggleTradition = usePreferences((s) => s.toggleTradition);
  const toggleType = usePreferences((s) => s.toggleType);
  const restartOnboarding = usePreferences((s) => s.restartOnboarding);
  const revealAnswers = usePreferences((s) => s.revealAnswers);
  const setRevealAnswers = usePreferences((s) => s.setRevealAnswers);
  const motionPreference = usePreferences((s) => s.motion);
  const setMotion = usePreferences((s) => s.setMotion);
  const hapticsEnabled = usePreferences((s) => s.haptics);
  const setHaptics = usePreferences((s) => s.setHaptics);
  const scrollHapticsEnabled = usePreferences((s) => s.scrollHaptics);
  const setScrollHaptics = usePreferences((s) => s.setScrollHaptics);
  const dailyReminderEnabled = usePreferences((s) => s.dailyReminderEnabled);
  const dailyReminderNotificationIds = usePreferences((s) => s.dailyReminderNotificationIds);
  const nextDailyReminderMessageIndex = usePreferences((s) => s.nextDailyReminderMessageIndex);
  const setDailyReminders = usePreferences((s) => s.setDailyReminders);
  const clearSeen = useSeen((s) => s.clear);
  const seenCount = useSeen((s) => s.ids.length);
  const clearSaved = useSaved((s) => s.clear);
  const savedCount = useSaved((s) => s.ids.length);
  const [reminderBusy, setReminderBusy] = useState(false);

  /**
   * The count is the one thing on this screen that has to look at the library,
   * so it is the one thing allowed to lag. The chips read the live values and
   * paint immediately; this follows a beat later.
   */
  const countedTraditions = useDeferredValue(traditions);
  const countedTypes = useDeferredValue(types);
  const poolSize = useMemo(
    () => buildPool(CARDS, { traditions: countedTraditions, types: countedTypes }).length,
    [countedTraditions, countedTypes],
  );

  // While these disagree the number on screen is the previous filters' answer.
  const countStale = countedTraditions !== traditions || countedTypes !== types;
  const countStyle = useAnimatedStyle(() => ({
    opacity: withTiming(countStale ? 0.4 : 1, { duration: 120 }),
  }));

  // The scroll detents are iOS-only — see `@/motion/haptics` — so on Android the
  // switch beneath the master would govern nothing.
  const scrollHapticsOffered = Platform.OS !== 'android';
  // Web has no haptics at all, so the whole section is a switch for nothing.
  const hapticsOffered = Platform.OS !== 'web';

  /**
   * Clearing the flag on its own only changes where `app/index` would send
   * someone on a cold start, which is why this used to look like a chip that did
   * nothing. The navigation has to be asked for as well.
   */
  const showOnboardingAgain = () => {
    restartOnboarding();
    router.replace('/onboarding/traditions');
  };

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

      if (!notificationsAvailable) {
        Alert.alert(
          'Reminders need a development build',
          'Expo Go on Android cannot schedule notifications since SDK 53. Run the app in a development build to use the daily reminder.',
        );
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 96 },
        ]}>
        <Text style={styles.title}>Options</Text>
        <Animated.Text style={[styles.subtitle, countStyle]}>
          {poolSize} {poolSize === 1 ? 'card' : 'cards'} in your feed
        </Animated.Text>

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
          title="Motion"
          note="Cards drift and settle as you scroll. Gentle keeps the fades but drops the movement — useful if motion makes you uneasy, or to save battery. Turning animations off for your whole device does this too.">
          <View style={styles.chips}>
            <Chip
              label="Full"
              selected={motionPreference === 'full'}
              onPress={() => setMotion('full')}
            />
            <Chip
              label="Gentle"
              selected={motionPreference === 'reduced'}
              onPress={() => setMotion('reduced')}
            />
          </View>
        </Section>

        {hapticsOffered ? (
          <Section
            title="Haptics"
            note={
              scrollHapticsOffered
                ? 'Feel a vibration when you scroll and when you tap.'
                : 'Feel a vibration when you tap.'
            }>
            <View style={styles.chips}>
              <Chip
                label="Haptics"
                selected={hapticsEnabled}
                onPress={() => setHaptics(!hapticsEnabled)}
              />
              {/*
                Only offered while haptics are on at all: with the master off there
                is nothing left to subdivide, and a chip that changes nothing is
                worse than one that isn't there. Android never fires the scroll
                notches, so the same reasoning hides the chip there too.
              */}
              {hapticsEnabled && scrollHapticsOffered ? (
                <Chip
                  label="While scrolling"
                  selected={scrollHapticsEnabled}
                  onPress={() => setScrollHaptics(!scrollHapticsEnabled)}
                />
              ) : null}
            </View>
          </Section>
        ) : null}

        <Section
          title="Daily reminder"
          note="Receive an encouraging Scripture and theology prompt at 8:00 AM. Messages rotate so each morning is a little different.">
          <View style={styles.chips}>
            <Chip
              label={reminderBusy ? 'Updating reminder…' : 'Daily 8 AM reminder'}
              selected={dailyReminderEnabled}
              onPress={() => void toggleDailyReminder()}
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
            <Chip label="Show onboarding again" selected={false} onPress={showOnboardingAgain} />
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
