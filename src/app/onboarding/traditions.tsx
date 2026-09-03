import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { TRADITION_LABELS } from '@/content/types';
import { SELECTABLE_TRADITIONS } from '@/feed/buildPool';
import { usePreferences } from '@/store/preferences';
import { spacing } from '@/theme/tokens';

export default function TraditionsStep() {
  const router = useRouter();
  const traditions = usePreferences((s) => s.traditions);
  const toggleTradition = usePreferences((s) => s.toggleTradition);
  const setTraditions = usePreferences((s) => s.setTraditions);

  return (
    <OnboardingScaffold
      step={1}
      totalSteps={4}
      title="Which traditions do you want to read from?"
      intro="Pick as many as you like. Scripture, the creeds and the councils belong to everyone, so they show up whatever you choose."
      footer={
        <>
          <Button label="Continue" onPress={() => router.push('/onboarding/types')} />
          <Button
            label="Show me everything"
            variant="quiet"
            onPress={() => {
              // No selection is the "no filter" state, which is exactly what
              // showing everything means.
              setTraditions([]);
              router.push('/onboarding/types');
            }}
          />
        </>
      }>
      <View style={styles.chips}>
        {SELECTABLE_TRADITIONS.map((tradition) => (
          <Chip
            key={tradition}
            label={TRADITION_LABELS[tradition]}
            selected={traditions.includes(tradition)}
            onPress={() => toggleTradition(tradition)}
          />
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
