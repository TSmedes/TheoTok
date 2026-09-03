import type { RenderedCard } from '@/content/types';

import { cardAsText } from './plainText';

export interface ShareRequest {
  card: RenderedCard;
  target?: React.RefObject<unknown> | null;
}

/**
 * Web share. `react-native-view-shot` has no web implementation, so this shares
 * text through the Web Share API and falls back to the clipboard where that is
 * missing (desktop Firefox, and any non-secure origin). Image export on web
 * would need a separate canvas path; it is deliberately out of scope here.
 */
export async function shareCard({ card }: ShareRequest): Promise<'image' | 'text'> {
  const text = cardAsText(card);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: card.citation, text });
      return 'text';
    } catch (err) {
      // A user dismissing the sheet throws AbortError; that is not a failure.
      if ((err as Error)?.name === 'AbortError') return 'text';
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
  return 'text';
}
