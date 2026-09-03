import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Announced to screen readers in place of a bare label. */
  hint?: string;
}

/** A selectable pill, shared by onboarding and the filters screen. */
export function Chip({ label, selected, onPress, hint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}>
      {selected ? (
        <Ionicons name="checkmark" size={15} color={colors.accent} style={styles.tick} />
      ) : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(228,192,122,0.12)',
  },
  chipPressed: { opacity: 0.65 },
  tick: { marginRight: 6 },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  labelSelected: { color: colors.accent, fontWeight: '600' },
});
