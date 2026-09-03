import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { usePreferences } from '@/store/preferences';
import { colors, fonts, spacing } from '@/theme/tokens';

const OPTIONS: { value: boolean; label: string; blurb: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    {
      value: false,
      label: 'Just read',
      blurb: 'Every card shows in full. Swipe, read, move on.',
      icon: 'book-outline',
    },
    {
      value: true,
      label: 'Test me',
      blurb:
        'Catechism and history cards lead with the question and hold the answer back until you ask for it. Scripture and the creeds always show in full.',
      icon: 'help-circle-outline',
    },
  ];

export default function RevealStep() {
  const router = useRouter();
  const revealAnswers = usePreferences((s) => s.revealAnswers);
  const setRevealAnswers = usePreferences((s) => s.setRevealAnswers);

  return (
    <OnboardingScaffold
      step={3}
      totalSteps={4}
      title="Read, or test yourself?"
      intro="Some of this material is already in question-and-answer form. You can use it that way if you like."
      footer={<Button label="Continue" onPress={() => router.push('/onboarding/sample')} />}>
      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = revealAnswers === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => setRevealAnswers(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}. ${option.blurb}`}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}>
              <Ionicons
                name={option.icon}
                size={22}
                color={selected ? colors.accent : colors.textTertiary}
              />
              <View style={styles.optionBody}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionBlurb}>{option.blurb}</Text>
              </View>
              {selected ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>You can change this at any time under Filters.</Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(228,192,122,0.10)',
  },
  optionPressed: { opacity: 0.7 },
  optionBody: { flex: 1, gap: 4 },
  optionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    fontWeight: '600',
  },
  optionLabelSelected: { color: colors.accent },
  optionBlurb: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 19,
  },
  note: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    marginTop: spacing.lg,
  },
});
