import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SavedState {
  /** Card ids, most recently saved first. Ids are stable across content edits. */
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useSaved = create<SavedState>()(
  persist(
    (set) => ({
      ids: [],

      toggle: (id) =>
        set((state) =>
          state.ids.includes(id)
            ? { ids: state.ids.filter((existing) => existing !== id) }
            : { ids: [id, ...state.ids] },
        ),

      remove: (id) => set((state) => ({ ids: state.ids.filter((existing) => existing !== id) })),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'theotok:saved',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Subscribe to just one card's saved state, so saving one card doesn't rerender the rest. */
export function useIsSaved(id: string): boolean {
  return useSaved((state) => state.ids.includes(id));
}
