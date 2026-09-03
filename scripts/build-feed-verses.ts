/**
 * Build-time only. Collects every scripture reference the card library actually
 * cites and writes just those verses to `src/content/bible/feed-verses.json`.
 *
 * This is tier one of the two-tier data plan. The full KJV is ~5 MB, which is
 * fine to ship but far too much to parse before first paint; this slice is a
 * couple of hundred KB, is loaded eagerly, and lets the feed render instantly.
 * The per-book files stay on disk for the reader sheet to load on demand.
 *
 *   node scripts/build-feed-verses.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { refKey } from '../src/content/refs.ts';
import type { Card, Ref } from '../src/content/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'src', 'content', 'bible', 'kjv');
const CARDS_DIR = join(ROOT, 'src', 'content', 'cards');
const OUT = join(ROOT, 'src', 'content', 'bible', 'feed-verses.json');

interface BibleBook {
  chapters: Record<string, Record<string, string>>;
}

const bookCache = new Map<string, BibleBook>();
function loadBook(id: string): BibleBook {
  let book = bookCache.get(id);
  if (!book) {
    const path = join(KJV_DIR, `${id}.json`);
    if (!existsSync(path)) throw new Error(`Missing Bible data for ${id}. Run scripts/build-bible.ts first.`);
    book = JSON.parse(readFileSync(path, 'utf8')) as BibleBook;
    bookCache.set(id, book);
  }
  return book;
}

/** Joins a verse range into one paragraph, dropping the verse numbers. */
export function resolveRef(ref: Ref): string {
  const chapter = loadBook(ref.book).chapters[String(ref.chapter)];
  if (!chapter) throw new Error(`${refKey(ref)}: chapter does not exist`);
  const last = ref.verseEnd ?? ref.verseStart;
  const parts: string[] = [];
  for (let v = ref.verseStart; v <= last; v++) {
    const text = chapter[String(v)];
    if (!text) throw new Error(`${refKey(ref)}: verse ${v} does not exist`);
    parts.push(text);
  }
  return parts.join(' ');
}

export function loadCards(): Card[] {
  const cards: Card[] = [];
  for (const name of ['scripture', 'doctrine', 'history']) {
    const path = join(CARDS_DIR, `${name}.json`);
    if (!existsSync(path)) continue;
    cards.push(...(JSON.parse(readFileSync(path, 'utf8')) as Card[]));
  }
  return cards;
}

/** Every ref the library needs text for: card refs plus catechism proof texts. */
export function collectRefs(cards: Card[]): Ref[] {
  const seen = new Map<string, Ref>();
  for (const card of cards) {
    if (card.type === 'scripture') seen.set(refKey(card.ref), card.ref);
    if (card.type === 'doctrine') {
      for (const ref of card.proofTexts ?? []) seen.set(refKey(ref), ref);
    }
  }
  return [...seen.values()];
}

function main() {
  const cards = loadCards();
  const refs = collectRefs(cards);

  const slice: Record<string, string> = {};
  for (const ref of refs) slice[refKey(ref)] = resolveRef(ref);

  const json = JSON.stringify(slice, null, 2);
  writeFileSync(OUT, json + '\n');

  const lengths = Object.entries(slice).map(([k, v]) => ({ k, n: v.length }));
  lengths.sort((a, b) => b.n - a.n);

  console.log(`Wrote ${refs.length} references to src/content/bible/feed-verses.json`);
  console.log(`  size: ${(json.length / 1024).toFixed(1)} KB`);
  console.log(`\n  longest passages:`);
  for (const { k, n } of lengths.slice(0, 8)) {
    console.log(`    ${String(n).padStart(4)} chars  ${k}`);
  }
}

main();
