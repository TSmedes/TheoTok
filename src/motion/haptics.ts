import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { usePreferences } from '@/store/preferences';

/**
 * Every haptic the app fires passes through here, so that the Settings toggle is
 * a genuine master switch: turn it off and the app goes completely silent to the
 * touch, rather than losing only the parts that were added last.
 *
 * The store is read imperatively rather than through a hook because these are
 * called from event handlers and scroll callbacks, never from a render.
 *
 * There is no OS-level twin of `useMotionPreference` here. Neither platform
 * exposes its system haptics setting to query: iOS honours *Sounds & Haptics ›
 * System Haptics* inside the Taptic Engine itself, and Android does the same for
 * its own. The OS already tightens for us, below the layer we can see.
 */
function silent(): boolean {
  // Haptics are iOS/Android only; calling on web logs a warning.
  if (Platform.OS === 'web') return true;
  return !usePreferences.getState().haptics;
}

/**
 * Two timestamps rather than one, because a landing must never be swallowed by a
 * detent that fired a frame before it. `cardLanded` consults only its own, so it
 * always gets through, but writes to both — which is what stops a detent
 * crowding it from behind.
 */
let lastTickAt = 0;
let lastLandingAt = 0;

/** A backstop only: the detent grid already caps ticks at one per frame. */
const MIN_TICK_MS = 40;

/**
 * A fling can cross a dozen cards, and one thump per card would machine-gun the
 * taptic engine. This only fires on a landing, so the gap is really a guard
 * against two flings in quick succession rather than against a single fast one.
 */
const MIN_LANDING_MS = 120;

/**
 * One notch of the feed passing under the thumb.
 *
 * Fired against distance travelled rather than time — see `scrollDetents.ts` —
 * which is what makes the feel come out of the gesture for free. Drag slowly and
 * the notches arrive far enough apart to be felt one at a time; fling and they
 * collapse into a burst that thins out as the scroll decelerates.
 *
 * `Light` deliberately: this fires ten times a card, and anything with body to
 * it would be exhausting at that rate. The landing below is what has weight.
 *
 * iOS only. Android's vibrator answers a rapid run of impacts with a coarse
 * buzz rather than distinct notches, so what reads as texture on the Taptic
 * Engine reads as a rattle there. Better nothing than a bad version of it — the
 * landing and the button confirmations carry the feel on Android.
 */
export function scrollTick(): void {
  if (silent()) return;
  if (Platform.OS === 'android') return;
  // The one haptic with a switch of its own beneath the master, because it is
  // the one that fires continuously rather than in answer to a press: a reader
  // can find the notching wearing without wanting to lose the confirmations
  // that mark something actually happening.
  if (!usePreferences.getState().scrollHaptics) return;

  const now = Date.now();
  if (now - Math.max(lastTickAt, lastLandingAt) < MIN_TICK_MS) return;
  lastTickAt = now;

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * The feel of a card coming to rest.
 *
 * Deliberately `impactAsync(Soft)` rather than the `selectionAsync` the action
 * rail uses: selection feedback is tuned for picker detents and reads as a
 * click, where a page landing wants something with a little more body.
 */
export function cardLanded(): void {
  if (silent()) return;

  const now = Date.now();
  if (now - lastLandingAt < MIN_LANDING_MS) return;
  lastLandingAt = now;
  lastTickAt = now;

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
}

/** The ordinary click of a button in the action rail acknowledging a press. */
export function tap(): void {
  if (silent()) return;
  void Haptics.selectionAsync();
}

/**
 * Saving a card: on iOS a completion rather than an acknowledgement, because the
 * reader has taken something away with them.
 *
 * On iOS this is the same pattern the App Store plays when an install finishes —
 * a light tap followed by a heavier one, which is why it reads as a checkmark
 * being drawn rather than as a button being pressed. It is already two-part, so
 * resist stacking an `impactAsync` in front of it; a third beat only muddies it.
 *
 * Android gets the same click as every other button in the rail. The platform's
 * `Confirm` effect is long and heavy enough there that saving felt like a
 * different class of event from the buttons beside it; matching them keeps the
 * rail consistent under the thumb.
 */
export function cardSaved(): void {
  if (silent()) return;

  if (Platform.OS === 'android') {
    void Haptics.selectionAsync();
    return;
  }

  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
