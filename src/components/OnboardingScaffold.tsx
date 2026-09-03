import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

interface Props {
  /** 1-based, for the step dots. */
  step: number;
  totalSteps: number;
  title: string;
  intro?: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared frame for the onboarding screens, so all three sit identically. */
export function OnboardingScaffold({ step, totalSteps, title, intro, children, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.column}>
        <View style={styles.dots} accessibilityLabel={`Step ${step} of ${totalSteps}`}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotFilled]} />
          ))}
        </View>

        <Text style={styles.title}>{title}</Text>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.column}>{children}</View>
      </ScrollView>

      <View style={[styles.column, styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
  column: {
    width: '100%',
    maxWidth: maxCardWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  dot: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dotFilled: { backgroundColor: colors.accent },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  intro: {
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.xl, paddingBottom: spacing.lg },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
});
