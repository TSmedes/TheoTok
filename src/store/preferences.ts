import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CONTENT_TYPES, type ContentType, type Tradition } from '@/content/types';

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
  dailyReminderEnabled: boolean;
  dailyReminderNotificationIds: string[];
  nextDailyReminderMessageIndex: number;

  setTraditions: (traditions: Tradition[]) => void;
  toggleTradition: (tradition: Tradition) => void;
  toggleType: (type: ContentType) => void;
  setRevealAnswers: (value: boolean) => void;
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
