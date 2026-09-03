import { Redirect } from 'expo-router';

import { usePreferences } from '@/store/preferences';

/**
 * Entry point. Sends first-time readers through onboarding and everyone else
 * straight to the feed.
 */
export default function Index() {
  const onboarded = usePreferences((s) => s.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/feed' : '/onboarding/traditions'} />;
}
