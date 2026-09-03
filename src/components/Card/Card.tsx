import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RenderedCard } from '@/content/types';
import {
  colors,
  fonts,
  gradientEnd,
  gradientLocations,
  gradients,
  gradientStart,
  maxCardWidth,
  spacing,
} from '@/theme/tokens';

import { AutoScaleText } from './AutoScaleText';
import { Citation } from './Citation';

interface Props {
  card: RenderedCard;
  /**
   * 'share' renders the same card for off-screen capture: no safe-area insets
   * (there is no notch in a PNG) and no room reserved for the tab bar or the
   * action rail. Reusing the component rather than rebuilding the layout is
   * what keeps the shared image identical to what the reader actually saw.
   */
  variant?: 'feed' | 'share';
  /**
   * Question-and-answer mode: show only the cue until the reader asks for the
   * rest. The citation is withheld along with the body — for a history card it
   * names the source, which gives away as much as the answer does.
   */
  hidden?: boolean;
  onReveal?: () => void;
}

/**
 * One card fills exactly one page. The body is vertically centred and the
 * citation is pinned to the bottom, so however the text scales, the citation
 * always sits in the same place — the eye learns where to look.
 */
export function Card({ card, variant = 'feed', hidden = false, onReveal }: Props) {
  const insets = useSafeAreaInsets();
  const share = variant === 'share';
  // A shared image is never a riddle, and a card with no cue has nothing to withhold.
  const withheld = hidden && !share && card.cue != null;

  const body = (
    <LinearGradient
      colors={gradients[card.type]}
      start={gradientStart}
      end={gradientEnd}
      locations={gradientLocations}
      style={styles.fill}>
      <View
        style={[
          styles.inner,
          share
            ? { paddingTop: spacing.xxl, paddingBottom: spacing.xxl }
            : {
                paddingTop: insets.top + spacing.xl,
                // Room for the floating tab bar and the action rail beneath.
                paddingBottom: insets.bottom + spacing.xxl + spacing.xl,
              },
        ]}>
        {withheld ? (
          <>
            <View style={[styles.body, styles.bodyWithRail]}>
              {card.cueLabel ? <Text style={styles.cueLabel}>{card.cueLabel}</Text> : null}
              <AutoScaleText>{card.cue!}</AutoScaleText>
            </View>
            <View style={styles.revealRow}>
              <View style={styles.revealPill}>
                <Ionicons name="eye-outline" size={16} color={colors.accent} />
                <Text style={styles.revealText}>Show the answer</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.body, !share && styles.bodyWithRail]}>
              {card.prompt ? <Text style={styles.prompt}>{card.prompt}</Text> : null}
              <AutoScaleText companionLength={card.prompt?.length ?? 0}>{card.body}</AutoScaleText>
            </View>
            <Citation type={card.type} citation={card.citation} attribution={card.attribution} />
          </>
        )}
      </View>
    </LinearGradient>
  );

  if (!withheld) return body;

  // The whole card is the target, so revealing never requires aiming at a
  // small control — but it is still announced as one button, not a wall of text.
  return (
    <Pressable
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityLabel={`${card.cueLabel ?? 'Card'}: ${card.cue}. Show the answer.`}
      style={styles.fill}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: maxCardWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  /** Keeps long text clear of the action rail on the right. */
  bodyWithRail: { paddingRight: spacing.xxl },
  prompt: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 27,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  cueLabel: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: spacing.md,
  },
  // Sits where the citation would, so the layout does not jump on reveal.
  revealRow: { alignItems: 'flex-start' },
  revealPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: 'rgba(228, 192, 122, 0.10)',
  },
  revealText: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
