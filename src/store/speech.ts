import * as Speech from 'expo-speech';
import { create } from 'zustand';

import type { RenderedCard } from '@/content/types';

interface SpeechState {
  /** Id of the card currently being read, or null. */
  speakingId: string | null;
  toggle: (card: RenderedCard) => void;
  stop: () => void;
}

/** What gets read aloud: the question, the text, then the citation. */
function scriptFor(card: RenderedCard): string {
  const parts = [card.prompt, card.body, card.citation].filter(Boolean);
  return parts.join('. ');
}

/**
 * Speech is global rather than per-card: only one card can be read at a time,
 * and starting a new one has to interrupt the last. Keeping it in a store also
 * means scrolling away can stop it from anywhere.
 */
export const useSpeech = create<SpeechState>()((set, get) => ({
  speakingId: null,

  toggle: (card) => {
    const current = get().speakingId;
    Speech.stop();

    if (current === card.id) {
      set({ speakingId: null });
      return;
    }

    set({ speakingId: card.id });
    Speech.speak(scriptFor(card), {
      rate: 0.95,
      onDone: () => {
        // Only clear if this utterance is still the current one.
        if (get().speakingId === card.id) set({ speakingId: null });
      },
      onStopped: () => {
        if (get().speakingId === card.id) set({ speakingId: null });
      },
      onError: () => {
        if (get().speakingId === card.id) set({ speakingId: null });
      },
    });
  },

  stop: () => {
    Speech.stop();
    set({ speakingId: null });
  },
}));
