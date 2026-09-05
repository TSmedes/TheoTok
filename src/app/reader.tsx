import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bookMeta, citationName } from '@/content/books';
import { loadBook } from '@/content/bible/loader';
import type { BibleBook } from '@/content/bible/types';
import { CARDS, SOURCES_BY_ID, toRendered } from '@/content/library';
import { formatRef } from '@/content/render';
import type { Card, Ref } from '@/content/types';
import { colors, fonts, maxCardWidth, spacing } from '@/theme/tokens';

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        {card ? <ReaderBody card={card} /> : <Text style={styles.body}>Card not found.</Text>}
      </ScrollView>
    </View>
  );
}

function ReaderBody({ card }: { card: Card }) {
  const rendered = toRendered(card);

  if (card.type === 'scripture') {
    return <ChapterView refOf={card.ref} citation={rendered.citation} />;
  }

  const source = SOURCES_BY_ID.get(card.sourceId);

  return (
    <>
      <Text style={styles.citation}>{rendered.citation}</Text>
      {rendered.prompt ? <Text style={styles.prompt}>{rendered.prompt}</Text> : null}
      <Text style={styles.body}>{rendered.body}</Text>

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

function ChapterView({ refOf, citation }: { refOf: Ref; citation: string }) {
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
      <Text style={styles.sourceMeta}>{bookMeta(refOf.book).name} · New Revised Standard Version</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.chapter}>
        {verseNumbers.map((n) => {
          const cited = n >= refOf.verseStart && n <= last;
          return (
            <Text key={n} style={[styles.verse, cited && styles.verseCited]}>
              <Text style={styles.verseNumber}>{n} </Text>
              {chapter[String(n)]}
            </Text>
          );
        })}
      </View>
    </>
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
