import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Capped so the record cannot grow without bound. Oldest entries fall off,
 * which also means a card seen long ago becomes eligible again — desirable for
 * a feed, and the reason this is a window rather than a permanent ledger.
 */
export const SEEN_LIMIT = 500;

interface SeenState {
  /** Least recent first. */
  ids: string[];
  markSeen: (id: string) => void;
  clear: () => void;
}

export const useSeen = create<SeenState>()(
  persist(
    (set) => ({
      ids: [],

      markSeen: (id) =>
        set((state) => {
          const last = state.ids[state.ids.length - 1];
          // Scrolling fires repeatedly for the same card; ignore the no-op.
          if (last === id) return state;
          const ids = state.ids.filter((existing) => existing !== id);
          ids.push(id);
          return { ids: ids.length > SEEN_LIMIT ? ids.slice(ids.length - SEEN_LIMIT) : ids };
        }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'theotok:seen',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** A non-reactive snapshot, for building a sequence without subscribing to it. */
export function seenSnapshot(): Set<string> {
  return new Set(useSeen.getState().ids);
}
