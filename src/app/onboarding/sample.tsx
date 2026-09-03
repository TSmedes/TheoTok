import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Citation } from '@/components/Card';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { CARDS, toRendered } from '@/content/library';
import { usePreferences } from '@/store/preferences';
import {
  colors,
  fonts,
  gradientEnd,
  gradientLocations,
  gradients,
  gradientStart,
  spacing,
} from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

/** A specific card rather than a random one, so the example is always a strong one. */
const SAMPLE_ID = 'doc-wsc-1';

const POINTS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'swap-vertical-outline', text: 'Swipe up for the next card. One card, one idea.' },
  { icon: 'library-outline', text: 'Every card is cited — book, chapter and verse, or question and article.' },
  { icon: 'bookmark-outline', text: 'Save anything worth keeping, and read a passage in full context.' },
];

export default function SampleStep() {
  const router = useRouter();
  const completeOnboarding = usePreferences((s) => s.completeOnboarding);

  const card = CARDS.find((c) => c.id === SAMPLE_ID) ?? CARDS[0];
  const rendered = card ? toRendered(card) : undefined;

  return (
    <OnboardingScaffold
      step={4}
      totalSteps={4}
      title="This is a card."
      footer={
        <Button
          label="Start reading"
          onPress={() => {
            completeOnboarding();
            router.replace('/(tabs)/feed');
          }}
        />
      }>
      {rendered ? (
        <LinearGradient
          colors={gradients[rendered.type]}
          start={gradientStart}
          end={gradientEnd}
          locations={gradientLocations}
          style={styles.preview}>
          {rendered.prompt ? <Text style={styles.prompt}>{rendered.prompt}</Text> : null}
          <Text style={styles.body}>{rendered.body}</Text>
          <View style={styles.citation}>
            <Citation
              type={rendered.type}
              citation={rendered.citation}
              attribution={rendered.attribution}
            />
          </View>
        </LinearGradient>
      ) : null}

      <View style={styles.points}>
        {POINTS.map((point) => (
          <View key={point.text} style={styles.point}>
            <Ionicons name={point.icon} size={18} color={colors.accent} style={styles.icon} />
            <Text style={styles.pointText}>{point.text}</Text>
          </View>
        ))}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: 18,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  prompt: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  citation: { marginTop: spacing.xl },
  points: { marginTop: spacing.xl, gap: spacing.md },
  point: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginRight: spacing.sm, marginTop: 2 },
  pointText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 21,
  },
});
