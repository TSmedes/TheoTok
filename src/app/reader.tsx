import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { citationName } from '@/content/books';
import { loadBook } from '@/content/bible/loader';
import type { BibleBook } from '@/content/bible/types';
import { loadConfession } from '@/content/confessions/loader';
import type { ConfessionDocument } from '@/content/confessions/types';
import { contextWindow } from '@/content/confessions/window';
import { CARDS, SOURCES_BY_ID, toRendered } from '@/content/library';
import { formatLocus, formatRef } from '@/content/render';
import type { Card, DoctrineCard, Ref, Source } from '@/content/types';
import { useMotionPreference } from '@/motion/useMotionPreference';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

/**
 * How far above the cited passage the scroll comes to rest. Enough for a line
 * of what came before to show, so the passage reads as part of something rather
 * than as the top of the page.
 */
const LEAD_IN = 64;

/**
 * Reading a card in context. For Scripture that means the whole chapter with
 * the cited verses marked; for a confession or a piece of history it means the
 * work it came from, and the passages behind it.
 */
export default function ReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();

  const card = CARDS.find((c) => c.id === cardId);
  const { scrollRef, onCitedLayout, onScrollBeginDrag } = useCitedScroll(cardId);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.close}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        onScrollBeginDrag={onScrollBeginDrag}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        {card ? (
          <ReaderBody card={card} onCitedLayout={onCitedLayout} />
        ) : (
          <Text style={styles.body}>Card not found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Offsets of the cited passage, reported by two `onLayout` callbacks: one on
 * the list container and one on the cited row within it.
 *
 * Measuring this way rather than with refs and `measureLayout` keeps native and
 * web on the same code path, and the arithmetic is the whole of it — a row's
 * layout `y` is relative to its parent, so the two add up to an offset into the
 * scroll content.
 */
export interface CitedLayout {
  onContainerLayout: (e: LayoutChangeEvent) => void;
  onRowLayout: (e: LayoutChangeEvent) => void;
  /** Call before revealing content above the cited passage. */
  reanchor: () => void;
}

/**
 * Brings the cited passage into view once it exists.
 *
 * The sheet opens at the top and then travels, so the movement itself says how
 * far into the chapter the verse sits — opening already scrolled would hide
 * that. Three things keep it honest:
 *
 * - It waits for both layout offsets rather than a timer. The passage is not on
 *   screen at first paint: the book loads asynchronously, and on web that is a
 *   real fetch of a few hundred kilobytes.
 * - It fires once per card. Re-scrolling on a later layout pass would fight the
 *   reader every time an image or a font settled.
 * - It yields to the reader. Someone who has already started scrolling has said
 *   where they want to be, and we do not know better.
 */
function useCitedScroll(cardId: string | undefined) {
  const scrollRef = useRef<ScrollView>(null);
  const motion = useMotionPreference();

  const containerY = useRef<number | null>(null);
  const rowY = useRef<number | null>(null);
  const done = useRef(false);
  const dragged = useRef(false);
  const instant = useRef(false);

  // A new card is a new passage: forget where the last one was.
  useEffect(() => {
    containerY.current = null;
    rowY.current = null;
    done.current = false;
    dragged.current = false;
    instant.current = false;
  }, [cardId]);

  const attempt = useCallback(() => {
    if (done.current || dragged.current) return;
    if (containerY.current == null || rowY.current == null) return;

    done.current = true;
    scrollRef.current?.scrollTo({
      y: Math.max(0, containerY.current + rowY.current - LEAD_IN),
      // Gentle keeps the fades and drops the movement everywhere else in the
      // app; a sheet that lurches would be the one exception. A re-anchor is
      // never animated: it exists to look like nothing moved.
      animated: !instant.current && motion !== 'reduced',
    });
    instant.current = false;
  }, [motion]);

  /**
   * Puts the cited passage back where it was after content appears above it.
   *
   * Revealing the earlier half of a confession inserts articles above the
   * viewport, which would otherwise shove the reader down the page by however
   * long those articles happen to be. Re-running the measurement pins them to
   * the passage they were reading instead.
   */
  const reanchor = useCallback(() => {
    rowY.current = null;
    done.current = false;
    dragged.current = false;
    instant.current = true;
  }, []);

  const onCitedLayout: CitedLayout = {
    onContainerLayout: useCallback(
      (e: LayoutChangeEvent) => {
        containerY.current = e.nativeEvent.layout.y;
        attempt();
      },
      [attempt],
    ),
    onRowLayout: useCallback(
      (e: LayoutChangeEvent) => {
        rowY.current = e.nativeEvent.layout.y;
        attempt();
      },
      [attempt],
    ),
    reanchor,
  };

  const onScrollBeginDrag = useCallback(() => {
    dragged.current = true;
  }, []);

  return { scrollRef, onCitedLayout, onScrollBeginDrag };
}

function ReaderBody({ card, onCitedLayout }: { card: Card; onCitedLayout: CitedLayout }) {
  const rendered = toRendered(card);

  if (card.type === 'scripture') {
    return (
      <ChapterView refOf={card.ref} citation={rendered.citation} onCitedLayout={onCitedLayout} />
    );
  }

  const source = SOURCES_BY_ID.get(card.sourceId);

  // A confession we imported whole can show the article among its neighbours.
  // The hand-written cards cite works this pipeline never touched, and history
  // cards are our own prose over a secondary source: for those there is nothing
  // surrounding to show, and the card itself is the whole of what we have.
  const inDocument = card.type === 'doctrine' && card.docIndex != null && source;

  return (
    <>
      {inDocument ? (
        <DocumentView
          card={card as DoctrineCard}
          source={source}
          citation={rendered.citation}
          onCitedLayout={onCitedLayout}
        />
      ) : (
        <>
          <Text style={styles.citation}>{rendered.citation}</Text>
          {rendered.prompt ? <Text style={styles.prompt}>{rendered.prompt}</Text> : null}
          <Text style={styles.body}>{rendered.body}</Text>
        </>
      )}

      {source ? (
        <View style={styles.sourceBlock}>
          <Text style={styles.sectionLabel}>SOURCE</Text>
          <Text style={styles.sourceTitle}>
            {source.author ? `${source.author}, ` : ''}
            {source.title}
          </Text>
          {source.year ? <Text style={styles.sourceMeta}>{source.year}</Text> : null}
          {/*
            `licenseNote` is deliberately not shown. It records where a text was
            transcribed from and under what terms — bookkeeping the project
            needs and a reader does not. Telling someone the Westminster
            Catechism came via a GitHub repository says nothing about the
            Westminster Catechism.
          */}
        </View>
      ) : null}

      {card.type === 'doctrine' && card.proofTexts?.length ? (
        <View style={styles.sourceBlock}>
          <Text style={styles.sectionLabel}>PROOF TEXTS</Text>
          {card.proofTexts.map((ref) => (
            <ProofText key={formatRef(ref)} refOf={ref} />
          ))}
        </View>
      ) : null}
    </>
  );
}

function ProofText({ refOf }: { refOf: Ref }) {
  const { book, error } = useBook(refOf.book);
  const text = book ? versesFor(book, refOf) : undefined;
  return (
    <View style={styles.proof}>
      <Text style={styles.proofRef}>{formatRef(refOf)}</Text>
      <Text style={styles.proofText}>{error ?? text ?? '…'}</Text>
    </View>
  );
}

function ChapterView({
  refOf,
  citation,
  onCitedLayout,
}: {
  refOf: Ref;
  citation: string;
  onCitedLayout: CitedLayout;
}) {
  const { book, error } = useBook(refOf.book);

  if (error) return <Text style={styles.body}>{error}</Text>;
  if (!book) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const chapter = book.chapters[String(refOf.chapter)] ?? {};
  const subtitle = book.subtitles?.[String(refOf.chapter)];
  const last = refOf.verseEnd ?? refOf.verseStart;

  // Numeric sort: JSON object keys are strings, so "10" must not sort before "2".
  const verseNumbers = Object.keys(chapter)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <Text style={styles.citation}>{citation}</Text>
      <Text style={styles.chapterTitle}>
        {citationName(refOf.book)} {refOf.chapter}
      </Text>
      {/* The citation and the chapter title have both already named the book. */}
      <Text style={styles.sourceMeta}>New Revised Standard Version</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.chapter} onLayout={onCitedLayout.onContainerLayout}>
        {verseNumbers.map((n) => {
          const cited = n >= refOf.verseStart && n <= last;
          return (
            <Text
              key={n}
              // Only the first cited verse is measured: it is where the reader
              // should land, and a range would otherwise report its last line.
              onLayout={n === refOf.verseStart ? onCitedLayout.onRowLayout : undefined}
              style={[styles.verse, cited && styles.verseCited]}>
              <Text style={styles.verseNumber}>{n} </Text>
              {chapter[String(n)]}
            </Text>
          );
        })}
      </View>
    </>
  );
}

/**
 * A confession article among the ones either side of it — the doctrine
 * equivalent of reading a verse in its chapter.
 *
 * It opens on a window rather than the whole work because these run long: the
 * Second Helvetic Confession is 278 articles, and nobody arriving from one card
 * wants all of them first. The whole document is one tap away at either end.
 *
 * The text here is the document, not the cards. A card is an excerpt trimmed to
 * fit — a long answer is dropped from the feed entirely, and a long article is
 * split into "part 2 of 3" pieces. Reading in context should show the
 * confession as it was written, so it does.
 */
function DocumentView({
  card,
  source,
  citation,
  onCitedLayout,
}: {
  card: DoctrineCard;
  source: Source;
  citation: string;
  onCitedLayout: CitedLayout;
}) {
  const { document, error } = useConfession(card.sourceId);
  const [expandedBefore, setExpandedBefore] = useState(false);
  const [expandedAfter, setExpandedAfter] = useState(false);

  if (error) return <Text style={styles.body}>{error}</Text>;
  if (!document) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { entries } = document;
  const current = card.docIndex ?? 0;
  const { from, to, hasEarlier, hasLater } = contextWindow(current, entries.length, {
    before: expandedBefore,
    after: expandedAfter,
  });

  return (
    <>
      <Text style={styles.citation}>{citation}</Text>
      <Text style={styles.chapterTitle}>{source.shortTitle ?? source.title}</Text>
      {source.year ? <Text style={styles.sourceMeta}>{source.year}</Text> : null}

      <View style={styles.chapter} onLayout={onCitedLayout.onContainerLayout}>
        <Expander
          label="Earlier in this work"
          icon="chevron-up"
          hidden={!hasEarlier}
          onPress={() => {
            onCitedLayout.reanchor();
            setExpandedBefore(true);
          }}
        />

        {entries.slice(from, to).map((entry, i) => {
          const index = from + i;
          const cited = index === current;
          return (
            <View
              key={index}
              onLayout={cited ? onCitedLayout.onRowLayout : undefined}
              style={[styles.entry, cited && styles.entryCited]}>
              {entry.locus ? (
                <Text style={styles.entryLocus}>{formatLocus(source, entry.locus)}</Text>
              ) : null}
              {entry.title ? <Text style={styles.entryTitle}>{entry.title}</Text> : null}
              {entry.prompt ? <Text style={styles.entryPrompt}>{entry.prompt}</Text> : null}
              <Text style={[styles.verse, cited && styles.entryCitedText]}>{entry.body}</Text>
            </View>
          );
        })}

        <Expander
          label="Later in this work"
          icon="chevron-down"
          hidden={!hasLater}
          onPress={() => setExpandedAfter(true)}
        />
      </View>
    </>
  );
}

function Expander({
  label,
  icon,
  hidden,
  onPress,
}: {
  label: string;
  icon: 'chevron-up' | 'chevron-down';
  hidden: boolean;
  onPress: () => void;
}) {
  if (hidden) return null;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.expander}>
      <Ionicons name={icon} size={14} color={colors.accent} />
      <Text style={styles.expanderLabel}>{label}</Text>
    </Pressable>
  );
}

/** Loads a book on demand — from the bundle on native, over HTTP on web. */
function useBook(id: Ref['book']) {
  const [book, setBook] = useState<BibleBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBook(null);
    setError(null);
    loadBook(id)
      .then((loaded) => {
        if (!cancelled) setBook(loaded);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this passage.');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { book, error };
}

/** The same on-demand shape as `useBook`, for confession documents. */
function useConfession(sourceId: string) {
  const [document, setDocument] = useState<ConfessionDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDocument(null);
    setError(null);
    loadConfession(sourceId)
      .then((loaded) => {
        if (!cancelled) setDocument(loaded);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this work.');
      });
    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  return { document, error };
}

function versesFor(book: BibleBook, ref: Ref): string {
  const chapter = book.chapters[String(ref.chapter)];
  if (!chapter) return '';
  const last = ref.verseEnd ?? ref.verseStart;
  const parts: string[] = [];
  for (let v = ref.verseStart; v <= last; v++) {
    if (chapter[String(v)]) parts.push(chapter[String(v)]);
  }
  return parts.join(' ');
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  close: { padding: spacing.xs },
  content: {
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: maxCardWidth,
    alignSelf: 'center',
  },
  citation: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chapterTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textTertiary,
    fontFamily: fonts.display,
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  chapter: { marginTop: spacing.lg, gap: spacing.sm },
  verse: {
    color: colors.textSecondary,
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 27,
  },
  verseCited: { color: colors.text, backgroundColor: 'rgba(228,192,122,0.14)' },
  verseNumber: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 11,
  },
  entry: { gap: 2 },
  // Scripture marks the cited verse with a wash of colour behind the text. An
  // article is a block rather than a line, so it takes a rule down its edge
  // instead — the same signal at a scale that suits the shape of the thing.
  entryCited: {
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.md,
    marginLeft: -spacing.md - 2,
  },
  entryCitedText: { color: colors.text },
  entryLocus: {
    color: colors.textTertiary,
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  entryTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.display,
    fontSize: 15,
    fontStyle: 'italic',
  },
  entryPrompt: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 17,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  expander: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  expanderLabel: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  prompt: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: 19,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 29,
  },
  sourceBlock: { marginTop: spacing.xl, gap: spacing.xs },
  sectionLabel: {
    color: colors.accent,
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  sourceTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 17 },
  sourceMeta: { color: colors.textTertiary, fontFamily: fonts.ui, fontSize: 13, lineHeight: 19 },
  proof: { marginTop: spacing.md, gap: 2 },
  proofRef: { color: colors.textSecondary, fontFamily: fonts.ui, fontSize: 12, fontWeight: '600' },
  proofText: { color: colors.textSecondary, fontFamily: fonts.display, fontSize: 16, lineHeight: 25 },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
});
