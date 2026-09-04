import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Card, RenderedCard } from '@/content/types';
import { cardSaved, tap } from '@/motion/haptics';
import { Settle } from '@/motion/Settle';
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

  return (
    <View style={styles.rail}>
      <RailButton
        order={4}
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        label={saved ? 'Remove from saved' : 'Save card'}
        active={saved}
        onPress={() => {
          // Only saving gets the completion. Removing a card keeps the ordinary
          // click: a "done!" on the undo would be celebrating the wrong thing.
          if (saved) tap();
          else cardSaved();
          toggleSaved(card.id);
        }}
      />
      <RailButton
        order={5}
        icon="share-outline"
        label="Share card"
        onPress={() => {
          tap();
          onShare(rendered);
        }}
      />
      <RailButton
        order={6}
        icon="book-outline"
        label="Read in context"
        onPress={() => {
          tap();
          onRead(card);
        }}
      />
      <RailButton
        order={7}
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

/**
 * Arrives after the card's text has, continuing the same running order — the
 * rail is the last thing to settle, so the eye reaches the words first.
 */
function RailButton({
  icon,
  label,
  onPress,
  active,
  order,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  order: number;
}) {
  return (
    <Settle order={order}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={10}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name={icon} size={25} color={active ? colors.accent : colors.text} />
      </Pressable>
    </Settle>
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
