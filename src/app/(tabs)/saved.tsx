import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopScrim } from '@/components/TopScrim';
import { CARDS, toRendered } from '@/content/library';
import type { ContentType } from '@/content/types';
import { useSaved } from '@/store/saved';
import { colors, fonts, gradients, maxCardWidth, spacing } from '@/theme/tokens';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const savedIds = useSaved((s) => s.ids);
  const remove = useSaved((s) => s.remove);

  const byId = new Map(CARDS.map((c) => [c.id, c]));
  // A saved id whose card no longer exists is skipped rather than crashing —
  // content edits should never break somebody's collection.
  const items = savedIds.flatMap((id) => {
    const card = byId.get(id);
    return card ? [{ card, rendered: toRendered(card) }] : [];
  });

  return (
    <View style={styles.screen}>
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 96 },
      ]}>
      <Text style={styles.title}>Saved</Text>
      <Text style={styles.subtitle}>
        {items.length === 0
          ? 'Nothing saved yet'
          : `${items.length} ${items.length === 1 ? 'card' : 'cards'}`}
      </Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={28} color={colors.textTertiary} />
          <Text style={styles.emptyText}>
            Tap the bookmark on any card and it will be waiting here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map(({ card, rendered }) => (
            <Pressable
              key={card.id}
              onPress={() => router.push({ pathname: '/reader', params: { cardId: card.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${rendered.citation}. Open in reader.`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <View style={[styles.stripe, { backgroundColor: accentFor(rendered.type) }]} />
              <View style={styles.rowBody}>
                <Text style={styles.rowCitation}>{rendered.citation}</Text>
                <Text style={styles.rowText} numberOfLines={2}>
                  {rendered.prompt ?? rendered.body}
                </Text>
              </View>
              <Pressable
                onPress={() => remove(card.id)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${rendered.citation} from saved`}
                style={styles.removeButton}>
                <Ionicons name="close" size={18} color={colors.textTertiary} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
      <TopScrim />
    </View>
  );
}

/** The brightest stop of each type's gradient, as a spine down the row. */
function accentFor(type: ContentType): string {
  return gradients[type][2];
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  root: { flex: 1, backgroundColor: colors.void },
  content: {
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: maxCardWidth,
    alignSelf: 'center',
  },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 34, letterSpacing: -0.5 },
  subtitle: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 260,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  rowPressed: { opacity: 0.7 },
  stripe: { width: 4, alignSelf: 'stretch' },
  rowBody: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, gap: 3 },
  rowCitation: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rowText: { color: colors.textSecondary, fontFamily: fonts.display, fontSize: 15, lineHeight: 21 },
  removeButton: { padding: spacing.md },
});
