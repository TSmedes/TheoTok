import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Card, RenderedCard } from '@/content/types';
import { useIsSaved, useSaved } from '@/store/saved';
import { useSpeech } from '@/store/speech';
import { colors, spacing } from '@/theme/tokens';

interface Props {
  card: Card;
  rendered: RenderedCard;
  onShare: (rendered: RenderedCard) => void;
  onRead: (card: Card) => void;
  /** True while the card's answer is still withheld. */
  hidden?: boolean;
  onReveal?: () => void;
}

/**
 * The right-hand rail of card actions. Sits over the card rather than inside
 * it, so `Card` stays a pure rendering of content and can be reused verbatim
 * for the shareable image.
 */
export function ActionRail({ card, rendered, onShare, onRead, hidden, onReveal }: Props) {
  const saved = useIsSaved(card.id);
  const toggleSaved = useSaved((s) => s.toggle);
  const speakingId = useSpeech((s) => s.speakingId);
  const toggleSpeech = useSpeech((s) => s.toggle);
  const speaking = speakingId === card.id;

  const tap = () => {
    // Haptics are iOS/Android only; calling on web logs a warning.
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  return (
    <View style={styles.rail}>
      <RailButton
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        label={saved ? 'Remove from saved' : 'Save card'}
        active={saved}
        onPress={() => {
          tap();
          toggleSaved(card.id);
        }}
      />
      <RailButton
        icon="share-outline"
        label="Share card"
        onPress={() => {
          tap();
          onShare(rendered);
        }}
      />
      <RailButton
        icon="book-outline"
        label="Read in context"
        onPress={() => {
          tap();
          onRead(card);
        }}
      />
      <RailButton
        icon={speaking ? 'stop-circle-outline' : 'volume-medium-outline'}
        label={speaking ? 'Stop reading aloud' : 'Read aloud'}
        active={speaking}
        onPress={() => {
          tap();
          // Reading the answer aloud while it is still covered would give it
          // away without showing it, so reveal first.
          if (hidden) onReveal?.();
          toggleSpeech(rendered);
        }}
      />
    </View>
  );
}

function RailButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name={icon} size={25} color={active ? colors.accent : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: spacing.md,
    bottom: 132,
    alignItems: 'center',
    gap: spacing.lg,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.55, transform: [{ scale: 0.92 }] },
});
