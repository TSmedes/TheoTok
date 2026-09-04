import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopScrim } from '@/components/TopScrim';
import type { ContentType } from '@/content/types';
import { useSaved } from '@/store/saved';
import { useSavedItems } from '@/store/savedCards';
import { colors, fonts, gradients, maxCardWidth, spacing } from '@/theme/tokens';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const remove = useSaved((s) => s.remove);
  const items = useSavedItems();

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
          {/*
            The row is a plain View with two buttons side by side rather than a
            remove button nested inside a pressable row. React Native Web renders
            anything with `accessibilityRole="button"` as a real <button>, and a
            button inside a button is invalid DOM — React warns about it and the
            browser's own behaviour for the inner one is undefined.
          */}
          {items.map(({ card, rendered }, index) => (
            <View key={card.id} style={styles.row}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/saved-card', params: { index: String(index) } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${rendered.citation}. Open card.`}
                style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}>
                <View style={[styles.stripe, { backgroundColor: accentFor(rendered.type) }]} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowCitation}>{rendered.citation}</Text>
                  <Text style={styles.rowText} numberOfLines={2}>
                    {rendered.prompt ?? rendered.body}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove(card.id)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${rendered.citation} from saved`}
                style={styles.removeButton}>
                <Ionicons name="close" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
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
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  // The stripe lives inside the pressable half so it dims with the row's text
  // rather than staying lit beside it.
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
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
  removeButton: { padding: spacing.md, justifyContent: 'center' },
});
