import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardDeck } from '@/components/CardDeck';
import { clampIndex, useSavedItems } from '@/store/savedCards';
import { colors, spacing } from '@/theme/tokens';

/**
 * A saved card, read the way it was read in the feed — full bleed, with the
 * action rail — and swipeable through the rest of the collection from there.
 * The list screen is for finding a card; this is for sitting with one.
 */
export default function SavedCardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index?: string }>();
  const items = useSavedItems();

  /*
   * Read once, like the feed's own resume position: the collection can shrink
   * underneath this screen when a card is unsaved, and re-anchoring the scroller
   * mid-read would yank the page out from under the reader.
   */
  const startIndex = useRef(clampIndex(Number(index), items.length)).current;

  const empty = items.length === 0;
  useEffect(() => {
    if (!empty) return;
    // Unsaving the last card leaves nothing to look at. Opened cold — a deep
    // link, a reload on web — there is no history to go back to, so fall back
    // to the list itself rather than sitting on a blank screen.
    if (router.canGoBack()) router.back();
    else router.replace('/saved');
  }, [empty, router]);

  return (
    <View style={styles.root}>
      {empty ? null : (
        <CardDeck
          data={items}
          keyExtractor={(item) => item.card.id}
          initialIndex={startIndex}
        />
      )}

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => [
          styles.close,
          { top: insets.top + spacing.sm },
          pressed && styles.closePressed,
        ]}>
        <Ionicons name="chevron-down" size={24} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
  close: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.scrim,
  },
  closePressed: { opacity: 0.55, transform: [{ scale: 0.92 }] },
});
