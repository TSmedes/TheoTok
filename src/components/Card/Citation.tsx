import { StyleSheet, Text, View } from 'react-native';

import type { ContentType } from '@/content/types';
import { colors, fonts, spacing } from '@/theme/tokens';

const TYPE_LABEL: Record<ContentType, string> = {
  scripture: 'Scripture',
  history: 'Church History',
  doctrine: 'Doctrine',
};

interface Props {
  type: ContentType;
  citation: string;
  attribution?: string;
  /**
   * Give up the width the action rail occupies. The body already does this;
   * without it a long source title — "The Longer Catechism of the Orthodox,
   * Catholic, Eastern Church" — wraps at the full card width and runs
   * underneath the rail's lower buttons. Off for the shared image, which has
   * no rail to avoid.
   */
  railInset?: boolean;
}

/**
 * Every card carries this. The citation string is rendered from the card's
 * source record rather than typed per card, so it cannot drift.
 */
export function Citation({ type, citation, attribution, railInset = false }: Props) {
  return (
    <View testID="citation-block" style={railInset ? styles.railInset : undefined}>
      <View style={styles.rule} />
      <Text style={styles.label}>{TYPE_LABEL[type].toUpperCase()}</Text>
      <Text style={styles.citation}>{citation}</Text>
      {attribution ? <Text style={styles.attribution}>{attribution}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Wider than the rail's 44pt buttons, which sit 16 in from the card edge. */
  railInset: { paddingRight: spacing.xxl },
  rule: {
    width: 44,
    height: 1,
    backgroundColor: colors.accentDim,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  citation: {
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  attribution: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    marginTop: 2,
  },
});
