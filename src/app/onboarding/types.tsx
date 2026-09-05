import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { CONTENT_TYPES, type ContentType } from '@/content/types';
import { usePreferences } from '@/store/preferences';
import { colors, fonts, spacing } from '@/theme/tokens';

const COPY: Record<ContentType, { label: string; blurb: string }> = {
  scripture: { label: 'Scripture', blurb: 'Passages from the New Revised Standard Version, with the Apocrypha.' },
  history: { label: 'Church History', blurb: 'What happened, and who it happened to — cited to the source.' },
  doctrine: { label: 'Doctrine', blurb: 'Creeds, confessions and catechisms, quoted and cited.' },
};

export default function TypesStep() {
  const router = useRouter();
  const types = usePreferences((s) => s.types);
  const toggleType = usePreferences((s) => s.toggleType);

  return (
    <OnboardingScaffold
      step={2}
      totalSteps={4}
      title="What would you like in the feed?"
      intro="Three kinds of card. You can change this at any time, and at least one stays switched on."
      footer={<Button label="Continue" onPress={() => router.push('/onboarding/reveal')} />}>
      <View style={styles.rows}>
        {CONTENT_TYPES.map((type) => (
          <View key={type} style={styles.row}>
            <Chip
              label={COPY[type].label}
              selected={types.includes(type)}
              onPress={() => toggleType(type)}
            />
            <Text style={styles.blurb}>{COPY[type].blurb}</Text>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  rows: { gap: spacing.lg },
  row: { alignItems: 'flex-start', gap: spacing.sm },
  blurb: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 19,
  },
});
