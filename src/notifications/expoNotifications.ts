import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type ExpoNotifications = typeof import('expo-notifications');

/*
 * Importing expo-notifications throws outright under Expo Go on Android. The
 * package's index re-exports `DevicePushTokenAutoRegistration.fx`, which
 * registers a push-token listener at module scope, and push notifications were
 * removed from Expo Go in SDK 53 — so the guard inside the library throws
 * during that side effect rather than warning.
 *
 * We only ever schedule local notifications, which Expo Go still supports, but
 * the throw happens while the module is evaluating: there is no call of ours to
 * avoid and nothing useful to catch. The import itself has to be skipped, which
 * is why every use of the package goes through the lazy loader below.
 */
export const notificationsAvailable = !(isRunningInExpoGo() && Platform.OS === 'android');

let cached: ExpoNotifications | null | undefined;

export function loadExpoNotifications(): ExpoNotifications | null {
  if (cached === undefined) {
    cached = notificationsAvailable ? (require('expo-notifications') as ExpoNotifications) : null;
  }
  return cached;
}
