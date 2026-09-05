import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet';
  disabled?: boolean;
  /** Shows a spinner in place of the label and refuses presses while true. */
  busy?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, busy }: Props) {
  const quiet = variant === 'quiet';
  const inert = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inert, busy: !!busy }}
      style={({ pressed }) => [
        styles.base,
        quiet ? styles.quiet : styles.primary,
        pressed && styles.pressed,
        // Busy is a state the button is working in, not one it is unavailable
        // in, so it keeps its full weight rather than dimming out.
        disabled && !busy && styles.disabled,
      ]}>
      {/*
       * The label stays mounted underneath and merely turns invisible, so the
       * button keeps the exact width and height it had. Swapping it for a
       * spinner outright makes the row resize the moment you press it.
       */}
      <Text
        style={[styles.label, quiet ? styles.quietLabel : styles.primaryLabel, busy && styles.hidden]}>
        {label}
      </Text>
      {busy ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="small" color={quiet ? colors.textSecondary : '#161208'} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  quiet: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  hidden: { opacity: 0 },
  spinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.ui, fontSize: 15, letterSpacing: 0.2 },
  primaryLabel: { color: '#161208', fontWeight: '700' },
  quietLabel: { color: colors.textSecondary },
});
