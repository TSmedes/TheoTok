import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Picklist, type PicklistOption } from '@/components/Picklist';
import { TopScrim } from '@/components/TopScrim';
import { CARDS, renderedFor } from '@/content/library';
import {
  CONTENT_TYPES,
  TRADITION_LABELS,
  type ContentType,
  type Tradition,
} from '@/content/types';
import { SELECTABLE_TRADITIONS, buildPool, buildSequence } from '@/feed/buildPool';
import { poolKeyFor, sequenceFor } from '@/feed/sequence';
import { randomSeed } from '@/feed/shuffle';
import { usePreferences } from '@/store/preferences';
import { dailyReminderManager } from '@/notifications/expoDailyReminder';
import { notificationsAvailable } from '@/notifications/expoNotifications';
import { useSaved } from '@/store/saved';
import { useSeen, seenSnapshot } from '@/store/seen';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

const TYPE_LABELS: Record<ContentType, string> = {
  scripture: 'Scripture',
  history: 'Church History',
  doctrine: 'Doctrine',
};

const TYPE_OPTIONS: readonly PicklistOption<ContentType>[] = CONTENT_TYPES.map((type) => ({
  value: type,
  label: TYPE_LABELS[type],
}));

const TRADITION_OPTIONS: readonly PicklistOption<Tradition>[] = SELECTABLE_TRADITIONS.map(
  (tradition) => ({ value: tradition, label: TRADITION_LABELS[tradition] }),
);

/** What the shut list says it is holding. */
function summarise(labels: string[], everything: string): string {
  if (labels.length === 0) return everything;
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.length} selected`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Selectors rather than the whole store: without one this screen re-renders on
  // every preferences change, and each of those renders used to rebuild the pool.
  const traditions = usePreferences((s) => s.traditions);
  const types = usePreferences((s) => s.types);
  const setTraditions = usePreferences((s) => s.setTraditions);
  const setTypes = usePreferences((s) => s.setTypes);
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
   * The filters are held as a draft and committed on Save.
   *
   * Applying each tap as it happened meant every tap rebuilt the feed — which,
   * with the Feed tab still mounted behind this screen, blocked the thread long
   * enough that the control could not paint its own press. A draft makes
   * choosing free and gathers the cost into one deliberate moment.
   */
  const [draftTypes, setDraftTypes] = useState<ContentType[]>(types);
  const [draftTraditions, setDraftTraditions] = useState<Tradition[]>(traditions);
  const [openList, setOpenList] = useState<'types' | 'traditions' | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Re-seed when the committed filters change from anywhere else — restarting
   * onboarding, or our own Save landing — so the draft never shows a selection
   * that is no longer real.
   *
   * Adjusted during render rather than in an effect: an effect would render once
   * with the stale draft and again with the fresh one, and the stale frame is
   * exactly the wrong thing to show.
   */
  const committedKey = poolKeyFor(traditions, types);
  const [seededKey, setSeededKey] = useState(committedKey);
  if (seededKey !== committedKey) {
    setSeededKey(committedKey);
    setDraftTypes(types);
    setDraftTraditions(traditions);
  }

  const poolSize = useMemo(
    () => buildPool(CARDS, { traditions: draftTraditions, types: draftTypes }).length,
    [draftTraditions, draftTypes],
  );

  // `poolKeyFor` sorts both arrays, so this is the same order-independent
  // identity the feed uses to decide whether it has to rebuild at all.
  const dirty = poolKeyFor(draftTraditions, draftTypes) !== committedKey;
  const noTypes = draftTypes.length === 0;

  const toggleDraft = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  /**
   * Save does the feed's work rather than merely announcing it.
   *
   * Committing to the store is instant; what costs is the rebuild that follows
   * in the feed's next render. Building the order here leaves it in
   * `sequenceFor`'s memo and warms the render cache, so that render is a lookup
   * and the spinner covers the real work instead of standing in for it.
   */
  const onSave = async () => {
    if (saving || noTypes) return;
    setSaving(true);
    // Let the spinner paint before the thread goes away — the same yield
    // `CardDeck` uses before capturing a card to share.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    try {
      const pool = buildPool(CARDS, { traditions: draftTraditions, types: draftTypes });
      sequenceFor(poolKeyFor(draftTraditions, draftTypes), () => {
        const built = buildSequence(pool, seenSnapshot(), randomSeed());
        return { order: built.sequence.map((c) => c.id), recycled: built.recycled };
      });
      for (const card of pool) renderedFor(card);

      setTypes(draftTypes);
      setTraditions(draftTraditions);
      setOpenList(null);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.subtitle}>
          {poolSize} {poolSize === 1 ? 'card' : 'cards'} {dirty ? 'if you save' : 'in your feed'}
        </Text>

        <Section
          title="Filters"
          note="Choose what you want to see, then save. Scripture, the creeds and the councils belong to everyone, so they appear whichever traditions you pick — and choosing no tradition shows them all.">
          <View style={styles.lists}>
            <Picklist
              label="Content"
              summary={summarise(
                draftTypes.map((t) => TYPE_LABELS[t]),
                'Nothing selected',
              )}
              options={TYPE_OPTIONS}
              selected={draftTypes}
              onToggle={(type) => setDraftTypes((prev) => toggleDraft(prev, type))}
              expanded={openList === 'types'}
              onToggleExpanded={() => setOpenList((o) => (o === 'types' ? null : 'types'))}
            />

            <Picklist
              label="Traditions"
              summary={summarise(
                draftTraditions.map((t) => TRADITION_LABELS[t]),
                'All traditions',
              )}
              options={TRADITION_OPTIONS}
              selected={draftTraditions}
              onToggle={(tradition) =>
                setDraftTraditions((prev) => toggleDraft(prev, tradition))
              }
              expanded={openList === 'traditions'}
              onToggleExpanded={() =>
                setOpenList((o) => (o === 'traditions' ? null : 'traditions'))
              }
            />
          </View>

          {noTypes ? (
            <Text style={styles.warning}>
              Pick at least one kind of card — an empty feed has nothing to show.
            </Text>
          ) : null}

          {dirty || saving ? (
            <View style={styles.save}>
              <Button
                label={saving ? 'Saving' : 'Save filters'}
                onPress={() => void onSave()}
                disabled={noTypes}
                busy={saving}
              />
            </View>
          ) : null}
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
  lists: { gap: spacing.sm },
  save: { marginTop: spacing.md },
  warning: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
});
