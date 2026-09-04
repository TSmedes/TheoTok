import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * A fling can cross a dozen cards, and one tick per card would machine-gun the
 * taptic engine. This only fires on a landing, so the gap is really a guard
 * against two flings in quick succession rather than against a single fast one.
 */
const MIN_GAP_MS = 120;

let lastAt = 0;

/**
 * The feel of a card coming to rest.
 *
 * Deliberately `impactAsync(Soft)` rather than the `selectionAsync` the action
 * rail uses: selection feedback is tuned for picker detents and reads as a
 * click, where a page landing wants something with a little more body.
 *
 * Not gated on the motion preference. Reduced motion is about movement on
 * screen, and someone who has asked for less of it has not asked to lose the
 * sense of the page turning under their thumb.
 */
export function cardLanded(): void {
  // Haptics are iOS/Android only; calling on web logs a warning.
  if (Platform.OS === 'web') return;

  const now = Date.now();
  if (now - lastAt < MIN_GAP_MS) return;
  lastAt = now;

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}
