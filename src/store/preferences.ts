import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CONTENT_TYPES, type ContentType, type Tradition } from '@/content/types';

export type MotionPreference = 'full' | 'reduced';

interface PreferencesState {
  /** Empty means no tradition filter, which is what "skip" in onboarding leaves behind. */
  traditions: Tradition[];
  types: ContentType[];
  onboarded: boolean;
  /**
   * Withhold each card's answer until the reader asks for it, turning the feed
   * into self-testing rather than reading. Off by default: it changes what the
   * app is for, so it should be chosen rather than arrived at.
   */
  revealAnswers: boolean;
  /**
   * How much the feed is allowed to move. 'reduced' keeps the fades but drops
   * the parallax, the scale and the stagger. The OS accessibility setting is
   * OR'd with this at read time, so the system can only ever tighten what the
   * reader chose — see `@/motion/useMotionPreference`.
   */
  motion: MotionPreference;
  /**
   * Whether the app answers touch at all. A master switch: the scroll detents,
   * the save confirmation, the card landing and the action rail's clicks all ask
   * this one question — see `@/motion/haptics`.
   *
   * Deliberately independent of `motion`. Reduced motion is about movement on
   * screen, and someone who asked for less of it has not asked to lose the feel
   * of the page turning under their thumb.
   */
  haptics: boolean;
  /**
   * Whether the scroll itself notches under the thumb. Subordinate to `haptics`:
   * this is the one haptic that fires continuously rather than in answer to a
   * press, so it is the one someone is most likely to want gone on its own while
   * keeping the confirmations that mark something happening.
   */
  scrollHaptics: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderNotificationIds: string[];
  nextDailyReminderMessageIndex: number;

  setTraditions: (traditions: Tradition[]) => void;
  toggleTradition: (tradition: Tradition) => void;
  /** Commits a whole selection at once, so a filter change is one feed rebuild. */
  setTypes: (types: ContentType[]) => void;
  toggleType: (type: ContentType) => void;
  setRevealAnswers: (value: boolean) => void;
  setMotion: (value: MotionPreference) => void;
  setHaptics: (value: boolean) => void;
  setScrollHaptics: (value: boolean) => void;
  setDailyReminders: (value: {
    enabled: boolean;
    notificationIds: string[];
    nextMessageIndex: number;
  }) => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      traditions: [],
      types: [...CONTENT_TYPES],
      onboarded: false,
      revealAnswers: false,
      motion: 'full',
      haptics: true,
      scrollHaptics: true,
      dailyReminderEnabled: false,
      dailyReminderNotificationIds: [],
      nextDailyReminderMessageIndex: 0,

      setTraditions: (traditions) => set({ traditions }),

      toggleTradition: (tradition) =>
        set((state) => ({
          traditions: state.traditions.includes(tradition)
            ? state.traditions.filter((t) => t !== tradition)
            : [...state.traditions, tradition],
        })),

      // Same invariant as `toggleType`: an empty selection would leave nothing to
      // show at all, so it is refused rather than blanking the feed.
      setTypes: (types) => set((state) => (types.length === 0 ? state : { types })),

      toggleType: (type) =>
        set((state) => {
          const next = state.types.includes(type)
            ? state.types.filter((t) => t !== type)
            : [...state.types, type];
          // Turning off the last type would leave nothing to show at all, so the
          // final one is sticky rather than the feed going blank.
          return next.length === 0 ? state : { types: next };
        }),

      setRevealAnswers: (revealAnswers) => set({ revealAnswers }),

      setMotion: (motion) => set({ motion }),

      setHaptics: (haptics) => set({ haptics }),

      setScrollHaptics: (scrollHaptics) => set({ scrollHaptics }),

      setDailyReminders: ({
        enabled: dailyReminderEnabled,
        notificationIds: dailyReminderNotificationIds,
        nextMessageIndex: nextDailyReminderMessageIndex,
      }) => set({ dailyReminderEnabled, dailyReminderNotificationIds, nextDailyReminderMessageIndex }),

      completeOnboarding: () => set({ onboarded: true }),
      restartOnboarding: () => set({ onboarded: false }),
    }),
    {
      name: 'theotok:preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
