import { Text, type TextStyle } from 'react-native';

import { colors, fonts, tierFor } from '@/theme/tokens';

interface Props {
  children: string;
  /** Extra characters sharing the card (e.g. a prompt above), so the tier accounts for the whole block. */
  companionLength?: number;
  style?: TextStyle;
}

/**
 * Picks a discrete size tier from character count instead of using
 * `adjustsFontSizeToFit`, which is native-only and forces a measurement pass.
 * The result is deterministic and identical on every platform.
 */
export function AutoScaleText({ children, companionLength = 0, style }: Props) {
  const tier = tierFor(' '.repeat(companionLength) + children);
  return (
    <Text
      style={[
        {
          color: colors.text,
          fontFamily: fonts.display,
          fontSize: tier.fontSize,
          lineHeight: tier.lineHeight,
          letterSpacing: -0.3,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
