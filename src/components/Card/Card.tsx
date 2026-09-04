import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RenderedCard } from '@/content/types';
import { Settle } from '@/motion/Settle';
import { SettleContext } from '@/motion/SettleContext';
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
  /** Covers the answer again. Absent on screens where re-hiding means nothing. */
  onHide?: () => void;
}

/**
 * One card fills exactly one page. The body is vertically centred and the
 * citation is pinned to the bottom, so however the text scales, the citation
 * always sits in the same place — the eye learns where to look.
 */
export function Card({ card, variant = 'feed', hidden = false, onReveal, onHide }: Props) {
  const insets = useSafeAreaInsets();
  const share = variant === 'share';
  // A shared image is never a riddle, and a card with no cue has nothing to withhold.
  const isQuestion = !share && card.cue != null;
  const withheld = hidden && isQuestion;

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
              {card.cueLabel ? (
                <Settle order={0}>
                  <Text style={styles.cueLabel}>{card.cueLabel}</Text>
                </Settle>
              ) : null}
              <Settle order={1}>
                <AutoScaleText>{card.cue!}</AutoScaleText>
              </Settle>
            </View>
            {/*
              Decorative here: the whole card is the press target while the
              answer is covered, so the pill must not swallow that tap.
            */}
            <View style={styles.revealRow}>
              <RevealPill icon="eye-outline" label="Show the answer" />
            </View>
          </>
        ) : (
          <>
            <View style={[styles.body, !share && styles.bodyWithRail]}>
              {card.prompt ? (
                <Settle order={0}>
                  <Text style={styles.prompt}>{card.prompt}</Text>
                </Settle>
              ) : null}
              <Settle order={1}>
                <AutoScaleText companionLength={card.prompt?.length ?? 0}>{card.body}</AutoScaleText>
              </Settle>
            </View>
            {isQuestion && onHide ? (
              <View style={styles.revealRow}>
                <RevealPill icon="eye-off-outline" label="Hide the answer" onPress={onHide} />
              </View>
            ) : null}
            <Settle order={2}>
              <Citation
                type={card.type}
                citation={card.citation}
                attribution={card.attribution}
                railInset={!share}
              />
            </Settle>
          </>
        )}
      </View>
    </LinearGradient>
  );

  // A shared image is photographed from the live view hierarchy, so an
  // animation that has started but not committed would be captured mid-flight.
  // `ShareCard` renders this component outside the feed and therefore outside
  // any provider, which already makes every `Settle` static; providing `null`
  // here as well means a provider added higher up later cannot break a capture.
  if (share) return <SettleContext.Provider value={null}>{body}</SettleContext.Provider>;

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

/**
 * The one control that both covers and uncovers the answer. It keeps the same
 * shape and the same place in the layout in either direction, so the card reads
 * as one thing being toggled rather than two different screens.
 */
function RevealPill({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={styles.revealText}>{label}</Text>
    </>
  );

  if (!onPress) return <View style={styles.revealPill}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.revealPill, pressed && styles.revealPillPressed]}>
      {content}
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
  revealRow: { alignItems: 'flex-start', marginBottom: spacing.md },
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
  revealPillPressed: { opacity: 0.55, transform: [{ scale: 0.96 }] },
  revealText: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
