import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

export interface PicklistOption<T extends string> {
  value: T;
  label: string;
  /** A line of explanation under the label, where the choice is not self-evident. */
  blurb?: string;
}

interface Props<T extends string> {
  label: string;
  /** What the current selection amounts to, read out while the list is shut. */
  summary: string;
  options: readonly PicklistOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

/**
 * A collapsible multi-select.
 *
 * Built from the app's own primitives rather than a platform picker: the
 * system pickers that ship with `@expo/ui` are single-select, and the ones that
 * are not are iOS- and Android-only, so a native control would neither express
 * this choice nor survive the web build. It would also drop a second visual
 * language into a screen with a very deliberate one.
 *
 * Selection here is deliberately not a live setting. The caller holds a draft
 * and commits it, so opening the list and changing your mind costs nothing —
 * which is the whole reason this replaced a row of chips that each rebuilt the
 * feed on touch.
 */
export function Picklist<T extends string>({
  label,
  summary,
  options,
  selected,
  onToggle,
  expanded,
  onToggleExpanded,
}: Props<T>) {
  return (
    <View style={styles.root}>
      <Pressable
        onPress={onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: summary }}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerText}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.summary} numberOfLines={1}>
            {summary}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.options}>
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => onToggle(option.value)}
                accessibilityRole="checkbox"
                accessibilityLabel={option.label}
                accessibilityHint={option.blurb}
                accessibilityState={{ checked }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                {/*
                 * The tick occupies its slot whether or not it is drawn, so
                 * labels stay on one left edge instead of shifting as you
                 * select.
                 */}
                <View style={styles.tick}>
                  {checked ? (
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                  ) : null}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, checked && styles.optionLabelChecked]}>
                    {option.label}
                  </Text>
                  {option.blurb ? <Text style={styles.blurb}>{option.blurb}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  label: {
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  summary: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
  },
  options: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.rule,
    paddingVertical: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  tick: { width: 18, paddingTop: 1, alignItems: 'center' },
  optionText: { flex: 1, gap: 2 },
  optionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  optionLabelChecked: { color: colors.accent, fontWeight: '600' },
  blurb: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: { opacity: 0.65 },
});
