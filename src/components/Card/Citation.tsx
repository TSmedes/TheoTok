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
}

/**
 * Every card carries this. The citation string is rendered from the card's
 * source record rather than typed per card, so it cannot drift.
 */
export function Citation({ type, citation, attribution }: Props) {
  return (
    <View>
      <View style={styles.rule} />
      <Text style={styles.label}>{TYPE_LABEL[type].toUpperCase()}</Text>
      <Text style={styles.citation}>{citation}</Text>
      {attribution ? <Text style={styles.attribution}>{attribution}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
