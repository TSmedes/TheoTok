import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ActionRail } from '@/components/ActionRail';
import { Card } from '@/components/Card';
import { Feed } from '@/components/Feed';
import { ShareCard } from '@/components/ShareCard';
import type { Card as CardData, RenderedCard } from '@/content/types';
import { useFeed, type FeedPage } from '@/feed/useFeed';
import { useFeedSession } from '@/store/feedSession';
import { usePreferences } from '@/store/preferences';
import { shareCard } from '@/share/shareCard';
import { useSpeech } from '@/store/speech';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

export default function FeedScreen() {
  const router = useRouter();
  const { pages, poolSize, initialIndex, onIndexChange } = useFeed();
  const stopSpeech = useSpeech((s) => s.stop);
  const revealAnswers = usePreferences((s) => s.revealAnswers);
  const revealed = useFeedSession((s) => s.revealed);
  const reveal = useFeedSession((s) => s.reveal);

  // One capture target for the whole screen, swapped to whichever card is being
  // shared — far cheaper than mounting a hidden copy behind every page.
  const [shareTarget, setShareTarget] = useState<RenderedCard | null>(null);
  const shareRef = useRef<View>(null);

  const handleShare = useCallback(async (rendered: RenderedCard) => {
    setShareTarget(rendered);
    // Let the off-screen card lay out before photographing it.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    try {
      await shareCard({ card: rendered, target: shareRef });
    } finally {
      setShareTarget(null);
    }
  }, []);

  const handleRead = useCallback(
    (card: CardData) => {
      router.push({ pathname: '/reader', params: { cardId: card.id } });
    },
    [router],
  );

  const handleIndexChange = useCallback(
    (index: number) => {
      // Reading aloud should not follow you to the next card.
      stopSpeech();
      onIndexChange(index);
    },
    [onIndexChange, stopSpeech],
  );

  if (pages.length === 0) return <EmptyPool />;

  return (
    <View style={styles.root}>
      <Feed<FeedPage>
        data={pages}
        keyExtractor={(page, index) => `${page.card.id}:${index}`}
        renderItem={({ item }) => {
          const withheld =
            revealAnswers && item.rendered.cue != null && !revealed.includes(item.card.id);
          return (
            <View style={styles.page}>
              <Card
                card={item.rendered}
                hidden={withheld}
                onReveal={() => reveal(item.card.id)}
              />
              {item.startsNewCycle ? <CycleDivider /> : null}
              <ActionRail
                card={item.card}
                rendered={item.rendered}
                onShare={handleShare}
                onRead={handleRead}
                hidden={withheld}
                onReveal={() => reveal(item.card.id)}
              />
            </View>
          );
        }}
        initialIndex={initialIndex}
        onIndexChange={handleIndexChange}
      />

      {poolSize > 0 && poolSize < 5 ? <ThinPoolNotice count={poolSize} /> : null}
      {shareTarget && Platform.OS !== 'web' ? (
        <ShareCard ref={shareRef} card={shareTarget} />
      ) : null}
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
  page: { flex: 1 },
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
