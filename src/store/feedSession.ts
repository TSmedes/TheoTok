import { create } from 'zustand';

/**
 * Where the reader is, for the life of the app session.
 *
 * Deliberately not persisted. Resuming mid-feed after switching tabs is
 * obviously right; resuming days later on the card you fell asleep on is not,
 * and a fresh shuffle each launch is the behaviour that was chosen.
 */
interface FeedSessionState {
  /** Index of the card currently in view. */
  index: number;
  /** Cards whose answer has been revealed, in question-and-answer mode. */
  revealed: string[];

  setIndex: (index: number) => void;
  reveal: (id: string) => void;
  /** Called when the filters change and the old position no longer means anything. */
  restart: () => void;
}

export const useFeedSession = create<FeedSessionState>()((set, get) => ({
  index: 0,
  revealed: [],

  setIndex: (index) => {
    if (get().index === index) return;
    set({ index });
  },

  reveal: (id) =>
    set((state) => (state.revealed.includes(id) ? state : { revealed: [...state.revealed, id] })),

  restart: () => set({ index: 0, revealed: [] }),
}));

/** A non-reactive read, for components that need the position only at mount. */
export function currentIndex(): number {
  return useFeedSession.getState().index;
}
