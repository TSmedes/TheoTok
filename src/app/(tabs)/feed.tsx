import { StyleSheet, Text, View } from 'react-native';

import { CardDeck } from '@/components/CardDeck';
import { useFeed, type FeedPage } from '@/feed/useFeed';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

export default function FeedScreen() {
  const { pages, poolSize, initialIndex, onIndexChange } = useFeed();

  if (pages.length === 0) return <EmptyPool />;

  return (
    <View style={styles.root}>
      <CardDeck<FeedPage>
        data={pages}
        keyExtractor={(page, index) => `${page.card.id}:${index}`}
        initialIndex={initialIndex}
        onIndexChange={onIndexChange}
        renderOverlay={(page) => (page.startsNewCycle ? <CycleDivider /> : null)}
      />

      {poolSize > 0 && poolSize < 5 ? <ThinPoolNotice count={poolSize} /> : null}
    </View>
  );
}

/** Reached only if every content type is off, or the library is empty. */
function EmptyPool() {
  return (
    <View style={[styles.root, styles.centred]}>
      <Text style={styles.emptyTitle}>Nothing to show</Text>
      <Text style={styles.emptyBody}>
        No cards match your filters. Turn a content type back on under Filters.
      </Text>
    </View>
  );
}

/** Marks the seam where the pool ran out and started over, rather than looping silently. */
function CycleDivider() {
  return (
    <View style={styles.divider} pointerEvents="none">
      <Text style={styles.dividerText}>You have seen everything — starting again</Text>
    </View>
  );
}

/**
 * A narrow filter is a legitimate choice, not an error — but a three-card feed
 * that loops straight away looks broken, so it says so plainly instead.
 */
function ThinPoolNotice({ count }: { count: number }) {
  return (
    <View style={styles.notice} pointerEvents="none">
      <Text style={styles.noticeText}>
        Only {count} {count === 1 ? 'card' : 'cards'} match your filters
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
  centred: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    color: colors.textSecondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  notice: {
    position: 'absolute',
    top: spacing.xxl,
    alignSelf: 'center',
    maxWidth: maxCardWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.scrim,
  },
  noticeText: { color: colors.textSecondary, fontFamily: fonts.ui, fontSize: 12, letterSpacing: 0.3 },
  divider: {
    position: 'absolute',
    top: spacing.xxl,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentDim,
    backgroundColor: colors.scrim,
  },
  dividerText: { color: colors.accent, fontFamily: fonts.ui, fontSize: 12, letterSpacing: 0.3 },
});
