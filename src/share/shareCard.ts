import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import type { RenderedCard } from '@/content/types';

import { cardAsText } from './plainText';

export interface ShareRequest {
  card: RenderedCard;
  /** The off-screen ShareCard to photograph, if one is mounted. */
  target?: React.RefObject<unknown> | null;
}

/**
 * Native share. Prefers an image, because an image is what actually travels —
 * it survives being pasted anywhere and carries the citation with it.
 *
 * Falls back to text whenever the image path is unavailable: capture needs a
 * development build (view-shot is a native module, absent from Expo Go), and
 * `Sharing` is unavailable on some devices. A share button that silently does
 * nothing is worse than one that shares plain text, so every failure degrades
 * rather than throwing.
 *
 * view-shot is required lazily for exactly that reason. Importing it at the top
 * of the module would run on app start and take the whole app down in Expo Go,
 * where the native module does not exist — defeating the fallback this function
 * is built around, and for a library that is only needed when someone actually
 * taps share.
 */
export async function shareCard({ card, target }: ShareRequest): Promise<'image' | 'text'> {
  if (target?.current) {
    try {
      if (await Sharing.isAvailableAsync()) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
        const uri = await captureRef(target as never, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: card.citation,
          UTI: 'public.png',
        });
        return 'image';
      }
    } catch {
      // Fall through to text.
    }
  }

  await Share.share({ message: cardAsText(card) });
  return 'text';
}
