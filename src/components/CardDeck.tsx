import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ActionRail } from '@/components/ActionRail';
import { Card } from '@/components/Card';
import { CardSurface } from '@/components/Card/CardSurface';
import { Feed } from '@/components/Feed';
import { GradientBackdrop } from '@/components/GradientBackdrop';
import { ShareCard } from '@/components/ShareCard';
import { CONTENT_TYPES, type Card as CardData, type RenderedCard } from '@/content/types';
import { cardLanded } from '@/motion/haptics';
import { shareCard } from '@/share/shareCard';
import { useFeedSession } from '@/store/feedSession';
import { usePreferences } from '@/store/preferences';
import { useSpeech } from '@/store/speech';
import { colors } from '@/theme/tokens';

export interface DeckItem {
  card: CardData;
  rendered: RenderedCard;
}

interface Props<T extends DeckItem> {
  data: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Anything the host screen wants drawn over a given page, such as a notice. */
  renderOverlay?: (item: T, index: number) => ReactNode;
}

/**
 * A full-screen, swipeable stack of cards with their action rail.
 *
 * The feed and the saved collection are the same reading experience over
 * different lists, so they share this rather than each assembling `Feed`,
 * `Card`, `ActionRail` and the off-screen share target for themselves.
 */
export function CardDeck<T extends DeckItem>({
  data,
  keyExtractor,
  initialIndex,
  onIndexChange,
  renderOverlay,
}: Props<T>) {
  const router = useRouter();
  const stopSpeech = useSpeech((s) => s.stop);
  const revealAnswers = usePreferences((s) => s.revealAnswers);
  const revealed = useFeedSession((s) => s.revealed);
  const reveal = useFeedSession((s) => s.reveal);
  const hide = useFeedSession((s) => s.hide);

  /**
   * The feed's colours, as indices rather than names: the backdrop reads this
   * inside a worklet on every frame, and a list of small numbers crosses to the
   * UI thread far more cheaply than a list of strings.
   *
   * Read off the card rather than the rendered card, because this is the one
   * place that touches every item in the list. `rendered` is a lazy getter — ask
   * it for the type here and the whole pool renders on every filter change, for
   * a value the raw card already carries.
   */
  const types = useMemo(() => data.map((item) => CONTENT_TYPES.indexOf(item.card.type)), [data]);

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
      // Fired here, on the landing, rather than when the animations switch
      // cards at the halfway crossing: a fling that crosses ten cards should
      // land once, not buzz ten times on the way past.
      cardLanded();
      onIndexChange?.(index);
    },
    [onIndexChange, stopSpeech],
  );

  return (
    <View style={styles.root}>
      <Feed<T>
        data={data}
        keyExtractor={keyExtractor}
        renderItem={({ item, index, isActive, height, scrollY }) => {
          const withheld =
            revealAnswers && item.rendered.cue != null && !revealed.includes(item.card.id);
          return (
            <CardSurface isActive={isActive} index={index} height={height} scrollY={scrollY}>
              <Card
                card={item.rendered}
                hidden={withheld}
                onReveal={() => reveal(item.card.id)}
                // Only offered in question-and-answer mode: with the setting off
                // there is no question to go back to.
                onHide={revealAnswers ? () => hide(item.card.id) : undefined}
              />
              {renderOverlay?.(item, index)}
              <ActionRail
                card={item.card}
                rendered={item.rendered}
                onShare={handleShare}
                onRead={handleRead}
                hidden={withheld}
                onReveal={() => reveal(item.card.id)}
              />
            </CardSurface>
          );
        }}
        renderBackdrop={({ scrollY, height }) => (
          <GradientBackdrop types={types} scrollY={scrollY} height={height} />
        )}
        initialIndex={initialIndex}
        onIndexChange={handleIndexChange}
      />

      {shareTarget && Platform.OS !== 'web' ? (
        <ShareCard ref={shareRef} card={shareTarget} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
});
